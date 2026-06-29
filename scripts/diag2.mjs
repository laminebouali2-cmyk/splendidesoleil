import { chromium } from "playwright";
const B = "http://localhost:3011";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(B + "/galerie/mariages", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
await page.waitForSelector(".shatter__shard", { timeout: 8000 });

const r = await page.evaluate(() => {
  const sh = document.querySelector(".shatter");
  const shard = document.querySelector(".shatter__shard");
  // force is-fall tout de suite
  sh.classList.remove("is-crack");
  sh.classList.add("is-fall");
  // forcer un reflow
  void shard.offsetHeight;
  const cs = getComputedStyle(shard);
  const out = {
    parentClass: sh.className,
    inlineStyle: shard.getAttribute("style"),
    ox: cs.getPropertyValue("--ox"),
    oz: cs.getPropertyValue("--oz"),
    fall: cs.getPropertyValue("--fall"),
    rx: cs.getPropertyValue("--rx"),
    transformNow: cs.transform.slice(0, 60),
    opacityNow: cs.opacity,
  };
  return out;
});
console.log(JSON.stringify(r, null, 2));

// laisse 1.6s puis relit (devrait avoir bougé)
await page.waitForTimeout(1600);
const r2 = await page.evaluate(() => {
  const shard = document.querySelector(".shatter__shard");
  if (!shard) return { gone: true };
  const cs = getComputedStyle(shard);
  return { transformLater: cs.transform.slice(0, 60), opacityLater: cs.opacity };
});
console.log(JSON.stringify(r2, null, 2));
await browser.close();
process.exit(0);
