#!/usr/bin/env node
/**
 * Opens the app in an automated Chromium window (visible).
 * Run: node scripts/open-app-in-browser.mjs
 * Ensure dev server is running: npm run dev
 */
import { chromium } from 'playwright';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function main() {
  let browser;
  try {
    browser = await chromium.launch({ headless: false, channel: 'chrome' });
  } catch {
    browser = await chromium.launch({ headless: false });
  }
  const context = await browser.newContext({ viewport: { width: 1280, height: 840 } });
  const page = await context.newPage();
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log('App opened at', APP_URL);
  console.log('Close the browser window or press Ctrl+C to exit.');
  await new Promise(() => {}); // keep process alive so browser stays open
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
