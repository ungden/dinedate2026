import { readFileSync, statSync } from 'fs';
import { createPrivateKey, sign, createHash } from 'crypto';

const KEY_PATH = new URL('../certs/AuthKey_ZR6H3P77RU.p8', import.meta.url).pathname;
const APP_ID = '6758265568';
const VERSION_ID = '91407f2f-607f-40b0-aa93-4cc4a90729b6';
const SCREENSHOTS_DIR = new URL('../screenshots-v3', import.meta.url).pathname;

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
  const ok = res.ok || res.status === 204;
  if (!ok) console.error(`  FAIL ${method} ${path} → ${res.status}: ${text.substring(0, 300)}`);
  else console.log(`  OK ${method} ${path} → ${res.status}`);
  if (res.status === 204) return {};
  return ok && text ? JSON.parse(text) : null;
}

async function uploadScreenshotsForSet(locId, displayType) {
  // Create set
  const setResult = await api('/appScreenshotSets', 'POST', {
    data: {
      type: 'appScreenshotSets',
      attributes: { screenshotDisplayType: displayType },
      relationships: {
        appStoreVersionLocalization: {
          data: { type: 'appStoreVersionLocalizations', id: locId }
        }
      }
    }
  });
  if (!setResult) return;
  const setId = setResult.data.id;

  const files = ['01-home.png', '02-discover.png', '04-create.png', '05-wallet.png', '06-profile.png', '00-login.png'];
  for (const file of files) {
    const filePath = `${SCREENSHOTS_DIR}/${file}`;
    const fileData = readFileSync(filePath);
    const fileSize = statSync(filePath).size;
    const checksum = createHash('md5').update(fileData).digest('base64');

    const reservation = await api('/appScreenshots', 'POST', {
      data: {
        type: 'appScreenshots',
        attributes: { fileName: file, fileSize },
        relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } } }
      }
    });
    if (!reservation) continue;

    const ssId = reservation.data.id;
    for (const op of reservation.data.attributes.uploadOperations) {
      const uh = {};
      for (const h of op.requestHeaders) uh[h.name] = h.value;
      await fetch(op.url, { method: op.method, headers: uh, body: fileData.subarray(op.offset, op.offset + op.length) });
    }

    await api(`/appScreenshots/${ssId}`, 'PATCH', {
      data: { type: 'appScreenshots', id: ssId, attributes: { uploaded: true, sourceFileChecksum: checksum } }
    });
    await new Promise(r => setTimeout(r, 500));
  }
}

