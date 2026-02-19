#!/usr/bin/env node
/**
 * Debug why pages show skeleton loading states
 * Captures console logs/errors and network requests
 */
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3010';
const DEMO_EMAIL = 'demo@dinedate.vn';
const DEMO_PASS = 'DineDate2026!';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
  });
  const page = await context.newPage();

  // Capture ALL console messages
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warn' || type === 'log') {
      console.log(`[CONSOLE ${type}] ${msg.text()}`);
    }
  });

  // Capture page errors
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  // Capture network failures
  page.on('requestfailed', req => {
    console.log(`[NET FAIL] ${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
  });

  // Track Supabase requests
  page.on('response', res => {
    const url = res.url();
    if (url.includes('supabase')) {
      console.log(`[SUPABASE] ${res.status()} ${res.request().method()} ${url.substring(0, 120)}`);
    }
  });

  // 1. Login
  console.log('=== LOGGING IN ===');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', DEMO_EMAIL);
  await page.fill('input[type="password"]', DEMO_PASS);
  await page.click('button[type="submit"]');

  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    if (!page.url().includes('/login')) break;
  }
  console.log('After login URL:', page.url());

  // 2. Visit home page
  console.log('\n=== VISITING HOME / ===');
  await page.goto(`${BASE_URL}/`, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(8000);

  // Check what's on the page
  const homeText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('HOME CONTENT:', homeText.replace(/\n+/g, ' | '));

  const homePulseCount = await page.evaluate(() => 
    document.querySelectorAll('[class*="animate-pulse"]').length
  );
  console.log('animate-pulse elements:', homePulseCount);

  // 3. Visit restaurants
  console.log('\n=== VISITING /restaurants ===');
  await page.goto(`${BASE_URL}/restaurants`, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(8000);

  const restText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('RESTAURANTS CONTENT:', restText.replace(/\n+/g, ' | '));

  const restPulseCount = await page.evaluate(() => 
    document.querySelectorAll('[class*="animate-pulse"]').length
  );
  console.log('animate-pulse elements:', restPulseCount);

  // 4. Visit discover
  console.log('\n=== VISITING /discover ===');
  await page.goto(`${BASE_URL}/discover`, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(8000);

  const discText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('DISCOVER CONTENT:', discText.replace(/\n+/g, ' | '));

  await browser.close();
}

main().catch(console.error);
