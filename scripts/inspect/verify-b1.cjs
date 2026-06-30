// Vérif Brique 1 : canvas persistant dans le layout.
// 1) Accueil : intro + cylindre. 2) Toggle déplier/replier. 3) Clic thème → galerie
// (ShatterIntro CSS encore en place). 4) Retour accueil → le cylindre DOIT renaître
// (test de persistance : le contexte WebGL n'a pas été détruit). Console errors loggées.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const outDir = path.join(__dirname, 'out', 'verify-b1');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 200)));
  const shot = (n) => page.screenshot({ path: path.join(outDir, n), type: 'jpeg', quality: 72 });

  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8500); // loader + intro WebGL
  await shot('1-home-cylinder.jpg');

  // Toggle déplier (bouton rond = dernier bouton du dock)
  const roundBtn = () => page.evaluate(() => {
    const els = [...document.querySelectorAll('button, [role=button], a')];
    const b = els[els.length - 1]; if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  let b = await roundBtn();
  if (b) await page.mouse.click(b.x, b.y);
  await page.waitForTimeout(1500);
  await shot('2-flat.jpg');
  b = await roundBtn();
  if (b) await page.mouse.click(b.x, b.y);
  await page.waitForTimeout(1500);
  await shot('3-back-to-cylinder.jpg');

  // Clic au centre (le panneau focus / canvas) → ouvre la galerie
  await page.mouse.click(720, 450);
  await page.waitForTimeout(700);
  await shot('4-transition.jpg');
  let urlGallery = page.url();
  try {
    await page.waitForURL('**/galerie/**', { timeout: 30000 });
    urlGallery = page.url();
  } catch { /* compile lente ? on log l'url telle quelle */ }
  await page.waitForTimeout(2800); // ShatterIntro CSS + viewer
  await shot('5-gallery.jpg');

  // Retour accueil : lien retour du dock galerie (a[href="/"])
  const backLink = await page.evaluate(() => {
    const a = document.querySelector('.dock--gallery .dock__lead');
    if (!a) return null; const r = a.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  if (backLink) await page.mouse.click(backLink.x, backLink.y);
  else await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  try { await page.waitForURL('http://localhost:3001/', { timeout: 20000 }); } catch {}
  await page.waitForTimeout(8500); // mini-loader + replay intro
  await shot('6-return-home-cylinder.jpg');
  const urlHome = page.url();

  fs.writeFileSync(path.join(outDir, 'report.txt'),
    `urlGallery=${urlGallery}\nurlHome=${urlHome}\nerrors:\n` + (errs.join('\n') || '(none)'));
  console.log('urlGallery:', urlGallery);
  console.log('urlHome:', urlHome);
  console.log('errors:', errs.length ? errs.join(' | ') : 'NONE');
  await ctx.close(); await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
