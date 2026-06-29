import { chromium } from "playwright";
const B = "http://localhost:3010";
const OUT = "docs/design-references/my-intro";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(B + "/galerie/mariages", { waitUntil: "load", timeout: 60000 }).catch(() => {});
// auto-fall à 720ms ; on shoote pendant la transition (1.2s)
const marks = [820, 960, 1120];
let prev = 0;
for (const m of marks) {
  await page.waitForTimeout(m - prev);
  prev = m;
  await page.screenshot({ path: `${OUT}/v4-boom-${m}.png` });
}
await browser.close();
process.exit(0);
