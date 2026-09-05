import { createRequire } from 'node:module';
import { verifyPlayerNavigation, verifyRosterLayout } from './player-navigation.mjs';

// Use an existing Playwright installation; no dependency on the live Tauri app.
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.argv[2] || 'http://127.0.0.1:3101');
  await page.getByTestId('design-mode-toggle').waitFor();
  await page.locator('.player-row').last().waitFor();
  await page.waitForTimeout(400);
  console.log(await verifyRosterLayout(page));
  console.log(await verifyPlayerNavigation(page));
  await page.setViewportSize({ width: 1920, height: 1080 });
  console.log(await verifyRosterLayout(page));
  if (errors.length) throw new Error(errors.join('\n'));
} finally {
  await browser.close();
}
