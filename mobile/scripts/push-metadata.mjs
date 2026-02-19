#!/usr/bin/env node
/**
 * Push metadata to App Store Connect using API Key
 * No Apple ID login needed!
 */
import { readFileSync } from 'fs';
import { sign } from 'crypto';
import { createPrivateKey } from 'crypto';

const KEY_ID = 'ZR6H3P77RU';
const ISSUER_ID = '16b1bc8e-5a12-4788-b4d2-4c9ebe0068fb';
const APP_ID = '6758265568';
const KEY_PATH = new URL('../certs/AuthKey_ZR6H3P77RU.p8', import.meta.url).pathname;

// Generate JWT for App Store Connect API
function generateJWT() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: KEY_ID, typ: 'JWT' };
  const payload = { iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' };
  
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const headerB64 = b64(header);
  const payloadB64 = b64(payload);
  const signingInput = `${headerB64}.${payloadB64}`;
  
  const key = createPrivateKey(readFileSync(KEY_PATH, 'utf8'));
  const signature = sign('sha256', Buffer.from(signingInput), { key, dsaEncoding: 'ieee-p1363' });
  
  return `${signingInput}.${signature.toString('base64url')}`;
}

const token = generateJWT();
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
};
const BASE = 'https://api.appstoreconnect.apple.com/v1';

async function api(path, method = 'GET', body = null) {
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  if (!res.ok) {
    console.error(`API ${method} ${path} → ${res.status}`);
    console.error(text.substring(0, 500));
    return null;
  }
  return text ? JSON.parse(text) : null;
}

// Get app info
async function getAppInfo() {
  const data = await api(`/apps/${APP_ID}?include=appInfos,appStoreVersions`);
  if (!data) process.exit(1);
  console.log('✓ App found:', data.data.attributes.name);
  return data;
}

// Get or create app store version
async function getAppStoreVersion() {
  const data = await api(`/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&filter[appStoreState]=PREPARE_FOR_SUBMISSION,READY_FOR_SALE,WAITING_FOR_REVIEW,IN_REVIEW`);
  if (data?.data?.length > 0) {
    console.log('✓ Found version:', data.data[0].attributes.versionString, '- state:', data.data[0].attributes.appStoreState);
    return data.data[0];
  }
  // Create new version
  console.log('Creating new app store version 1.0.0...');
  const created = await api('/appStoreVersions', 'POST', {
    data: {
      type: 'appStoreVersions',
      attributes: { platform: 'IOS', versionString: '1.0.0' },
      relationships: { app: { data: { type: 'apps', id: APP_ID } } }
    }
  });
  if (created) console.log('✓ Created version:', created.data.id);
  return created?.data;
}

// Update app store version localizations
async function updateLocalizations(versionId) {
  // Get existing localizations
  const data = await api(`/appStoreVersions/${versionId}/appStoreVersionLocalizations`);
  const existing = {};
  for (const loc of (data?.data || [])) {
    existing[loc.attributes.locale] = loc.id;
  }
  
  const locales = {
    'vi': {
      description: readFileSync(new URL('../fastlane/metadata/vi/description.txt', import.meta.url), 'utf8').trim(),
      keywords: readFileSync(new URL('../fastlane/metadata/vi/keywords.txt', import.meta.url), 'utf8').trim(),
      promotionalText: readFileSync(new URL('../fastlane/metadata/vi/promotional_text.txt', import.meta.url), 'utf8').trim(),
      supportUrl: 'https://www.dinedate.vn/support',
      marketingUrl: 'https://www.dinedate.vn',
    },
    'en-US': {
      description: readFileSync(new URL('../fastlane/metadata/en-US/description.txt', import.meta.url), 'utf8').trim(),
      keywords: readFileSync(new URL('../fastlane/metadata/en-US/keywords.txt', import.meta.url), 'utf8').trim(),
      promotionalText: readFileSync(new URL('../fastlane/metadata/en-US/promotional_text.txt', import.meta.url), 'utf8').trim(),
      supportUrl: 'https://www.dinedate.vn/support',
      marketingUrl: 'https://www.dinedate.vn',
    }
  };
  
  for (const [locale, attrs] of Object.entries(locales)) {
    if (existing[locale]) {
      // Update existing
      const res = await api(`/appStoreVersionLocalizations/${existing[locale]}`, 'PATCH', {
        data: { type: 'appStoreVersionLocalizations', id: existing[locale], attributes: attrs }
      });
      console.log(res ? `✓ Updated ${locale} localization` : `✗ Failed to update ${locale}`);
    } else {
      // Create new
      const res = await api('/appStoreVersionLocalizations', 'POST', {
        data: {
          type: 'appStoreVersionLocalizations',
          attributes: { locale, ...attrs },
          relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } } }
        }
      });
      console.log(res ? `✓ Created ${locale} localization` : `✗ Failed to create ${locale}`);
    }
  }
}

