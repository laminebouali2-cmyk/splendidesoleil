import { chromium } from "playwright";
import fs from "fs";
fs.mkdirSync("docs/design-references/my-intro", { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto("http://localhost:3000", { waitUntil: "commit", timeout: 60000 }).catch((e) => console.log("warn:", e.message));
await page.waitForTimeout(9000);
await page.screenshot({ path: "docs/design-references/my-intro/flat-0-before.png" });
await page.click(".dock__round").catch((e) => console.log("click warn:", e.message));
let prev = 0;
for (const t of [400, 900, 1500]) {
  await page.waitForTimeout(t - prev); prev = t;
  await page.screenshot({ path: `docs/design-references/my-intro/flat-${t}.png` });
}
await page.click(".dock__round").catch(() => {});
await page.waitForTimeout(1500);
await page.screenshot({ path: "docs/design-references/my-intro/flat-back.png" });
console.log("✓ flat");
await browser.close();
process.exit(0);
