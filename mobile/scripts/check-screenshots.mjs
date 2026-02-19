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
const h = { Authorization: 'Bearer ' + token };

// Check screenshots
const res = await fetch('https://api.appstoreconnect.apple.com/v1/appScreenshotSets/6750ea60-8d1e-4a3f-8413-e5a2ad1c0b40/appScreenshots', { headers: h });
const data = await res.json();
for (const ss of data.data || []) {
  const a = ss.attributes;
  const state = a.assetDeliveryState;
  console.log(`${a.fileName}: state=${state?.state}, errors=${JSON.stringify(state?.errors)}`);
}

// Also check review submission
const res2 = await fetch('https://api.appstoreconnect.apple.com/v1/reviewSubmissions/9e7646a9-5e38-4224-b063-c0c1a78cbc04/items', { headers: h });
console.log('\nSubmission items:', res2.status, await res2.text().then(t => t.substring(0, 300)));

// Cancel the bad submission
console.log('\nDeleting bad review submission...');
const del = await fetch('https://api.appstoreconnect.apple.com/v1/reviewSubmissions/9e7646a9-5e38-4224-b063-c0c1a78cbc04', {
  method: 'DELETE',
  headers: h,
});
console.log('Delete result:', del.status);
