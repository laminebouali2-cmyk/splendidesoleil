import { chromium } from "playwright";
const B = "http://localhost:3013";
const OUT = "docs/design-references/my-intro";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(B + "/galerie/mariages", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(()=>{});
await page.waitForSelector(".shatter.is-fall", { timeout: 9000 });
const marks=[250,450,650,900];
let prev=0;
for(const m of marks){ await page.waitForTimeout(m-prev); prev=m; await page.screenshot({path:`${OUT}/v7-boom-${m}.png`}); }
await browser.close(); process.exit(0);
