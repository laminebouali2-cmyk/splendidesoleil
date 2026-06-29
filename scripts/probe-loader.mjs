import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto("http://localhost:3000", { waitUntil: "commit", timeout: 60000 }).catch((e) => console.log("warn:", e.message));

let prev = 0;
for (const t of [500, 1000, 1600, 2200, 2900, 3600]) {
  await page.waitForTimeout(t - prev);
  prev = t;
  const info = await page.evaluate(() => {
    const l = document.querySelector(".loader");
    const pct = document.querySelector(".loader__pct");
    const name = document.querySelector(".loader__name");
    return {
      exists: !!l,
      opacity: l ? getComputedStyle(l).opacity : null,
      pct: pct ? pct.textContent : null,
      name: name ? name.textContent : null,
    };
  });
  console.log(t + "ms", JSON.stringify(info));
  if (t === 1000) await page.screenshot({ path: "docs/design-references/loader-probe.png" });
}
await browser.close();
