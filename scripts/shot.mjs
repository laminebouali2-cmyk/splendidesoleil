import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3000";
const tag = process.argv[3] || "clone";
const browser = await chromium.launch();

for (const [w, h, name] of [
  [1440, 900, `${tag}-1440`],
  [375, 812, `${tag}-375`],
]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "load", timeout: 60000 }).catch((e) => console.log("warn:", e.message));
  await page.waitForTimeout(3500); // laisser WebGL + animations s'initialiser
  await page.screenshot({ path: `docs/design-references/${name}.png` });
  await ctx.close();
  console.log("✓ shot", name);
}
await browser.close();
