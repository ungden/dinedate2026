import { readFileSync } from 'fs';
import { createPrivateKey, sign } from 'crypto';

const KEY_PATH = new URL('../certs/AuthKey_ZR6H3P77RU.p8', import.meta.url).pathname;
const AGE_RATING_ID = '6eb7ee06-32bc-43e1-b2af-446a6bd92cc6';

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

// All fields with correct types based on Apple docs
// FREQUENCY_LEVEL: NONE, INFREQUENT_OR_MILD, FREQUENT_OR_INTENSE
// BOOLEAN: true/false
const res = await fetch(`${BASE}/ageRatingDeclarations/${AGE_RATING_ID}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({
    data: {
      type: 'ageRatingDeclarations',
      id: AGE_RATING_ID,
      attributes: {
        // Frequency level (string enum)
        alcoholTobaccoOrDrugUseOrReferences: 'NONE',
        contests: 'NONE',
        gamblingSimulated: 'NONE',
        horrorOrFearThemes: 'NONE',
        matureOrSuggestiveThemes: 'INFREQUENT_OR_MILD', // Dating app
        medicalOrTreatmentInformation: 'NONE',
        profanityOrCrudeHumor: 'NONE',
        sexualContentGraphicAndNudity: 'NONE',
        sexualContentOrNudity: 'NONE',
        violenceCartoonOrFantasy: 'NONE',
        violenceRealistic: 'NONE',
        violenceRealisticProlongedGraphicOrSadistic: 'NONE',
        gunsOrOtherWeapons: 'NONE',
        // These are also BOOLEAN (not frequency level)
        healthOrWellnessTopics: false,
        ageAssurance: false,
        userGeneratedContent: false,
        // Boolean
        gambling: false,
        unrestrictedWebAccess: false,
        messagingAndChat: true, // App has messaging between connections
        advertising: false,
        lootBox: false,
        parentalControls: false,
      }
    }
  })
});

const text = await res.text();
console.log('Status:', res.status);
if (res.ok) {
  console.log('✓ Age rating updated successfully');
} else {
  console.log('Error:', text.substring(0, 3000));
}
