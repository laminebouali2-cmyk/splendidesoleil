// Record a VIDEO of the full click transition (unfold -> navigate -> side-shatter).
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const outDir = path.join(__dirname, 'out', 'transition-video');
  const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
    recordVideo: { dir: outDir, size: { width: 1440, height: 900 } },
  });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(9000); // intro fully settled
  await page.mouse.click(712, 640); // click cylinder -> unfold -> navigate -> shatter
  await page.waitForTimeout(4500);
  await ctx.close(); // flush video
  await browser.close();
  console.log('video saved ->', outDir);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
