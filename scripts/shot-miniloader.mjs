import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
// first load (full loader plays)
await page.goto("http://localhost:3005",{waitUntil:"load",timeout:60000}).catch(()=>{});
await page.waitForTimeout(11000);
// go to about (client nav via header name)
await page.click(".site-header__link");
await page.waitForTimeout(1500);
// back home via dock home button -> should show MINI loader, not 0-100%
await page.click(".dock__round--home");
await page.waitForTimeout(180);
await page.screenshot({path:"docs/design-references/my-intro/v2-miniloader.png"});
// check what's shown
const info = await page.evaluate(()=>{
  const mini = document.querySelector(".loader--mini");
  const pulse = document.querySelector(".loader__pulse");
  const pct = document.querySelector(".loader__pct");
  return { hasMini: !!mini, hasPulse: !!pulse, hasPct: !!pct };
});
console.log(JSON.stringify(info));
await browser.close(); process.exit(0);
