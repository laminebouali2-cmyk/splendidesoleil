// Vérif Brique 5 : après l'explosion, ~12% d'éclats RESTENT et flottent autour de la
// galerie ; le scroll les efface. + focus pull (flou→net) à l'arrivée.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const outDir = path.join(__dirname, 'out', 'verify-b5');
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

  await page.mouse.click(720, 450);
  await page.waitForTimeout(900); await shot('1-focuspull.jpg'); // galerie floue + éclats
  await page.waitForTimeout(1400); await shot('2-linger.jpg');   // éclats restants qui flottent
  await page.waitForTimeout(1200); await shot('3-linger2.jpg');  // flottement (positions bougent)

  // Scroll de la galerie → les éclats s'effacent
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(500); await shot('4-scroll-fade.jpg');
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(700); await shot('5-scrolled-clean.jpg');

  const url = page.url();
  fs.writeFileSync(path.join(outDir, 'report.txt'), `url=${url}\nerrors:\n` + (errs.join('\n') || '(none)'));
  console.log('url:', url, '| errors:', errs.length ? errs.join(' | ') : 'NONE');
  await ctx.close(); await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
