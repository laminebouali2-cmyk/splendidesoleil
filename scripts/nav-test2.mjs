import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => console.log("  console:", m.type(), m.text().slice(0,120)));
page.on("pageerror", (e) => console.log("  PAGEERR:", e.message));
page.on("framenavigated", (f) => { if (f === page.mainFrame()) console.log("  navigated:", f.url()); });

await page.goto("http://localhost:3000", { waitUntil: "load", timeout: 60000 }).catch(()=>{});
await page.waitForTimeout(12000);
// is loader gone?
const loaderVisible = await page.evaluate(() => {
  const l = document.querySelector(".loader");
  if (!l) return "no-loader-el";
  const cs = getComputedStyle(l);
  return `op=${cs.opacity} pe=${cs.pointerEvents} disp=${cs.display}`;
});
console.log("loader:", loaderVisible);
// click the label
await page.mouse.click(720, 500);
await page.waitForTimeout(1500);
console.log("after canvas/label click ->", page.url());

// fresh: name -> about (loader cleared)
await page.goto("http://localhost:3000", { waitUntil: "load", timeout: 60000 }).catch(()=>{});
await page.waitForTimeout(6000);
const headerBox = await page.evaluate(() => {
  const a = document.querySelector(".site-header__link");
  const r = a.getBoundingClientRect();
  return { x: r.x+r.width/2, y: r.y+r.height/2 };
});
console.log("header link box:", JSON.stringify(headerBox));
await page.mouse.click(headerBox.x, headerBox.y);
await page.waitForTimeout(1500);
console.log("after name click ->", page.url());
await browser.close();
process.exit(0);
