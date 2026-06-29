import { chromium } from "playwright";
import fs from "fs";

fs.mkdirSync("docs/research/orig-intro", { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});
const page = await ctx.newPage();
await page.goto("https://aikawakenichi.com/", { waitUntil: "load", timeout: 60000 }).catch((e) => console.log("warn:", e.message));

let prev = 0;
for (const t of [1600, 2000, 2400, 2800, 3200, 3600, 4000, 4400, 4800, 5200, 5600, 6000, 6500, 7000, 7800]) {
  await page.waitForTimeout(t - prev);
  prev = t;
  await page.screenshot({ path: `docs/research/orig-intro/f${String(t).padStart(4, "0")}.png` });
}
console.log("✓ frames capturées");
await browser.close();
