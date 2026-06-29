import { chromium } from "playwright";
const B = "http://localhost:3012";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(B + "/galerie/mariages", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
await page.waitForSelector(".shatter.is-fall", { timeout: 9000 }).catch(()=>console.log("no is-fall"));
for (let i=0;i<8;i++){
  const s = await page.evaluate(()=>{
    const sh=document.querySelector(".shatter__shard");
    if(!sh) return {gone:true};
    const cs=getComputedStyle(sh);
    return {transform:cs.transform.slice(0,46), opacity:cs.opacity};
  });
  console.log(i, JSON.stringify(s));
  await page.waitForTimeout(180);
}
await browser.close(); process.exit(0);
