import { readFileSync } from 'fs';
import { createPrivateKey, sign } from 'crypto';

const KEY_PATH = new URL('../certs/AuthKey_ZR6H3P77RU.p8', import.meta.url).pathname;
const APP_ID = '6758265568';
const VERSION_ID = '91407f2f-607f-40b0-aa93-4cc4a90729b6';

const now = Math.floor(Date.now() / 1000);
const header = { alg: 'ES256', kid: 'ZR6H3P77RU', typ: 'JWT' };
const payload = { iss: '16b1bc8e-5a12-4788-b4d2-4c9ebe0068fb', iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' };
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
const signingInput = b64(header) + '.' + b64(payload);
const key = createPrivateKey(readFileSync(KEY_PATH, 'utf8'));
const sig = sign('sha256', Buffer.from(signingInput), { key, dsaEncoding: 'ieee-p1363' });
const token = signingInput + '.' + sig.toString('base64url');
const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
const BASE = 'https://api.appstoreconnect.apple.com/v1';

async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  console.log(`${method} ${path} → ${res.status}`);
  if (!res.ok && res.status !== 204) {
    console.error(text.substring(0, 500));
  }
  if (res.status === 204) return {};
  return text ? JSON.parse(text) : null;
}

async function main() {
  console.log('=== Final App Store Submission ===\n');

  // 1. Check current submissions
  console.log('1. Checking existing submissions...');
  const subs = await api(`/apps/${APP_ID}/reviewSubmissions`);
  for (const sub of subs?.data || []) {
    console.log(`  ${sub.id}: ${sub.attributes.state}`);
    
    // Delete READY_FOR_REVIEW submissions that have no items
    if (sub.attributes.state === 'READY_FOR_REVIEW') {
      console.log('  Deleting empty submission...');
      await api(`/reviewSubmissions/${sub.id}`, 'DELETE');
    }
  }

  // 2. Wait a moment
  await new Promise(r => setTimeout(r, 2000));

  // 3. Create new submission
  console.log('\n2. Creating new review submission...');
  const newSub = await api('/reviewSubmissions', 'POST', {
    data: {
      type: 'reviewSubmissions',
      attributes: { platform: 'IOS' },
      relationships: {
        app: { data: { type: 'apps', id: APP_ID } }
      }
    }
  });

  if (!newSub) {
    console.error('Failed to create submission');
    process.exit(1);
  }

  const subId = newSub.data.id;
  console.log(`  Created: ${subId} (${newSub.data.attributes.state})`);

  // 4. Add version to submission
  console.log('\n3. Adding version to submission...');
  const item = await api('/reviewSubmissionItems', 'POST', {
    data: {
      type: 'reviewSubmissionItems',
      relationships: {
        appStoreVersion: { data: { type: 'appStoreVersions', id: VERSION_ID } },
        reviewSubmission: { data: { type: 'reviewSubmissions', id: subId } }
      }
    }
  });

  if (!item) {
    console.error('\nFailed to add version to submission.');
    console.error('This usually means the version has validation errors.');
    console.error('Check App Store Connect manually for missing requirements.');
    console.error(`URL: https://appstoreconnect.apple.com/apps/${APP_ID}/appstore`);
    return;
  }

  console.log(`  Added: ${item.data.id}`);

  // 5. Submit
  console.log('\n4. Confirming submission...');
  const confirm = await api(`/reviewSubmissions/${subId}`, 'PATCH', {
    data: {
      type: 'reviewSubmissions',
      id: subId,
      attributes: { submitted: true }
    }
  });

  if (confirm) {
    console.log(`\n✓ APP SUBMITTED FOR REVIEW!`);
    console.log(`State: ${confirm.data?.attributes?.state}`);
    console.log(`\nThe app is now in Apple's review queue.`);
    console.log(`Typically takes 1-3 business days.`);
  }
}

main().catch(console.error);
