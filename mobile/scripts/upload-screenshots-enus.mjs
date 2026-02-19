import { readFileSync, statSync } from 'fs';
import { createPrivateKey, sign, createHash } from 'crypto';

const KEY_PATH = new URL('../certs/AuthKey_ZR6H3P77RU.p8', import.meta.url).pathname;
const SCREENSHOTS_DIR = new URL('../screenshots-v3', import.meta.url).pathname;
const EN_US_LOC_ID = 'efa7e155-9a47-4dc3-a0eb-42ae4772478b';

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
  if (!res.ok) {
    console.error(`  ${method} ${path} → ${res.status}: ${text.substring(0, 200)}`);
    return null;
  }
  return text ? JSON.parse(text) : null;
}

const SCREENSHOTS = [
  { file: '01-home.png' },
  { file: '02-discover.png' },
  { file: '04-create.png' },
  { file: '05-wallet.png' },
  { file: '06-profile.png' },
  { file: '00-login.png' },
];

async function main() {
  console.log('Uploading screenshots to en-US locale...\n');

  // 1. Create screenshot set for en-US
  console.log('Creating APP_IPHONE_67 set for en-US...');
  const setResult = await api('/appScreenshotSets', 'POST', {
    data: {
      type: 'appScreenshotSets',
      attributes: { screenshotDisplayType: 'APP_IPHONE_67' },
      relationships: {
        appStoreVersionLocalization: {
          data: { type: 'appStoreVersionLocalizations', id: EN_US_LOC_ID }
        }
      }
    }
  });
  
  if (!setResult) {
    console.error('Failed to create screenshot set');
    process.exit(1);
  }
  const setId = setResult.data.id;
  console.log(`Created set: ${setId}\n`);

  // 2. Upload screenshots
  for (let i = 0; i < SCREENSHOTS.length; i++) {
    const ss = SCREENSHOTS[i];
    const filePath = `${SCREENSHOTS_DIR}/${ss.file}`;
    console.log(`[${i+1}/${SCREENSHOTS.length}] ${ss.file}`);
    
    const fileData = readFileSync(filePath);
    const fileSize = statSync(filePath).size;
    const checksum = createHash('md5').update(fileData).digest('base64');
    
    const reservation = await api('/appScreenshots', 'POST', {
      data: {
        type: 'appScreenshots',
        attributes: { fileName: ss.file, fileSize },
        relationships: {
          appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } }
        }
      }
    });
    
    if (!reservation) continue;
    
    const screenshotId = reservation.data.id;
    const uploadOps = reservation.data.attributes.uploadOperations;
    
    for (const op of uploadOps) {
      const uploadHeaders = {};
      for (const h of op.requestHeaders) uploadHeaders[h.name] = h.value;
      await fetch(op.url, { method: op.method, headers: uploadHeaders, body: fileData.subarray(op.offset, op.offset + op.length) });
    }
    
    const commit = await api(`/appScreenshots/${screenshotId}`, 'PATCH', {
      data: {
        type: 'appScreenshots',
        id: screenshotId,
        attributes: { uploaded: true, sourceFileChecksum: checksum }
      }
    });
    
    console.log(commit ? '  ✓' : '  ✗');
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\nDone! en-US screenshots uploaded.');
}

main().catch(console.error);
