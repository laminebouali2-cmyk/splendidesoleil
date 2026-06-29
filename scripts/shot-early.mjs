import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

await page.goto(url, { waitUntil: "commit", timeout: 60000 }).catch((e) => console.log("warn:", e.message));
await page.waitForTimeout(1100);
await page.screenshot({ path: "docs/design-references/loader-early.png" });
console.log("✓ loader-early (≈1.1s)");

await page.waitForTimeout(3400);
await page.screenshot({ path: "docs/design-references/hero-after-loader.png" });
console.log("✓ hero-after-loader (≈4.5s)");

await browser.close();
