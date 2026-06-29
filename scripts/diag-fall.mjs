import { chromium } from "playwright";
const B = "http://localhost:3013";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(B + "/galerie/mariages", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(()=>{});
// attendre que la 1re image de fond du shard soit chargée
await page.waitForSelector(".shatter__shard", { timeout: 8000 });
// poll jusqu'à opacity<0.95 puis dump complet
for(let i=0;i<400;i++){
  const done = await page.evaluate(()=>{
    const sh=document.querySelector(".shatter__shard");
    if(!sh) return "gone";
    return parseFloat(getComputedStyle(sh).opacity) < 0.95 ? "mid" : null;
  });
  if(done==="gone"){console.log("déjà gone"); break;}
  if(done==="mid"){
    const dump = await page.evaluate(()=>{
      const sh=document.querySelector(".shatter");
      const cs = sh ? getComputedStyle(sh) : null;
      const shards=[...document.querySelectorAll(".shatter__shard")];
      let inView=0, anyBg=null, firstRect=null;
      shards.forEach((s,idx)=>{
        const r=s.getBoundingClientRect();
        if(r.bottom>0 && r.top<900 && r.right>0 && r.left<1440) inView++;
        if(idx===0){ firstRect={x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}; anyBg=getComputedStyle(s).backgroundImage.slice(0,40); }
      });
      return {
        shatterPresent:!!sh, bg:cs?.backgroundColor, z:cs?.zIndex, opacity:cs?.opacity,
        rect: sh?{w:Math.round(sh.getBoundingClientRect().width),h:Math.round(sh.getBoundingClientRect().height)}:null,
        shardCount:shards.length, inView, firstRect, firstBg:anyBg,
        flashOpacity: getComputedStyle(document.querySelector(".shatter__flash")).opacity,
      };
    });
    console.log(JSON.stringify(dump,null,2));
    break;
  }
  await page.waitForTimeout(25);
}
await browser.close(); process.exit(0);
