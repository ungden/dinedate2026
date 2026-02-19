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

// Try adding version to any open submission - print FULL error
const res = await fetch(`${BASE}/reviewSubmissionItems`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    data: {
      type: 'reviewSubmissionItems',
      relationships: {
        appStoreVersion: { data: { type: 'appStoreVersions', id: VERSION_ID } },
        reviewSubmission: { data: { type: 'reviewSubmissions', id: '64b55469-38fd-444d-94db-df6fec288a0c' } }
      }
    }
  })
});

const text = await res.text();
console.log('Status:', res.status);
console.log('Full response:');
console.log(text);