async function main() {
  console.log('=== Fixing App Store Submission Requirements ===\n');

  // 1. Fix age rating declaration
  console.log('1. Setting age rating declaration...');
  await api(`/ageRatingDeclarations/${VERSION_ID}`, 'PATCH', {
    data: {
      type: 'ageRatingDeclarations',
      id: VERSION_ID,
      attributes: {
        alcoholTobaccoOrDrugUseOrReferences: 'NONE',
        contests: 'NONE',
        gambling: false,
        gamblingSimulated: 'NONE',
        horrorOrFearThemes: 'NONE',
        matureOrSuggestiveThemes: 'INFREQUENT_OR_MILD',
        medicalOrTreatmentInformation: 'NONE',
        profanityOrCrudeHumor: 'NONE',
        sexualContentGraphicAndNudity: 'NONE',
        sexualContentOrNudity: 'NONE',
        violenceCartoonOrFantasy: 'NONE',
        violenceRealistic: 'NONE',
        violenceRealisticProlongedGraphicOrSadistic: 'NONE',
        unrestrictedWebAccess: false,
        gunsOrOtherWeapons: 'NONE',
        parentalControls: 'NONE',
        healthOrWellnessTopics: 'NONE',
        ageAssurance: 'NONE',
        messagingAndChat: 'INFREQUENT_OR_MILD',
        advertising: false,
        userGeneratedContent: 'INFREQUENT_OR_MILD',
        lootBox: false,
      }
    }
  });

  // 2. Set copyright on version
  console.log('\n2. Setting copyright...');
  await api(`/appStoreVersions/${VERSION_ID}`, 'PATCH', {
    data: {
      type: 'appStoreVersions',
      id: VERSION_ID,
      attributes: {
        copyright: '2026 TitanLabs',
      }
    }
  });

  // 3. Set content rights declaration
  console.log('\n3. Setting content rights declaration...');
  await api(`/apps/${APP_ID}`, 'PATCH', {
    data: {
      type: 'apps',
      id: APP_ID,
      attributes: {
        contentRightsDeclaration: 'DOES_NOT_USE_THIRD_PARTY_CONTENT',
      }
    }
  });

  // 4. Set pricing (free app)
  console.log('\n4. Setting pricing (free)...');
  // Try the territories pricing endpoint
  const priceResult = await api(`/apps/${APP_ID}/appAvailability`, 'POST', {
    data: {
      type: 'appAvailabilities',
      attributes: {
        availableInNewTerritories: true,
      },
      relationships: {
        app: { data: { type: 'apps', id: APP_ID } },
        availableTerritories: { data: [{ type: 'territories', id: 'VNM' }, { type: 'territories', id: 'USA' }] }
      }
    }
  });

  // Also try setting the price schedule
  if (!priceResult) {
    console.log('  Trying v2 pricing...');
    const res = await fetch(`${BASE.replace('/v1', '/v2')}/apps/${APP_ID}/appPriceSchedule`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'appPriceSchedules',
          relationships: {
            app: { data: { type: 'apps', id: APP_ID } },
            manualPrices: { data: [{ type: 'appPrices', id: '${price-free}' }] },
            baseTerritory: { data: { type: 'territories', id: 'VNM' } }
          }
        },
        included: [{
          type: 'appPrices',
          id: '${price-free}',
          attributes: { startDate: null },
          relationships: {
            priceTier: { data: { type: 'appPriceTiers', id: '0' } },
            territory: { data: { type: 'territories', id: 'VNM' } }
          }
        }]
      })
    });
    console.log('  v2 pricing:', res.status, await res.text().then(t => t.substring(0, 200)));
  }

  // 5. Upload iPad screenshots (vi locale)
  console.log('\n5. Uploading iPad screenshots (vi locale)...');
  const locData = await api(`/appStoreVersions/${VERSION_ID}/appStoreVersionLocalizations`);
  const viLoc = locData?.data?.find(l => l.attributes.locale === 'vi');
  const enLoc = locData?.data?.find(l => l.attributes.locale === 'en-US');

  if (viLoc) {
    console.log('  Uploading for vi...');
    await uploadScreenshotsForSet(viLoc.id, 'APP_IPAD_PRO_3GEN_129');
  }
  if (enLoc) {
    console.log('  Uploading for en-US...');
    await uploadScreenshotsForSet(enLoc.id, 'APP_IPAD_PRO_3GEN_129');
  }

  // 6. Set app data usages (privacy)
  console.log('\n6. Setting app data usages (privacy)...');
  // First get app data usage categories
  const categoriesRes = await api(`/apps/${APP_ID}/appDataUsages`);
  console.log('  Current data usages:', JSON.stringify(categoriesRes?.data?.length || 0));

  // Need to publish app data usages
  // This typically requires setting up privacy responses on App Store Connect
  // Let's try the API
  await api(`/appDataUsagePublications`, 'POST', {
    data: {
      type: 'appDataUsagePublications',
      relationships: {
        app: { data: { type: 'apps', id: APP_ID } }
      }
    }
  });

  console.log('\n=== Requirements fix complete ===');
  console.log('Some items (pricing, privacy labels) may need manual configuration.');
  console.log(`App Store Connect: https://appstoreconnect.apple.com/apps/${APP_ID}`);
}

main().catch(console.error);
