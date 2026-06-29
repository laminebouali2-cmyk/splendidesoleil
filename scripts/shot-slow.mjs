import { chromium } from "playwright";
const B = "http://localhost:3014";
const OUT = "docs/design-references/my-intro";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
// ralentir l'explosion pour la capturer (sans changer le code de prod)
await page.addInitScript(() => {
  const s = document.createElement("style");
  s.textContent = ".shatter__shard{transition:transform 3s cubic-bezier(.3,.5,.3,1)!important,opacity 1.2s ease 2s!important}.shatter__label{transition:transform 3s ease!important,opacity 1.2s ease!important,filter 2s ease!important}";
  (document.head || document.documentElement).appendChild(s);
});
await page.goto(B + "/galerie/mariages", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(()=>{});
await page.waitForSelector(".shatter.is-fall", { timeout: 9000 });
const marks=[500,1100,1700];
let prev=0;
for(const m of marks){ await page.waitForTimeout(m-prev); prev=m; await page.screenshot({path:`${OUT}/v10-slow-${m}.png`}); }
await browser.close(); process.exit(0);
