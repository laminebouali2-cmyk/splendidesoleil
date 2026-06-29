import { chromium } from "playwright";
import fs from "fs";

fs.mkdirSync("docs/design-references/my-intro", { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto("http://localhost:3000", { waitUntil: "commit", timeout: 60000 }).catch((e) => console.log("warn:", e.message));

let prev = 0;
for (const t of [2600, 2900, 3200, 3600, 4000, 4400, 4800, 5200, 5800, 6600, 7600]) {
  await page.waitForTimeout(t - prev);
  prev = t;
  await page.screenshot({ path: `docs/design-references/my-intro/f${String(t).padStart(4, "0")}.png` });
}
console.log("✓ frames");
await browser.close();
