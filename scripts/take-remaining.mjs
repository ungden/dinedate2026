import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../mobile/screenshots');
const BASE_URL = 'http://localhost:3010';

const REMAINING = [
  // iPhone 6.5" missing
  { size: 'iphone65', width: 414, height: 896, dpr: 3, name: '05-safety', path: '/safety' },
  { size: 'iphone65', width: 414, height: 896, dpr: 3, name: '06-login', path: '/login' },
  // All iPad 12.9"
  { size: 'ipad129', width: 1024, height: 1366, dpr: 2, name: '01-home', path: '/' },
  { size: 'ipad129', width: 1024, height: 1366, dpr: 2, name: '02-restaurants', path: '/restaurants' },
  { size: 'ipad129', width: 1024, height: 1366, dpr: 2, name: '03-create', path: '/create-request' },
  { size: 'ipad129', width: 1024, height: 1366, dpr: 2, name: '04-wallet', path: '/wallet' },
  { size: 'ipad129', width: 1024, height: 1366, dpr: 2, name: '05-safety', path: '/safety' },
  { size: 'ipad129', width: 1024, height: 1366, dpr: 2, name: '06-login', path: '/login' },
];

async function run() {
  const browser = await chromium.launch({ headless: true });

  for (const item of REMAINING) {
    const context = await browser.newContext({
      viewport: { width: item.width, height: item.height },
      deviceScaleFactor: item.dpr,
      isMobile: item.size.startsWith('iphone'),
      hasTouch: true,
    });
    const page = await context.newPage();

    const url = `${BASE_URL}${item.path}`;
    console.log(`📸 ${item.size}_${item.name} -> ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
    } catch {
      try {
        await page.goto(url, { waitUntil: 'load', timeout: 8000 });
      } catch { /* continue */ }
    }
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    });

    const filename = `${item.size}_${item.name}.png`;
    await page.screenshot({ path: path.join(OUTPUT_DIR, filename), fullPage: false, type: 'png' });
    console.log(`  ✅ ${filename}`);

    await context.close();
  }

  await browser.close();
  console.log('\n✅ Done!');
}

run().catch(console.error);
