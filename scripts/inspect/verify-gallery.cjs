// Vérif galerie : espacement vertical resserré, reveal au scroll, placeholders carrés,
// toggle visible, mode horizontal. Charge /galerie/mariages directement.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const outDir = path.join(__dirname, 'out', 'verify-gallery');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 160)); });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 160)));
  const shot = (n) => page.screenshot({ path: path.join(outDir, n), type: 'jpeg', quality: 74 });

  await page.goto('http://localhost:3001/galerie/mariages', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000); await shot('1-title.jpg');
  // scroll dans le viewer .gv
  const scrollGv = (y) => page.evaluate((dy) => { const el = document.querySelector('.gv'); if (el) el.scrollBy(0, dy); }, y);
  await scrollGv(900); await page.waitForTimeout(900); await shot('2-imgs-1.jpg');
  await scrollGv(900); await page.waitForTimeout(900); await shot('3-imgs-2.jpg');
  await scrollGv(900); await page.waitForTimeout(900); await shot('4-imgs-3.jpg');

  // toggle horizontal (bouton rond, dernier du dock galerie)
  const toggle = await page.evaluate(() => {
    const b = document.querySelector('.dock--gallery .dock__round');
    if (!b) return null; const r = b.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  fs.writeFileSync(path.join(outDir, 'toggle.json'), JSON.stringify(toggle));
  if (toggle) await page.mouse.click(toggle.x, toggle.y);
  await page.waitForTimeout(1200); await shot('5-horizontal.jpg');
  // scroll horizontal
  await page.evaluate(() => { const el = document.querySelector('.gv'); if (el) el.scrollBy(1400, 0); });
  await page.waitForTimeout(900); await shot('6-horizontal-scroll.jpg');

  console.log('toggle:', JSON.stringify(toggle), '| errors:', errs.length ? errs.join(' | ') : 'NONE');
  await ctx.close(); await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
