import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
// 1) name -> about
await page.goto("http://localhost:3000", { waitUntil: "load", timeout: 60000 }).catch(()=>{});
await page.waitForTimeout(2500);
await page.click(".site-header__link");
await page.waitForTimeout(1200);
console.log("after name click  ->", page.url());
// 2) home -> wait rest -> click label -> gallery
await page.goto("http://localhost:3000", { waitUntil: "load", timeout: 60000 }).catch(()=>{});
await page.waitForTimeout(11000);
await page.click(".hero__label").catch(async (e)=>{ console.log("label click warn:", e.message); });
await page.waitForTimeout(1200);
console.log("after label click ->", page.url());
// 3) dock open button from a fresh gallery? test dock__open
await page.goto("http://localhost:3000", { waitUntil: "load", timeout: 60000 }).catch(()=>{});
await page.waitForTimeout(11000);
await page.click(".dock__open").catch((e)=>console.log("dock click warn:", e.message));
await page.waitForTimeout(1000);
console.log("after dock click  ->", page.url());
await browser.close();
process.exit(0);
