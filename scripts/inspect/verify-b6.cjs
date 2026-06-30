// Vérif Brique 6 : le TITRE du thème explose AVEC la photo (cuit dans la texture).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const outDir = path.join(__dirname, 'out', 'verify-b6');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 200)));
  const shot = (n) => page.screenshot({ path: path.join(outDir, n), type: 'jpeg', quality: 74 });

  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8500);

  await page.mouse.click(720, 450);
  const t0 = Date.now();
  // capture fine pour attraper le panneau plat AVEC titre, puis la craquelure
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(90);
    await shot(`f-${String(Math.round(Date.now() - t0)).padStart(4, '0')}.jpg`);
  }

  const url = page.url();
  fs.writeFileSync(path.join(outDir, 'report.txt'), `url=${url}\nerrors:\n` + (errs.join('\n') || '(none)'));
  console.log('url:', url, '| errors:', errs.length ? errs.join(' | ') : 'NONE');
  await ctx.close(); await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
