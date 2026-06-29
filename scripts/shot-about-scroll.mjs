import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3003/about",{waitUntil:"load",timeout:60000}).catch(()=>{});
await page.waitForTimeout(2000);
// scroll down in steps to trigger reveals
const h = await page.evaluate(()=>document.body.scrollHeight);
for (let y=0; y<=h; y+=600){ await page.evaluate((yy)=>window.scrollTo(0,yy), y); await page.waitForTimeout(250); }
await page.waitForTimeout(800);
// screenshot the body (mid) and bottom (full image)
await page.evaluate(()=>window.scrollTo(0, 700));
await page.waitForTimeout(500);
await page.screenshot({path:"docs/design-references/my-intro/v2-about-body.png"});
await page.evaluate(()=>window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(700);
await page.screenshot({path:"docs/design-references/my-intro/v2-about-bottom.png"});
console.log("h=",h);
await browser.close(); process.exit(0);