// Update app info localizations (title, subtitle, privacy policy)
async function updateAppInfoLocalizations() {
  // Get current app info
  const appInfos = await api(`/apps/${APP_ID}/appInfos`);
  if (!appInfos?.data?.length) { console.error('No appInfos found'); return; }
  const appInfoId = appInfos.data[0].id;
  
  const locs = await api(`/appInfos/${appInfoId}/appInfoLocalizations`);
  const existing = {};
  for (const loc of (locs?.data || [])) {
    existing[loc.attributes.locale] = loc.id;
  }
  
  const infoLocales = {
    'vi': {
      name: 'DineDate - Hẹn ăn tối',
      subtitle: 'Nhà hàng & hẹn hò ẩn danh',
      privacyPolicyUrl: 'https://www.dinedate.vn/privacy',
    },
    'en-US': {
      name: 'DineDate - Dinner Dating',
      subtitle: 'Restaurants & blind dates',
      privacyPolicyUrl: 'https://www.dinedate.vn/privacy',
    }
  };
  
  for (const [locale, attrs] of Object.entries(infoLocales)) {
    if (existing[locale]) {
      const res = await api(`/appInfoLocalizations/${existing[locale]}`, 'PATCH', {
        data: { type: 'appInfoLocalizations', id: existing[locale], attributes: attrs }
      });
      console.log(res ? `✓ Updated ${locale} app info` : `✗ Failed to update ${locale} app info`);
    } else {
      const res = await api('/appInfoLocalizations', 'POST', {
        data: {
          type: 'appInfoLocalizations',
          attributes: { locale, ...attrs },
          relationships: { appInfo: { data: { type: 'appInfos', id: appInfoId } } }
        }
      });
      console.log(res ? `✓ Created ${locale} app info` : `✗ Failed to create ${locale} app info`);
    }
  }
  
  // Set categories
  const catData = await api(`/appInfos/${appInfoId}?include=primaryCategory,secondaryCategory`);
  await api(`/appInfos/${appInfoId}`, 'PATCH', {
    data: {
      type: 'appInfos', id: appInfoId,
      relationships: {
        primaryCategory: { data: { type: 'appCategories', id: 'SOCIAL_NETWORKING' } },
        secondaryCategory: { data: { type: 'appCategories', id: 'FOOD_AND_DRINK' } },
      }
    }
  });
  console.log('✓ Updated categories: Social Networking + Food & Drink');
}

// Update review information
async function updateReviewInfo(versionId) {
  const ri = await api(`/appStoreVersions/${versionId}/appStoreReviewDetail`);
  const attrs = {
    contactFirstName: 'Tien Duong',
    contactLastName: 'Le',
    contactEmail: 'support@dinedate.vn',
    contactPhone: '+84 1900 1234',
    demoAccountName: 'demo@dinedate.vn',
    demoAccountPassword: 'DineDate2026!',
    demoAccountRequired: true,
    notes: 'Demo account has sample restaurant data and date orders for review. The app requires login. Top-up uses QR bank transfer (BIDV) — no real transfer needed, just view the interface.',
  };
  
  if (ri?.data) {
    const res = await api(`/appStoreReviewDetails/${ri.data.id}`, 'PATCH', {
      data: { type: 'appStoreReviewDetails', id: ri.data.id, attributes: attrs }
    });
    console.log(res ? '✓ Updated review info' : '✗ Failed to update review info');
  } else {
    const res = await api('/appStoreReviewDetails', 'POST', {
      data: {
        type: 'appStoreReviewDetails', attributes: attrs,
        relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } } }
      }
    });
    console.log(res ? '✓ Created review info' : '✗ Failed to create review info');
  }
}

// Main
async function main() {
  console.log('=== DineDate App Store Metadata Push ===\n');
  
  await getAppInfo();
  const version = await getAppStoreVersion();
  if (!version) { console.error('Failed to get/create version'); process.exit(1); }
  
  console.log('\n--- Updating version localizations ---');
  await updateLocalizations(version.id);
  
  console.log('\n--- Updating app info ---');
  await updateAppInfoLocalizations();
  
  console.log('\n--- Updating review info ---');
  await updateReviewInfo(version.id);
  
  console.log('\n=== Done! Check App Store Connect ===');
  console.log(`https://appstoreconnect.apple.com/apps/${APP_ID}/appstore`);
}

main().catch(console.error);
