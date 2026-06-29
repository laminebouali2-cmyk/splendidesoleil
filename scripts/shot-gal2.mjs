import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs=[]; page.on("pageerror",e=>errs.push(e.message));
await page.goto("http://localhost:3008/galerie/nature",{waitUntil:"load",timeout:60000}).catch(()=>{});
await page.waitForTimeout(450);
await page.screenshot({path:"docs/design-references/my-intro/v3-shatter-crack.png"});
await page.waitForTimeout(1100);
await page.screenshot({path:"docs/design-references/my-intro/v3-shatter-fall.png"});
await page.waitForTimeout(2000);
await page.screenshot({path:"docs/design-references/my-intro/v3-gal-title.png"});
// scroll to first image
await page.mouse.wheel(0, 950);
await page.waitForTimeout(1400);
await page.screenshot({path:"docs/design-references/my-intro/v3-gal-img.png"});
const c1 = await page.evaluate(()=>document.querySelector(".dock__count")?.textContent);
console.log("count after 1 scroll:", c1);
await browser.close(); process.exit(0);
