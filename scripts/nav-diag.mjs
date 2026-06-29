import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000", { waitUntil: "load", timeout: 60000 }).catch(()=>{});
await page.waitForTimeout(13000);
const diag = await page.evaluate(() => {
  const at = (x,y) => { const el = document.elementFromPoint(x,y); return el ? `${el.tagName}.${(el.className||"").toString().slice(0,40)}` : "null"; };
  return {
    atHeader: at(632, 44),
    atLabel: at(720, 500),
    atCenter: at(720, 450),
    headerLinkExists: !!document.querySelector(".site-header__link"),
    labelExists: !!document.querySelector(".hero__label"),
  };
});
console.log(JSON.stringify(diag, null, 2));
// programmatic navigation test
await page.evaluate(() => document.querySelector(".site-header__link")?.click());
await page.waitForTimeout(1500);
console.log("after programmatic name .click() ->", page.url());
await browser.close();
process.exit(0);
