// Navigate the home cylinder to a theme (N clicks on "Suivant") and screenshot it.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const n = Number(process.argv[2] || 2);
  const label = process.argv[3] || 'lumiere';
  const outDir = path.join(__dirname, 'out', 'clone-theme'); fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000); // intro
  for (let i = 0; i < n; i++) {
    await page.click('button[aria-label="Suivant"]').catch(() => {});
    await page.waitForTimeout(1500);
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, `${label}.jpg`), type: 'jpeg', quality: 75 });
  const active = await page.evaluate(() => (document.querySelector('.hero__label') || {}).textContent || '?');
  console.log('focused theme:', active);
  await ctx.close(); await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
