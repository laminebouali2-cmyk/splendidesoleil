// Vérif About v2 : hero (nom + rôle poétique), récit + réseaux écrits, image fondue
// dans le fond chaud, + « Contact » header global (overlay des réseaux) sur l'accueil.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const outDir = path.join(__dirname, 'out', 'verify-about2');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 160)); });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 160)));
  const shot = (n) => page.screenshot({ path: path.join(outDir, n), type: 'jpeg', quality: 76 });

  // About : hero + récit + image fondue
  await page.goto('http://localhost:3001/about', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2200); await shot('1-hero.jpg');
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 0.95, behavior: 'instant' }));
  await page.waitForTimeout(1200); await shot('2-story.jpg');
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(1200); await shot('3-image-fondue.jpg');

  // Contact global depuis l'accueil
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8500);
  const cbtn = await page.evaluate(() => { const b = document.querySelector('.site-contact'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; });
  if (cbtn) await page.mouse.click(cbtn.x, cbtn.y);
  await page.waitForTimeout(900); await shot('4-contact-overlay.jpg');
  const links = await page.evaluate(() => [...document.querySelectorAll('.contact-veil__link')].map(a => a.textContent));

  console.log('contactBtn:', JSON.stringify(cbtn), '| links:', JSON.stringify(links), '| errors:', errs.length ? errs.join(' | ') : 'NONE');
  await ctx.close(); await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
