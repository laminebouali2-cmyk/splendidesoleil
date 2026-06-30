// Animation inspector — RECON pass (detection-first, fast).
// Usage: NODE_PATH=<proj>/node_modules node recon.cjs <url> <label>
// Records video of intro, then dumps libs / assets / DOM-map / final screenshot.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const url = process.argv[2] || 'https://aikawakenichi.com/';
  const label = process.argv[3] || 'ref';
  const outDir = path.join(__dirname, 'out', label);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    recordVideo: { dir: outDir, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();

  const assets = [];
  page.on('response', (res) => {
    assets.push({ url: res.url(), type: res.request().resourceType(), ct: res.headers()['content-type'] || '', status: res.status() });
  });

  console.log(`[${label}] goto ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // let the intro / loader play out for the video, but don't screenshot-spam
  await page.waitForTimeout(7000);

  const detect = await page.evaluate(() => {
    const w = window, has = (k) => typeof w[k] !== 'undefined';
    return {
      gsap: has('gsap') || has('TweenMax') || has('TweenLite'),
      three: has('THREE'), OGL: has('OGL') || has('ogl'),
      lenis: has('Lenis') || has('lenis') || !!document.querySelector('.l-wrapper'),
      pixi: has('PIXI'), barba: has('barba'),
      reactRoot: !!document.querySelector('#__next, [data-reactroot]'),
      canvases: [...document.querySelectorAll('canvas')].map((c) => ({ w: c.width, h: c.height, cls: c.className,
        ctx: (() => { try { return c.getContext('webgl2') ? 'webgl2' : (c.getContext('webgl') ? 'webgl' : '2d'); } catch { return '?'; } })() })),
      htmlClass: document.documentElement.className, bodyClass: document.body.className,
    };
  });

  const domMap = await page.evaluate(() => {
    const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    const txt = (el) => (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    const links = [...document.querySelectorAll('a, button, [role=button], [data-gl-hover], [class*=card], [class*=tile], [class*=project], [class*=item], [class*=link]')]
      .map((el) => ({ tag: el.tagName.toLowerCase(), text: txt(el), href: el.getAttribute('href'), cls: el.className?.toString().slice(0, 90), gl: el.getAttribute('data-gl-hover'), box: rect(el) }))
      .filter((e) => e.box.w > 10 && e.box.h > 10 && e.box.y < 2000);
    return { links };
  });

  fs.writeFileSync(path.join(outDir, 'detect.json'), JSON.stringify(detect, null, 2));
  fs.writeFileSync(path.join(outDir, 'dom-map.json'), JSON.stringify(domMap, null, 2));
  fs.writeFileSync(path.join(outDir, 'assets.json'), JSON.stringify(assets, null, 2));
  await page.screenshot({ path: path.join(outDir, 'final.jpg'), type: 'jpeg', quality: 70 });

  await context.close();
  await browser.close();
  console.log(`[${label}] DONE`);
  console.log('DETECT:', JSON.stringify(detect));
  console.log('LINKS:', domMap.links.length, '| scripts:', assets.filter(a => a.type==='script').length);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
