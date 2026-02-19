import { readFileSync } from 'fs';
import { createPrivateKey, sign } from 'crypto';

const KEY_PATH = new URL('../certs/AuthKey_ZR6H3P77RU.p8', import.meta.url).pathname;
const now = Math.floor(Date.now() / 1000);
const header = { alg: 'ES256', kid: 'ZR6H3P77RU', typ: 'JWT' };
const payload = { iss: '16b1bc8e-5a12-4788-b4d2-4c9ebe0068fb', iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' };
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
const signingInput = b64(header) + '.' + b64(payload);
const key = createPrivateKey(readFileSync(KEY_PATH, 'utf8'));
const sig = sign('sha256', Buffer.from(signingInput), { key, dsaEncoding: 'ieee-p1363' });
const token = signingInput + '.' + sig.toString('base64url');
const h = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
const BASE = 'https://api.appstoreconnect.apple.com/v1';

const VERSION_ID = '91407f2f-607f-40b0-aa93-4cc4a90729b6';

// 1. Check version details
const res1 = await fetch(`${BASE}/appStoreVersions/${VERSION_ID}?include=build`, { headers: h });
const v = await res1.json();
console.log('Version:', v.data?.attributes?.versionString);
console.log('State:', v.data?.attributes?.appStoreState);
console.log('Build:', v.included?.[0]?.attributes?.version || 'NO BUILD');

// 2. Check en-US localization screenshots (en-US might also need screenshots)
const res2 = await fetch(`${BASE}/appStoreVersions/${VERSION_ID}/appStoreVersionLocalizations`, { headers: h });
const locs = await res2.json();
for (const loc of locs.data || []) {
  console.log(`\nLocale: ${loc.attributes.locale} (id: ${loc.id})`);
  const res3 = await fetch(`${BASE}/appStoreVersionLocalizations/${loc.id}/appScreenshotSets`, { headers: h });
  const sets = await res3.json();
  if (!sets.data?.length) {
    console.log('  No screenshot sets!');
  }
  for (const set of sets.data || []) {
    const res4 = await fetch(`${BASE}/appScreenshotSets/${set.id}/appScreenshots`, { headers: h });
    const sshots = await res4.json();
    console.log(`  ${set.attributes.screenshotDisplayType}: ${sshots.data?.length || 0} screenshots`);
  }
}

// 3. Cancel bad submission if exists
console.log('\nChecking existing submissions...');
const res5 = await fetch(`${BASE}/apps/6758265568/reviewSubmissions`, { headers: h });
const subs = await res5.json();
for (const sub of subs.data || []) {
  console.log(`  Submission: ${sub.id} - state: ${sub.attributes.state}`);
  if (sub.attributes.state === 'READY_FOR_REVIEW') {
    console.log('  → Cancelling...');
    const del = await fetch(`${BASE}/reviewSubmissions/${sub.id}`, {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({
        data: { type: 'reviewSubmissions', id: sub.id, attributes: { canceled: true } }
      })
    });
    console.log('  Cancel result:', del.status);
  }
}
