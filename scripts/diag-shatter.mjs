import { chromium } from "playwright";
const B = "http://localhost:3011";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(B + "/galerie/mariages", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});

const sample = () => page.evaluate(() => {
  const sh = document.querySelector(".shatter");
  const shard = document.querySelector(".shatter__shard");
  const cs = shard ? getComputedStyle(shard) : null;
  return {
    t: performance.now().toFixed(0),
    shatterPresent: !!sh,
    shatterClass: sh?.className || null,
    shardCount: document.querySelectorAll(".shatter__shard").length,
    transform: cs ? cs.transform.slice(0, 40) : null,
    opacity: cs ? cs.opacity : null,
    transition: cs ? cs.transitionDuration : null,
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
});

// échantillonne toutes les 120ms pendant 3s
for (let i = 0; i < 26; i++) {
  console.log(JSON.stringify(await sample()));
  await page.waitForTimeout(120);
}
await browser.close();
process.exit(0);
