import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "commit", timeout: 60000 }).catch((e) => console.log("warn:", e.message));

// loader ~3.3s puis intro (bascule) ~2s
let prev = 0;
for (const [t, name] of [
  [5500, "bracelet-flip"],
  [9000, "bracelet-rest1"],
  [11000, "bracelet-rest2"],
]) {
  await page.waitForTimeout(t - prev);
  prev = t;
  await page.screenshot({ path: `docs/design-references/${name}.png` });
  console.log("✓", name);
}
await browser.close();
