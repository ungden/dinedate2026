import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../mobile/screenshots');
const BASE_URL = 'http://localhost:3010';

const SIZES = {
  'iphone67': { width: 430, height: 932, dpr: 3 },
  'iphone65': { width: 414, height: 896, dpr: 3 },
  'ipad129': { width: 1024, height: 1366, dpr: 2 },
};

const PAGES = [
  { name: '01-home', path: '/' },
  { name: '02-restaurants', path: '/restaurants' },
  { name: '03-create', path: '/create-request' },
  { name: '04-wallet', path: '/wallet' },
  { name: '05-safety', path: '/safety' },
  { name: '06-login', path: '/login' },
];

async function run() {
  const browser = await chromium.launch({ headless: true });

  for (const [sizeKey, size] of Object.entries(SIZES)) {
    console.log(`\n📱 ${sizeKey} (${size.width * size.dpr}x${size.height * size.dpr})`);

    for (const p of PAGES) {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
        deviceScaleFactor: size.dpr,
        isMobile: sizeKey.startsWith('iphone'),
        hasTouch: true,
      });
      const page = await context.newPage();
      const url = `${BASE_URL}${p.path}`;

      try {
        await page.goto(url, { waitUntil: 'load', timeout: 15000 });
      } catch (e) {
        console.log(`  ⚠️ load timeout for ${url}, continuing...`);
      }

      // Wait for JS hydration and content rendering
      await page.waitForTimeout(4000);

      // Wait for any visible text content
      try {
        await page.waitForSelector('body *:not(script):not(style)', { timeout: 5000 });
      } catch {}

      // Additional wait for lazy loaded content
      await page.waitForTimeout(2000);

      // Check if page has content
      const bodyText = await page.evaluate(() => document.body?.innerText?.trim()?.length || 0);
      console.log(`  📸 ${p.name} (${bodyText} chars)`);

      await page.evaluate(() => {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        // Remove any loading spinners
        document.querySelectorAll('[class*="spinner"], [class*="loading"]').forEach(el => el.remove());
      });

      const filename = `${sizeKey}_${p.name}.png`;
      await page.screenshot({
        path: path.join(OUTPUT_DIR, filename),
        fullPage: false,
        type: 'png',
      });
      console.log(`    ✅ ${filename}`);

      await context.close();
    }
  }

  await browser.close();
  console.log('\n✅ All done!');
}

run().catch(console.error);
