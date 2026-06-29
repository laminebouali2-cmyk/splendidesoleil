import { chromium } from "playwright";
const B = "http://localhost:3013";
const OUT = "docs/design-references/my-intro";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(B + "/galerie/mariages", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(()=>{});
// poll serré : déclenche dès que les éclats sont en plein vol (matrix3d + opacity en baisse)
let shot=0;
for(let i=0;i<400;i++){
  const st = await page.evaluate(()=>{
    const sh=document.querySelector(".shatter__shard");
    if(!sh) return {gone:true};
    const cs=getComputedStyle(sh);
    return {m:cs.transform, o:parseFloat(cs.opacity)};
  });
  if(st.gone) break;
  if(st.m && st.m.startsWith("matrix3d") && st.o<0.95 && shot<3){
    await page.screenshot({path:`${OUT}/v8-mid-${shot}.png`});
    shot++;
    await page.waitForTimeout(160);
    continue;
  }
  await page.waitForTimeout(25);
}
console.log("shots:", shot);
await browser.close(); process.exit(0);
