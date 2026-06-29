import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const photos = new Set();
page.on("response", (r) => {
  const u = r.url();
  if (/_000-scaled\.jpg\.webp/.test(u)) photos.add(u);
});

await page.goto("https://aikawakenichi.com/", { waitUntil: "load", timeout: 60000 }).catch(() => {});
for (let i = 0; i < 30; i++) {
  const l = await page.evaluate(() => document.documentElement.classList.contains("--is-loading"));
  if (!l) break;
  await page.waitForTimeout(1000);
}
await page.waitForTimeout(2000);
await page.mouse.move(720, 450);
for (let i = 0; i < 7; i++) {
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(1500);
}

console.log("PHOTOS:");
console.log([...photos].sort().join("\n"));
await browser.close();
