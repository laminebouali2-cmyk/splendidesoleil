// Vérif Brique 7 : (A) retour galerie→accueil (cylindre renaît, pas d'éclats résiduels)
// (B) prefers-reduced-motion → navigation directe, pas de fissure.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run(reduced, tag, outDir) {
  const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 160)); });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 160)));
  const shot = (n) => page.screenshot({ path: path.join(outDir, `${tag}-${n}`), type: 'jpeg', quality: 72 });

  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8500);
  await page.mouse.click(720, 450);
  await page.waitForTimeout(600); await shot('1-after-click.jpg');
  await page.waitForTimeout(1600); await shot('2-gallery.jpg');
  const urlG = page.url();

  // Retour accueil
  const back = await page.evaluate(() => {
    const a = document.querySelector('.dock--gallery .dock__lead');
    if (!a) return null; const r = a.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  if (back) await page.mouse.click(back.x, back.y);
  await page.waitForTimeout(9000); // mini-loader + intro
  await shot('3-back-home.jpg');
  const urlH = page.url();

  console.log(`[${tag}] urlG=${urlG} urlH=${urlH} errors=${errs.length ? errs.join(' | ') : 'NONE'}`);
  await ctx.close(); await browser.close();
}

(async () => {
  const outDir = path.join(__dirname, 'out', 'verify-b7');
  fs.mkdirSync(outDir, { recursive: true });
  await run(false, 'normal', outDir);
  await run(true, 'reduced', outDir);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
