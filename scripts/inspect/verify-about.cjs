// Vérif About : hero (nom + Photographe), image intégrée, et interaction CONTACT
// (clic sur la pilule → réseaux Email/Instagram/Facebook).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const outDir = path.join(__dirname, 'out', 'verify-about');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 160)); });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 160)));
  const shot = (n) => page.screenshot({ path: path.join(outDir, n), type: 'jpeg', quality: 74 });

  await page.goto('http://localhost:3001/about', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2200); await shot('1-hero.jpg');
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(1500); await shot('2-image.jpg');

  // clic sur la pilule "À propos" du dock → ouvre le contact
  const pill = await page.evaluate(() => {
    const b = document.querySelector('.dock--about .dock__bar--btn');
    if (!b) return null; const r = b.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  if (pill) await page.mouse.click(pill.x, pill.y);
  await page.waitForTimeout(900); await shot('3-contact-open.jpg');
  // état du DOM contact
  const open = await page.evaluate(() => !!document.querySelector('.ab-contact--open'));
  const links = await page.evaluate(() => [...document.querySelectorAll('.ab-contact__link')].map(a => a.textContent));

  console.log('pill:', JSON.stringify(pill), '| contactOpen:', open, '| links:', JSON.stringify(links), '| errors:', errs.length ? errs.join(' | ') : 'NONE');
  await ctx.close(); await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
