#!/usr/bin/env node
/**
 * Take App Store screenshots with logged-in demo account
 * Uses Playwright to login then capture pages with real data
 * 
 * Correct web routes:
 *   / (home), /discover, /restaurants, /create-request, /wallet, /profile
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE_URL = 'http://localhost:3010';
const DEMO_EMAIL = 'demo@dinedate.vn';
const DEMO_PASS = 'DineDate2026!';

// iPhone 6.7" (1290x2796) - required for App Store
const VIEWPORT = { width: 430, height: 932 };
const DEVICE_SCALE = 3; // 430*3 = 1290, 932*3 = 2796

const SCREENSHOT_DIR = new URL('../screenshots-v3', import.meta.url).pathname;
mkdirSync(SCREENSHOT_DIR, { recursive: true });

/**
 * Wait until no animate-pulse or animate-spin elements remain on the page,
 * or until timeout (default 12s). Then wait an extra 500ms for final render.
 */
async function waitForDataLoaded(page, timeoutMs = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const loadingCount = await page.evaluate(() => {
      return document.querySelectorAll('[class*="animate-pulse"], [class*="animate-spin"]').length;
    });
    if (loadingCount === 0) break;
    await page.waitForTimeout(500);
  }
  // Extra settle time for animations / final renders
  await page.waitForTimeout(800);
}

/**
 * Remove any overlays, modals, cookie banners that might obstruct the screenshot
 */
async function hideOverlays(page) {
  await page.evaluate(() => {
    document.querySelectorAll(
      '[class*="cookie"], [class*="banner"], [class*="toast"], [class*="modal-overlay"], [class*="backdrop"]'
    ).forEach(el => {
      if (el instanceof HTMLElement) el.style.display = 'none';
    });
  });
}

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  // ── 1. Login ──────────────────────────────────────────────────────────
  console.log('Logging in as demo user...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Pre-set localStorage to skip onboarding tutorial
  await page.evaluate(() => {
    localStorage.setItem('dinedate_onboarding_completed', 'true');
  });

  await page.fill('input[type="email"]', DEMO_EMAIL);
  await page.fill('input[type="password"]', DEMO_PASS);
  await page.waitForTimeout(300);
  await page.click('button[type="submit"]');
  console.log('  Login submitted, waiting for redirect...');

  // Wait up to 15s for navigation away from /login
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(500);
    if (!page.url().includes('/login')) break;
  }

  // Ensure onboarding is dismissed after login
  await page.evaluate(() => {
    localStorage.setItem('dinedate_onboarding_completed', 'true');
  });
  const afterLoginUrl = page.url();
  console.log('  Redirected to:', afterLoginUrl);

  if (afterLoginUrl.includes('/login')) {
    console.error('ERROR: Still on login page — login may have failed. Continuing anyway...');
  }

  // ── 2. Screenshot each page ───────────────────────────────────────────
  const pages = [
    { name: '01-home',        path: '/',               desc: 'Trang chủ' },
    { name: '02-discover',    path: '/discover',       desc: 'Khám phá nhà hàng' },
    { name: '03-restaurants', path: '/restaurants',     desc: 'Tất cả nhà hàng' },
    { name: '04-create',      path: '/create-request',  desc: 'Tạo Date Order' },
    { name: '05-wallet',      path: '/wallet',          desc: 'Ví tiền' },
    { name: '06-profile',     path: '/profile',         desc: 'Hồ sơ cá nhân' },
  ];

  for (const p of pages) {
    console.log(`\nCapturing ${p.desc} (${p.path})...`);
    try {
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle', timeout: 20000 });
    } catch {
      console.log('  networkidle timeout — proceeding...');
    }
    await waitForDataLoaded(page);
    await hideOverlays(page);

    // Special: wallet page — also wait for "Đang tải giao dịch..." to disappear
    if (p.path === '/wallet') {
      for (let i = 0; i < 20; i++) {
        const stillLoading = await page.evaluate(() =>
          document.body.innerText.includes('Đang tải giao dịch')
        );
        if (!stillLoading) break;
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(500);
    }

    const filePath = `${SCREENSHOT_DIR}/${p.name}.png`;
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`  ✓ Saved ${filePath}`);

    // Log what we see for debugging
    const bodySnippet = await page.evaluate(() => {
      const text = document.body.innerText.substring(0, 200);
      return text.replace(/\n+/g, ' | ');
    });
    console.log(`  Content preview: ${bodySnippet}`);
  }

  // ── 3. Restaurant detail page ─────────────────────────────────────────
  console.log('\nCapturing restaurant detail...');
  try {
    await page.goto(`${BASE_URL}/restaurants`, { waitUntil: 'networkidle', timeout: 20000 });
    await waitForDataLoaded(page);

    // Click first restaurant link
    const firstLink = await page.$('a[href*="/restaurants/"]');
    if (firstLink) {
      const href = await firstLink.getAttribute('href');
      console.log(`  Navigating to ${href}...`);
      await firstLink.click();
      await page.waitForTimeout(1000);
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
      } catch {}
      await waitForDataLoaded(page);
      await hideOverlays(page);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/07-restaurant-detail.png`, fullPage: false });
      console.log('  ✓ Restaurant detail captured');
    } else {
      console.log('  No restaurant links found on /restaurants');
    }
  } catch (e) {
    console.log('  Could not capture restaurant detail:', e.message);
  }

  // ── 4. Login screen (for App Store) ───────────────────────────────────
  console.log('\nCapturing login screen...');
  try {
    // Logout first (go to profile, click logout, or just clear cookies)
    await context.clearCookies();
    // Navigate in a fresh page to avoid stale auth
    const loginPage = await context.newPage();
    await loginPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 20000 });
    await loginPage.waitForTimeout(2000);
    await loginPage.screenshot({ path: `${SCREENSHOT_DIR}/00-login.png`, fullPage: false });
    console.log('  ✓ Login screen captured');
    await loginPage.close();
  } catch (e) {
    console.log('  Could not capture login screen:', e.message);
  }

  await browser.close();
  console.log('\n=== Screenshots complete! ===');
  console.log(`Saved to: ${SCREENSHOT_DIR}`);
  console.log('Files:');
  console.log('  00-login.png          — Đăng nhập');
  console.log('  01-home.png           — Trang chủ');
  console.log('  02-discover.png       — Khám phá');
  console.log('  03-restaurants.png    — Nhà hàng');
  console.log('  04-create.png         — Tạo Date Order');
  console.log('  05-wallet.png         — Ví tiền');
  console.log('  06-profile.png        — Hồ sơ');
  console.log('  07-restaurant-detail  — Chi tiết nhà hàng');
}

main().catch(console.error);
