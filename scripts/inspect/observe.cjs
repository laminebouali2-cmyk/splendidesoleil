// Observe the fully-revealed home: wait through loader+intro, dump DOM map + timed screenshots.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const url = process.argv[2] || 'https://aikawakenichi.com/';
  const label = process.argv[3] || 'ref-home';
  const outDir = path.join(__dirname, 'out', label);
  fs.mkdirSync(outDir, { recursive: true });
  const log = (...a) => console.log(...a);

  const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // wait until the loader % reaches 100 and --is-loading is gone for good
  for (let i = 0; i < 80; i++) {
    const st = await page.evaluate(() => ({ loading: document.documentElement.classList.contains('--is-loading'), txt: (document.body.innerText.match(/\d+%/) || [''])[0] }));
    if (i % 4 === 0) log('  t=' + (i * 0.5).toFixed(1) + 's loading=' + st.loading + ' pct=' + st.txt);
    if (!st.loading && i > 6) break;
    await page.waitForTimeout(500);
  }
  // give the intro reveal generous time to finish
  log('loader done, waiting 6s for intro reveal...');
  await page.waitForTimeout(6000);

  // timed screenshots of the settled home
  for (let i = 0; i < 6; i++) {
    await page.screenshot({ path: path.join(outDir, `home-${i}.jpg`), type: 'jpeg', quality: 70 });
    await page.waitForTimeout(1000);
  }

  // DOM map at loaded state — find clickable covers / canvas hit zones
  const domMap = await page.evaluate(() => {
    const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    const txt = (el) => (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50);
    const all = [...document.querySelectorAll('a, button, [role=button], [data-gl-hover], [class*=cover], [class*=project], [class*=slide], [class*=item], [class*=card], [class*=tile], [class*=cell], li')]
      .map((el) => ({ tag: el.tagName.toLowerCase(), text: txt(el), href: el.getAttribute('href'), cls: (el.className?.toString() || '').slice(0, 70), gl: el.getAttribute('data-gl-hover'), box: rect(el) }))
      .filter((e) => e.box.w > 30 && e.box.h > 30 && e.box.y > -50 && e.box.y < 950);
    return all;
  });
  fs.writeFileSync(path.join(outDir, 'dom-map-loaded.json'), JSON.stringify(domMap, null, 2));
  log('clickable elements on loaded home:', domMap.length);

  await context.close();
  await browser.close();
  log('DONE ->', outDir);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
