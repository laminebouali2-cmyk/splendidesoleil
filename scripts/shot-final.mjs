import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs=[]; page.on("pageerror",e=>errs.push(e.message));
// About
await page.goto("http://localhost:3003/about",{waitUntil:"load",timeout:60000}).catch(()=>{});
await page.waitForTimeout(3500);
await page.screenshot({path:"docs/design-references/my-intro/v2-about-top.png"});
await page.screenshot({path:"docs/design-references/my-intro/v2-about-full.png", fullPage:true});
// Gallery nature : shatter at entry
await page.goto("http://localhost:3003/galerie/nature",{waitUntil:"load",timeout:60000}).catch(()=>{});
await page.waitForTimeout(700);
await page.screenshot({path:"docs/design-references/my-intro/v2-shatter-crack.png"});
// trigger scroll -> exit
await page.mouse.wheel(0, 300);
await page.waitForTimeout(700);
await page.screenshot({path:"docs/design-references/my-intro/v2-shatter-exit.png"});
await page.waitForTimeout(1200);
await page.screenshot({path:"docs/design-references/my-intro/v2-gal-top.png"});
console.log("errs:", errs.slice(0,6).join(" | ")||"none");
await browser.close(); process.exit(0);
