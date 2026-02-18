import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../mobile/screenshots');

const BASE_URL = 'http://localhost:3010';

// Apple required sizes
const SIZES = {
  // iPhone 6.7" (iPhone 15 Pro Max) - Required
  'iphone67': { width: 430, height: 932, dpr: 3 }, // 1290x2796
  // iPhone 6.5" (iPhone 11 Pro Max) - Required  
  'iphone65': { width: 414, height: 896, dpr: 3 }, // 1242x2688
  // iPad 12.9" (iPad Pro) - Required if supportsTablet
  'ipad129': { width: 1024, height: 1366, dpr: 2 }, // 2048x2732
};

// Pages to screenshot
const PAGES = [
  { name: '01-home', path: '/', waitFor: 2000 },
  { name: '02-restaurants', path: '/restaurants', waitFor: 2000 },
  { name: '03-create', path: '/create-request', waitFor: 2000 },
  { name: '04-wallet', path: '/wallet', waitFor: 2000 },
  { name: '05-safety', path: '/safety', waitFor: 2000 },
  { name: '06-login', path: '/login', waitFor: 2000 },
];

async function run() {
  const browser = await chromium.launch({ headless: true });

  for (const [sizeKey, size] of Object.entries(SIZES)) {
    console.log(`\n📱 Capturing ${sizeKey} (${size.width * size.dpr}x${size.height * size.dpr})...`);

    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: size.dpr,
      isMobile: sizeKey.startsWith('iphone'),
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });

    const page = await context.newPage();

    for (const p of PAGES) {
      const url = `${BASE_URL}${p.path}`;
      console.log(`  📸 ${p.name} -> ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      } catch {
        // networkidle might timeout, that's ok
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      }

      // Wait for content to render
      await page.waitForTimeout(p.waitFor);

      // Hide any browser-specific elements
      await page.evaluate(() => {
        // Hide scrollbars
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      });

      const filename = `${sizeKey}_${p.name}.png`;
      await page.screenshot({
        path: path.join(OUTPUT_DIR, filename),
        fullPage: false,
        type: 'png',
      });

      console.log(`    ✅ ${filename}`);
    }

    await context.close();
  }

  await browser.close();
  console.log(`\n✅ All screenshots saved to mobile/screenshots/`);
}

run().catch(console.error);
