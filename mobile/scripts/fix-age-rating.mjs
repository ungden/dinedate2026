import { readFileSync } from 'fs';
import { createPrivateKey, sign } from 'crypto';

const KEY_PATH = new URL('../certs/AuthKey_ZR6H3P77RU.p8', import.meta.url).pathname;
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

// First, get current age rating to see expected types
const res1 = await fetch(`${BASE}/ageRatingDeclarations/${VERSION_ID}`, { headers });
const current = await res1.json();
console.log('Current age rating attributes:');
console.log(JSON.stringify(current.data?.attributes, null, 2));

// Now update with correct types
// Based on the error, some fields expect BOOLEAN and others expect FREQUENCY_LEVEL
const res2 = await fetch(`${BASE}/ageRatingDeclarations/${VERSION_ID}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({
    data: {
      type: 'ageRatingDeclarations',
      id: VERSION_ID,
      attributes: {
        // FREQUENCY_LEVEL fields: NONE, INFREQUENT_OR_MILD, FREQUENT_OR_INTENSE
        alcoholTobaccoOrDrugUseOrReferences: 'NONE',
        contests: 'NONE',
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
        gunsOrOtherWeapons: 'NONE',
        parentalControls: 'NONE',
        healthOrWellnessTopics: 'NONE',
        ageAssurance: 'NONE',
        userGeneratedContent: 'NONE',
        // BOOLEAN fields
        gambling: false,
        unrestrictedWebAccess: false,
        messagingAndChat: true,
        advertising: false,
        lootBox: false,
      }
    }
  })
});

const result = await res2.json();
console.log('\nUpdate result:', res2.status);
if (res2.ok) {
  console.log('✓ Age rating updated');
} else {
  console.log('Error:', JSON.stringify(result.errors?.[0], null, 2));
}
