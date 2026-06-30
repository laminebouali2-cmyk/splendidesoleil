// Reco About du vrai site + interaction CONTACT (clic sur la pilule du dock → réseaux).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const outDir = path.join(__dirname, 'out', 'ref-about2');
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('https://aikawakenichi.com/about', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(9000);
  await p.screenshot({ path: path.join(outDir, '1-top.jpg'), type: 'jpeg', quality: 74 });

  // DOM map du dock (boutons en bas) pour trouver la pilule "nom de page"
  const dock = await p.evaluate(() => {
    const btns = [...document.querySelectorAll('button, a, [role=button]')]
      .map((el) => { const r = el.getBoundingClientRect(); return { t: (el.innerText || '').trim().slice(0, 24), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height), vis: r.width > 0 && r.y > 700 }; })
      .filter((e) => e.vis);
    return btns;
  });
  fs.writeFileSync(path.join(outDir, 'dock.json'), JSON.stringify(dock, null, 2));

  // clic sur la pilule centrale du dock (souvent le nom de page / "ABOUT")
  const pill = dock.find((d) => /about|contact|kenichi|info/i.test(d.t)) || dock.sort((a, c) => c.w - a.w)[0];
  if (pill) { await p.mouse.click(pill.x, pill.y); }
  await p.waitForTimeout(1600);
  await p.screenshot({ path: path.join(outDir, '2-contact.jpg'), type: 'jpeg', quality: 74 });

  // bas de page (image intégrée)
  await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await p.waitForTimeout(2500);
  await p.screenshot({ path: path.join(outDir, '3-bottom.jpg'), type: 'jpeg', quality: 74 });

  console.log('dock pill:', JSON.stringify(pill));
  await ctx.close(); await b.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
