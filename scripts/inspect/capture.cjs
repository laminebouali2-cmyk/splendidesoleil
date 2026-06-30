// FINAL capture: enter-theme transition via video (frames extracted later with ffmpeg).
// Usage: NODE_PATH=.. node capture.cjs <url> <label> <cx> <cy> [switchArrowX,switchArrowY]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const url = process.argv[2] || 'https://aikawakenichi.com/';
  const label = process.argv[3] || 'ref-enter';
  const cx = Number(process.argv[4] || 712);
  const cy = Number(process.argv[5] || 720);
  const outDir = path.join(__dirname, 'out', label);
  fs.mkdirSync(outDir, { recursive: true });
  const marks = [];
  const log = (...a) => { console.log(...a); fs.appendFileSync(path.join(outDir, 'log.txt'), a.join(' ') + '\n'); };

  const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
    recordVideo: { dir: outDir, size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  const tStart = Date.now();
  const mark = (tag) => { marks.push({ tag, ms: Date.now() - tStart }); log('MARK', tag, (Date.now() - tStart) + 'ms'); };

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (let i = 0; i < 80; i++) {
    const loading = await page.evaluate(() => document.documentElement.classList.contains('--is-loading'));
    if (!loading && i > 6) break;
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(6500); // intro reveal
  mark('home-ready');
  await page.screenshot({ path: path.join(outDir, '00-home.jpg'), type: 'jpeg', quality: 72 });

  // settle hover at the cover center
  await page.mouse.move(cx, cy, { steps: 12 });
  await page.waitForTimeout(500);
  mark('pre-click');
  await page.screenshot({ path: path.join(outDir, '01-pre.jpg'), type: 'jpeg', quality: 72 });

  // THE click that enters the theme — keep video rolling through the transition
  await page.mouse.click(cx, cy);
  mark('click');
  await page.waitForTimeout(3200);
  mark('post');
  const st = await page.evaluate(() => ({ url: location.pathname, body: document.body.className, html: document.documentElement.className }));
  log('AFTER STATE:', JSON.stringify(st));
  await page.screenshot({ path: path.join(outDir, '02-after.jpg'), type: 'jpeg', quality: 72 });

  fs.writeFileSync(path.join(outDir, 'marks.json'), JSON.stringify({ marks, after: st }, null, 2));
  await context.close();
  await browser.close();
  log('DONE ->', outDir);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
