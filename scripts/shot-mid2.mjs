import { chromium } from "playwright";
const B = "http://localhost:3014";
const OUT = "docs/design-references/my-intro";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(B + "/galerie/mariages", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(()=>{});
await page.waitForSelector(".shatter__shard", { timeout: 8000 });
// déclenche dès que le 1er éclat a bougé de >40px verticalement (début de chute), shoote 3 frames
let shots=0;
for(let i=0;i<500;i++){
  const y = await page.evaluate(()=>{
    const sh=document.querySelector(".shatter__shard");
    if(!sh) return "gone";
    const m=getComputedStyle(sh).transform;
    // m = matrix(...) ou matrix3d(...); récupère la translation Y
    const nums = m.match(/-?[\d.]+/g);
    if(!nums) return 0;
    // matrix3d: ty = nums[13]; matrix: ty = nums[5]
    return m.startsWith("matrix3d") ? parseFloat(nums[13]) : parseFloat(nums[5]);
  });
  if(y==="gone"){console.log("gone"); break;}
  if(Math.abs(y)>40 && shots<3){
    await page.screenshot({path:`${OUT}/v9-fall-${shots}.png`});
    shots++;
    await page.waitForTimeout(170);
    continue;
  }
  await page.waitForTimeout(20);
}
console.log("shots:", shots);
await browser.close(); process.exit(0);
