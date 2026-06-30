// Capture the FULL click transition: home cylinder -> unfold -> navigate -> side-shatter.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const outDir = path.join(__dirname, 'out', 'clone-transition');
  const fr = path.join(outDir, 'frames'); fs.mkdirSync(fr, { recursive: true });
  const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 200)));
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8500); // intro
  await page.screenshot({ path: path.join(outDir, 'A-before.jpg'), type: 'jpeg', quality: 72 });

  // click the cylinder (canvas) -> playExit unfolds then navigates
  await page.mouse.click(712, 640);
  let i = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 3600) {
    await page.screenshot({ path: path.join(fr, `t${String(i).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 50 });
    i++;
    await page.waitForTimeout(130);
  }
  const st = await page.evaluate(() => ({ url: location.pathname }));
  console.log('url:', st.url, '| frames:', i, '| errs:', errs.length ? errs.join(' | ') : 'none');
  await ctx.close(); await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
