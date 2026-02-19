#!/usr/bin/env node
/**
 * Upload screenshots to App Store Connect using API Key
 * Uploads iPhone 6.7" screenshots for vi locale
 */
import { readFileSync, statSync } from 'fs';
import { createPrivateKey, sign, createHash } from 'crypto';

const KEY_ID = 'ZR6H3P77RU';
const ISSUER_ID = '16b1bc8e-5a12-4788-b4d2-4c9ebe0068fb';
const APP_ID = '6758265568';
const KEY_PATH = new URL('../certs/AuthKey_ZR6H3P77RU.p8', import.meta.url).pathname;
const SCREENSHOTS_DIR = new URL('../screenshots-v3', import.meta.url).pathname;

// iPhone 6.7" display type
const DISPLAY_TYPE = 'APP_IPHONE_67';

// Screenshots to upload (ordered for App Store)
const SCREENSHOTS = [
  { file: '01-home.png', desc: 'Trang chủ - Hẹn hò ẩn danh' },
  { file: '02-discover.png', desc: 'Khám phá nhà hàng' },
  { file: '04-create.png', desc: 'Tạo Date Order' },
  { file: '05-wallet.png', desc: 'Ví điện tử' },
  { file: '06-profile.png', desc: 'Hồ sơ cá nhân' },
  { file: '00-login.png', desc: 'Đăng nhập' },
];

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
    console.error(`  API ${method} ${path} → ${res.status}`);
    console.error(`  ${text.substring(0, 300)}`);
    return null;
  }
  return text ? JSON.parse(text) : null;
}

async function main() {
  console.log('=== Uploading Screenshots to App Store Connect ===\n');

  // 1. Get the app store version
  console.log('1. Finding app store version...');
  const versionsData = await api(`/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS`);
  if (!versionsData?.data?.length) {
    console.error('No app store version found!');
    process.exit(1);
  }
  
  // Find PREPARE_FOR_SUBMISSION version
  const version = versionsData.data.find(v => 
    v.attributes.appStoreState === 'PREPARE_FOR_SUBMISSION'
  ) || versionsData.data[0];
  
  console.log(`   Version: ${version.attributes.versionString} (${version.attributes.appStoreState})`);
  const versionId = version.id;

  // 2. Get localizations for this version
  console.log('\n2. Finding version localizations...');
  const locData = await api(`/appStoreVersions/${versionId}/appStoreVersionLocalizations`);
  if (!locData?.data?.length) {
    console.error('No localizations found!');
    process.exit(1);
  }

  // Find Vietnamese localization (or English as fallback)
  let localization = locData.data.find(l => l.attributes.locale === 'vi');
  if (!localization) {
    localization = locData.data.find(l => l.attributes.locale === 'en-US');
  }
  if (!localization) {
    localization = locData.data[0];
  }
  console.log(`   Using locale: ${localization.attributes.locale} (id: ${localization.id})`);
  const locId = localization.id;

  // 3. Get existing screenshot sets
  console.log('\n3. Checking existing screenshot sets...');
  const setsData = await api(`/appStoreVersionLocalizations/${locId}/appScreenshotSets`);
  
  let screenshotSet = setsData?.data?.find(s => 
    s.attributes.screenshotDisplayType === DISPLAY_TYPE
  );

  if (screenshotSet) {
    console.log(`   Found existing ${DISPLAY_TYPE} set (id: ${screenshotSet.id})`);
    
    // Delete existing screenshots in the set
    const existingScreenshots = await api(`/appScreenshotSets/${screenshotSet.id}/appScreenshots`);
    if (existingScreenshots?.data?.length > 0) {
      console.log(`   Deleting ${existingScreenshots.data.length} existing screenshots...`);
      for (const ss of existingScreenshots.data) {
        await api(`/appScreenshots/${ss.id}`, 'DELETE');
      }
      console.log('   Existing screenshots deleted');
    }
  } else {
    // Create the screenshot set
    console.log(`   Creating ${DISPLAY_TYPE} screenshot set...`);
    const setResult = await api('/appScreenshotSets', 'POST', {
      data: {
        type: 'appScreenshotSets',
        attributes: { screenshotDisplayType: DISPLAY_TYPE },
        relationships: {
          appStoreVersionLocalization: {
            data: { type: 'appStoreVersionLocalizations', id: locId }
          }
        }
      }
    });
    if (!setResult) {
      console.error('Failed to create screenshot set!');
      process.exit(1);
    }
    screenshotSet = setResult.data;
    console.log(`   Created set: ${screenshotSet.id}`);
  }

  const setId = screenshotSet.id;

  // 4. Upload each screenshot
  console.log('\n4. Uploading screenshots...\n');

  for (let i = 0; i < SCREENSHOTS.length; i++) {
    const ss = SCREENSHOTS[i];
    const filePath = `${SCREENSHOTS_DIR}/${ss.file}`;
    
    console.log(`   [${i + 1}/${SCREENSHOTS.length}] ${ss.file} - ${ss.desc}`);
    
    try {
      const fileData = readFileSync(filePath);
      const fileSize = statSync(filePath).size;
      const checksum = createHash('md5').update(fileData).digest('base64');
      
      // 4a. Reserve the screenshot
      const reservation = await api('/appScreenshots', 'POST', {
        data: {
          type: 'appScreenshots',
          attributes: {
            fileName: ss.file,
            fileSize: fileSize,
          },
          relationships: {
            appScreenshotSet: {
              data: { type: 'appScreenshotSets', id: setId }
            }
          }
        }
      });

      if (!reservation) {
        console.error(`   Failed to reserve ${ss.file}`);
        continue;
      }

      const screenshotId = reservation.data.id;
      const uploadOps = reservation.data.attributes.uploadOperations;
      
      if (!uploadOps || uploadOps.length === 0) {
        console.error(`   No upload operations returned for ${ss.file}`);
        continue;
      }

      // 4b. Upload file parts
      for (const op of uploadOps) {
        const { method, url, requestHeaders, offset, length } = op;
        const chunk = fileData.subarray(offset, offset + length);
        
        const uploadHeaders = {};
        for (const h of requestHeaders) {
          uploadHeaders[h.name] = h.value;
        }

        const uploadRes = await fetch(url, {
          method: method,
          headers: uploadHeaders,
          body: chunk,
        });

        if (!uploadRes.ok) {
          console.error(`   Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
          break;
        }
      }

      // 4c. Commit the upload
      const commitResult = await api(`/appScreenshots/${screenshotId}`, 'PATCH', {
        data: {
          type: 'appScreenshots',
          id: screenshotId,
          attributes: {
            uploaded: true,
            sourceFileChecksum: checksum,
          }
        }
      });

      if (commitResult) {
        console.log(`   ✓ Uploaded ${ss.file}`);
      } else {
        console.error(`   Failed to commit ${ss.file}`);
      }

      // Small delay between uploads
      await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
      console.error(`   Error uploading ${ss.file}:`, err.message);
    }
  }

  console.log('\n=== Screenshot upload complete! ===');
  console.log('Check App Store Connect to verify the screenshots are visible.');
}

main().catch(console.error);
