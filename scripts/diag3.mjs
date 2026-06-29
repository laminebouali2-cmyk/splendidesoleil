import { chromium } from "playwright";
const B = "http://localhost:3011";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(B + "/galerie/mariages", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
await page.waitForSelector(".shatter__shard", { timeout: 8000 });

const r = await page.evaluate(() => {
  const sh = document.querySelector(".shatter");
  sh.classList.remove("is-crack");
  sh.classList.add("is-fall");
  const shard = document.querySelector(".shatter__shard");
  const matches = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    if (!rules) continue;
    for (const rule of rules) {
      if (!rule.selectorText) continue;
      // ne garder que les règles touchant transform/opacity
      const css = rule.cssText;
      if (!/transform|opacity/.test(css)) continue;
      // est-ce que l'éclat matche un des sélecteurs ?
      const sels = rule.selectorText.split(",").map(s => s.trim());
      for (const sel of sels) {
        let m = false;
        try { m = shard.matches(sel); } catch { /* sélecteur complexe */ }
        if (m) {
          matches.push({
            sel,
            transform: (css.match(/transform:[^;]+/) || [""])[0].slice(0, 70),
            opacity: (css.match(/opacity:[^;]+/) || [""])[0],
          });
        }
      }
    }
  }
  return { count: matches.length, matches };
});
console.log(JSON.stringify(r, null, 2));
await browser.close();
process.exit(0);
