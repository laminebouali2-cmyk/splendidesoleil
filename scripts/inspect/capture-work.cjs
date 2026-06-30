// Drive the full "Work" theme flow on a WebGL slider site and film it.
// Brings Work into focus -> enters it -> scrolls inside -> opens a photo. Self-verifies focus.
// Usage: NODE_PATH=<proj>/node_modules node capture-work.cjs <url> <label> <wantTheme>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const url = process.argv[2] || 'https://aikawakenichi.com/';
  const label = process.argv[3] || 'ref-work';
  const wantTheme = (process.argv[4] || 'work').toLowerCase();
  const outDir = path.join(__dirname, 'out', label);
  fs.mkdirSync(outDir, { recursive: true });
  const marks = [];
  const log = (...a) => { console.log(...a); fs.appendFileSync(path.join(outDir, 'log.txt'), a.join(' ') + '\n'); };

  const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
    recordVideo: { dir: outDir, size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  const t0 = Date.now();
  const mark = (tag) => { const ms = Date.now() - t0; marks.push({ tag, ms }); log('MARK', tag, ms + 'ms'); };
  const shot = async (name) => { try { await page.screenshot({ path: path.join(outDir, name + '.jpg'), type: 'jpeg', quality: 70 }); } catch {} };

  // read focused theme + nav button boxes from the live DOM
  const probe = () => page.evaluate(() => {
    const box = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width) }; };
    const focus = document.querySelector('.g-canvas-slider__slide.--is-focus');
    const focusText = focus ? (focus.innerText || '').trim() : '';
    const L = document.querySelector('.g-float-nav__hit.--left');
    const R = document.querySelector('.g-float-nav__hit.--right');
    return { focusText, left: L ? box(L) : null, right: R ? box(R) : null, body: document.body.className };
  });

  log('goto', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (let i = 0; i < 90; i++) { if (!(await page.evaluate(() => document.documentElement.classList.contains('--is-loading'))) && i > 6) break; await page.waitForTimeout(500); }
  await page.waitForTimeout(6500);
  mark('home');
  let p = await probe(); log('focus:', p.focusText, '| left:', JSON.stringify(p.left), 'right:', JSON.stringify(p.right));
  fs.writeFileSync(path.join(outDir, 'nav.json'), JSON.stringify(p, null, 2));
  await shot('00-home');

  // bring wanted theme into focus using the real --left arrow (verify by readback)
  for (let i = 0; i < 4 && !p.focusText.toLowerCase().includes(wantTheme); i++) {
    const btn = p.left || { x: 734, y: 835 };
    log('clicking --left to reach', wantTheme, '->', JSON.stringify(btn));
    mark('switch-click-' + i);
    await page.mouse.click(btn.x, btn.y);
    await page.waitForTimeout(1700);
    p = await probe(); log('  now focus:', p.focusText);
    await shot('01-switch-' + i);
  }
  mark('theme-focused');
  log('FINAL focus before enter:', p.focusText);
  await shot('02-' + wantTheme + '-focused');

  // ENTER the theme: click the centered cover
  await page.mouse.move(712, 700, { steps: 8 });
  await page.waitForTimeout(400);
  mark('enter-click');
  await page.mouse.click(712, 700);
  await page.waitForTimeout(3000);
  mark('entered');
  let st = await page.evaluate(() => ({ body: document.body.className, focus: (document.querySelector('.g-canvas-slider__slide.--is-focus')||{}).innerText }));
  log('AFTER ENTER:', JSON.stringify(st));
  await shot('03-' + wantTheme + '-entered');

  // explore inside: wheel scroll a few times (scroll-velocity warp + navigate photos)
  for (let i = 0; i < 3; i++) { mark('scroll-' + i); await page.mouse.wheel(0, 900); await page.waitForTimeout(900); await shot('04-scroll-' + i); }
  // try opening a photo (click center of the cylinder band)
  mark('open-photo'); await page.mouse.click(712, 450); await page.waitForTimeout(2600); await shot('05-photo-open');
  st = await page.evaluate(() => ({ body: document.body.className, url: location.pathname }));
  log('AFTER OPEN PHOTO:', JSON.stringify(st));
  mark('end');

  fs.writeFileSync(path.join(outDir, 'marks.json'), JSON.stringify(marks, null, 2));
  await context.close();
  await browser.close();
  log('DONE ->', outDir);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
