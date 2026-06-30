// Vérif Brique 4 : transition clic → fissure WebGL → galerie (plus de fissure CSS).
// Filme déplier → explosion → dispersion → galerie qui émerge. Vérifie l'URL + erreurs.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const outDir = path.join(__dirname, 'out', 'verify-b4');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 200)));
  const shot = (n) => page.screenshot({ path: path.join(outDir, n), type: 'jpeg', quality: 72 });

  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8500);
  await shot('0-home.jpg');

  await page.mouse.click(720, 450); // clic au centre → beginEnterGallery
  await page.waitForTimeout(300); await shot('1-deploy.jpg');
  await page.waitForTimeout(350); await shot('2-burst.jpg');
  await page.waitForTimeout(350); await shot('3-explode.jpg');
  await page.waitForTimeout(450); await shot('4-disperse.jpg');
  await page.waitForTimeout(700); await shot('5-gallery.jpg');
  await page.waitForTimeout(900); await shot('6-gallery-clean.jpg');
  const url = page.url();

  fs.writeFileSync(path.join(outDir, 'report.txt'), `url=${url}\nerrors:\n` + (errs.join('\n') || '(none)'));
  console.log('url:', url);
  console.log('errors:', errs.length ? errs.join(' | ') : 'NONE');
  await ctx.close(); await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
