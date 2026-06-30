// Vérif Brique 3 : fissure 3D isolée. Charge l'accueil, attend l'intro, appuie sur F
// (déclenche debugShatter : cache le cylindre, éclate le panneau focus). Capture
// la séquence d'explosion pour juger géométrie + rotation + aberration.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const outDir = path.join(__dirname, 'out', 'verify-b3');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 200)));
  const shot = (n) => page.screenshot({ path: path.join(outDir, n), type: 'jpeg', quality: 72 });

  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8500); // loader + intro
  await shot('0-before.jpg');

  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' })));
  await page.waitForTimeout(180); await shot('1-t180.jpg');
  await page.waitForTimeout(220); await shot('2-t400.jpg');
  await page.waitForTimeout(300); await shot('3-t700.jpg');
  await page.waitForTimeout(350); await shot('4-t1050.jpg');
  await page.waitForTimeout(600); await shot('5-t1650-hold.jpg');

  fs.writeFileSync(path.join(outDir, 'errors.txt'), errs.join('\n') || '(none)');
  console.log('errors:', errs.length ? errs.join(' | ') : 'NONE');
  await ctx.close(); await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
