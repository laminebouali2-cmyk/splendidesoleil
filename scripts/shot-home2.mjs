import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs=[]; page.on("pageerror",e=>errs.push(e.message));
// home hero with new images (wait for rest)
await page.goto("http://localhost:3005",{waitUntil:"load",timeout:60000}).catch(()=>{});
await page.waitForTimeout(11000);
await page.screenshot({path:"docs/design-references/my-intro/v2-home.png"});
// cycle to nature (3368) and lumiere via dock arrow
await page.click(".dock__arrow:last-of-type").catch(()=>{});
await page.waitForTimeout(1500);
await page.screenshot({path:"docs/design-references/my-intro/v2-home-nature.png"});
// about title fix
await page.goto("http://localhost:3005/about",{waitUntil:"load",timeout:60000}).catch(()=>{});
await page.waitForTimeout(2500);
await page.screenshot({path:"docs/design-references/my-intro/v2-about-fixed.png"});
console.log("errs:", errs.slice(0,6).join(" | ")||"none");
await browser.close(); process.exit(0);
