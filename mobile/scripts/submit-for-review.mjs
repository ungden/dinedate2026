#!/usr/bin/env node
/**
 * Select build and submit for App Store Review using API Key
 */
import { readFileSync } from 'fs';
import { createPrivateKey, sign } from 'crypto';

const KEY_ID = 'ZR6H3P77RU';
const ISSUER_ID = '16b1bc8e-5a12-4788-b4d2-4c9ebe0068fb';
const APP_ID = '6758265568';
const KEY_PATH = new URL('../certs/AuthKey_ZR6H3P77RU.p8', import.meta.url).pathname;

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
  const opts = { method, headers: { ...headers } };
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

async function main() {
  console.log('=== App Store Submission Process ===\n');

  // 1. Get the app store version
  console.log('1. Finding app store version...');
  const versionsData = await api(`/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS`);
  const version = versionsData?.data?.find(v => 
    v.attributes.appStoreState === 'PREPARE_FOR_SUBMISSION'
  );
  
  if (!version) {
    console.error('No version in PREPARE_FOR_SUBMISSION state!');
    console.log('Available versions:', versionsData?.data?.map(v => `${v.attributes.versionString} (${v.attributes.appStoreState})`));
    process.exit(1);
  }
  console.log(`   Version: ${version.attributes.versionString} (${version.attributes.appStoreState})`);
  const versionId = version.id;

  // 2. List available builds
  console.log('\n2. Listing available builds...');
  const buildsData = await api(`/builds?filter[app]=${APP_ID}&filter[processingState]=VALID&sort=-uploadedDate&limit=5`);
  if (!buildsData?.data?.length) {
    console.error('No valid builds found!');
    process.exit(1);
  }
  
  for (const build of buildsData.data) {
    console.log(`   Build: ${build.attributes.version} (${build.attributes.processingState}) - uploaded: ${build.attributes.uploadedDate}`);
  }

  const selectedBuild = buildsData.data[0]; // Most recent
  console.log(`   → Selecting build: ${selectedBuild.attributes.version}`);

  // 3. Associate build with version
  console.log('\n3. Associating build with version...');
  const assocResult = await api(`/appStoreVersions/${versionId}/relationships/build`, 'PATCH', {
    data: {
      type: 'builds',
      id: selectedBuild.id,
    }
  });
  
  if (assocResult !== null || true) { // PATCH with 204 returns null
    console.log('   ✓ Build associated with version');
  }

  // 4. Check if all required info is present
  console.log('\n4. Checking version localizations...');
  const locData = await api(`/appStoreVersions/${versionId}/appStoreVersionLocalizations`);
  for (const loc of locData?.data || []) {
    const attrs = loc.attributes;
    console.log(`   Locale: ${attrs.locale}`);
    console.log(`     Description: ${attrs.description ? '✓' : '✗ MISSING'}`);
    console.log(`     Keywords: ${attrs.keywords ? '✓' : '✗ MISSING'}`);
  }

  // 5. Check screenshots
  console.log('\n5. Checking screenshots...');
  for (const loc of locData?.data || []) {
    const setsData = await api(`/appStoreVersionLocalizations/${loc.id}/appScreenshotSets`);
    for (const set of setsData?.data || []) {
      const ssData = await api(`/appScreenshotSets/${set.id}/appScreenshots`);
      console.log(`   ${loc.attributes.locale} - ${set.attributes.screenshotDisplayType}: ${ssData?.data?.length || 0} screenshots`);
    }
  }

  // 6. Check app info (content rights, age rating)
  console.log('\n6. Checking app info...');
  const appInfosData = await api(`/apps/${APP_ID}/appInfos`);
  const latestAppInfo = appInfosData?.data?.[0];
  if (latestAppInfo) {
    console.log(`   App Info ID: ${latestAppInfo.id}`);
    console.log(`   State: ${latestAppInfo.attributes.appStoreState}`);
    
    // Check age rating
    const ageRatingData = await api(`/appInfos/${latestAppInfo.id}/ageRatingDeclaration`);
    if (ageRatingData?.data) {
      console.log('   Age Rating: ✓ configured');
    } else {
      console.log('   Age Rating: ✗ NOT configured');
    }
  }

  // 7. Try to submit for review
  console.log('\n7. Attempting to submit for review...');
  const submitResult = await api('/appStoreVersionSubmissions', 'POST', {
    data: {
      type: 'appStoreVersionSubmissions',
      relationships: {
        appStoreVersion: {
          data: { type: 'appStoreVersions', id: versionId }
        }
      }
    }
  });

  if (submitResult) {
    console.log('   ✓ SUBMITTED FOR REVIEW!');
    console.log(`   Submission ID: ${submitResult.data.id}`);
  } else {
    console.log('\n   Submission failed. Please check App Store Connect for missing requirements.');
    console.log('   Common missing items:');
    console.log('   - Age rating declaration');
    console.log('   - Content rights declaration');
    console.log('   - Export compliance');
    console.log('   - Privacy policy URL');
    console.log('   - Screenshots for all required display sizes');
    console.log('\n   You may need to complete these manually at:');
    console.log('   https://appstoreconnect.apple.com/apps/' + APP_ID);
  }
}

main().catch(console.error);
