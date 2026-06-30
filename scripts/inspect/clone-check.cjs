// Capture clone: cylinder + the unfold toggle, and report console/page errors.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const outDir = path.join(__dirname, 'out', 'clone-b1');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 200)));

  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000); // intro
  await page.screenshot({ path: path.join(outDir, 'A-cylinder.jpg'), type: 'jpeg', quality: 75 });

  // find the toggle-flat button (round button, last in the dock) and click it
  const btn = await page.evaluate(() => {
    const els = [...document.querySelectorAll('button, [role=button]')];
    const b = els[els.length - 1]; // dock round toggle is last
    if (!b) return null; const r = b.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), n: els.length };
  });
  fs.writeFileSync(path.join(outDir, 'btn.json'), JSON.stringify(btn));
  if (btn) { await page.mouse.click(btn.x, btn.y); }
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(outDir, 'B-flat.jpg'), type: 'jpeg', quality: 75 });
  if (btn) { await page.mouse.click(btn.x, btn.y); }
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(outDir, 'C-back.jpg'), type: 'jpeg', quality: 75 });

  fs.writeFileSync(path.join(outDir, 'errors.txt'), errs.join('\n') || '(no console/page errors)');
  console.log('errors:', errs.length ? errs.join(' | ') : 'NONE');
  console.log('toggle btn:', JSON.stringify(btn));
  await ctx.close(); await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
