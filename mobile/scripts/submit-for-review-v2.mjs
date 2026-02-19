#!/usr/bin/env node
/**
 * Submit for App Store Review using the newer reviewSubmissions API
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
  console.log(`  ${method} ${path} → ${res.status}`);
  if (!res.ok) {
    console.error(`  ${text.substring(0, 500)}`);
    return null;
  }
  return text ? JSON.parse(text) : null;
}

async function main() {
  console.log('=== Submit for App Store Review (v2 API) ===\n');

  // Method 1: Try reviewSubmissions (newer API)
  console.log('Trying reviewSubmissions API...');
  const result1 = await api('/reviewSubmissions', 'POST', {
    data: {
      type: 'reviewSubmissions',
      attributes: {
        platform: 'IOS',
      },
      relationships: {
        app: {
          data: { type: 'apps', id: APP_ID }
        }
      }
    }
  });

  if (result1) {
    const submissionId = result1.data.id;
    console.log(`Created review submission: ${submissionId}`);
    console.log(`State: ${result1.data.attributes.state}`);
    
    // Now add the version to the submission
    // First, get the version ID
    const versionsData = await api(`/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&filter[appStoreState]=PREPARE_FOR_SUBMISSION`);
    const version = versionsData?.data?.[0];
    
    if (version) {
      console.log(`\nAdding version ${version.attributes.versionString} to submission...`);
      const addItem = await api('/reviewSubmissionItems', 'POST', {
        data: {
          type: 'reviewSubmissionItems',
          relationships: {
            appStoreVersion: {
              data: { type: 'appStoreVersions', id: version.id }
            },
            reviewSubmission: {
              data: { type: 'reviewSubmissions', id: submissionId }
            }
          }
        }
      });

      if (addItem) {
        console.log(`Item added: ${addItem.data.id}`);
        
        // Confirm/submit the review
        console.log('\nConfirming submission...');
        const confirm = await api(`/reviewSubmissions/${submissionId}`, 'PATCH', {
          data: {
            type: 'reviewSubmissions',
            id: submissionId,
            attributes: {
              submitted: true,
            }
          }
        });

        if (confirm) {
          console.log(`\n✓ SUBMITTED FOR REVIEW!`);
          console.log(`State: ${confirm.data.attributes.state}`);
        }
      }
    }
  } else {
    // Method 2: Check if there's already a submission
    console.log('\nChecking existing review submissions...');
    const existing = await api(`/apps/${APP_ID}/reviewSubmissions?filter[state]=WAITING_FOR_REVIEW,UNRESOLVED,IN_REVIEW`);
    if (existing?.data?.length) {
      console.log('Existing submission found:', existing.data[0].attributes.state);
    } else {
      console.log('\nNo existing submission. The submission may need to be done via App Store Connect web UI.');
      console.log(`URL: https://appstoreconnect.apple.com/apps/${APP_ID}/appstore`);
    }
  }
}

main().catch(console.error);
