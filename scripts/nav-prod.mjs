import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("  PAGEERR:", e.message));
page.on("framenavigated", (f) => { if (f === page.mainFrame()) console.log("  nav:", f.url()); });

// name -> about
await page.goto("http://localhost:3002", { waitUntil: "load", timeout: 60000 }).catch(()=>{});
await page.waitForTimeout(6000);
await page.click(".site-header__link");
await page.waitForTimeout(1500);
console.log("name click  ->", page.url());

// home -> rest -> label -> gallery
await page.goto("http://localhost:3002", { waitUntil: "load", timeout: 60000 }).catch(()=>{});
await page.waitForTimeout(11000);
await page.click(".hero__label");
await page.waitForTimeout(1500);
console.log("label click ->", page.url());
await browser.close();
process.exit(0);
