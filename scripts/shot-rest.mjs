import { chromium } from "playwright";
import fs from "fs";
fs.mkdirSync("docs/design-references/my-intro", { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto("http://localhost:3000", { waitUntil: "commit", timeout: 60000 }).catch((e) => console.log("warn:", e.message));
let prev = 0;
for (const t of [8000, 10000, 12000]) {
  await page.waitForTimeout(t - prev); prev = t;
  await page.screenshot({ path: `docs/design-references/my-intro/rest-${t}.png` });
}
console.log("✓ rest");
await browser.close();
process.exit(0);
