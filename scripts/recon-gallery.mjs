import { chromium } from "playwright";
import fs from "fs";
fs.mkdirSync("docs/research/gallery", { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto("https://aikawakenichi.com/journey", { waitUntil: "load", timeout: 60000 }).catch(e=>console.log("warn",e.message));

// attendre la fin d'un éventuel loader
for (let i=0;i<40;i++){
  await page.waitForTimeout(1000);
  const pct = await page.evaluate(()=>{ const m=(document.body.innerText||"").match(/(\d+)\s*%/); return m?+m[1]:null; });
  if (pct===null || pct>=100) break;
}
await page.waitForTimeout(8000);
await page.screenshot({ path: "docs/research/gallery/01-top.png" });

// dump layout
const layout = await page.evaluate(()=>{
  const imgs=[...document.querySelectorAll("img")].slice(0,12).map(im=>{
    const r=im.getBoundingClientRect(); const cs=getComputedStyle(im);
    const p=im.parentElement; const pcs=p?getComputedStyle(p):null;
    return { x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
      objFit:cs.objectFit, parentDisplay:pcs?.display, parentGap:pcs?.gap };
  });
  // conteneur principal scrollable
  const body=document.body; const html=document.documentElement;
  return { title:document.title, url:location.href, scrollW:html.scrollWidth, scrollH:html.scrollHeight,
    bodyOverflow:getComputedStyle(body).overflow, imgCount:document.querySelectorAll("img").length, imgs };
});
console.log("LAYOUT:", JSON.stringify(layout,null,1));

// texte du dock (compteur ?)
const dockText = await page.evaluate(()=>{
  const out=[];
  for (const el of document.querySelectorAll("*")){
    const r=el.getBoundingClientRect();
    if (r.y>760 && r.bottom<=window.innerHeight && el.children.length<=2){
      const t=(el.textContent||"").trim();
      if (t && t.length<40) out.push(t);
    }
  }
  return [...new Set(out)].slice(0,12);
});
console.log("DOCK TEXT:", JSON.stringify(dockText));

// scroll vertical
await page.mouse.wheel(0, 1400);
await page.waitForTimeout(1200);
await page.screenshot({ path: "docs/research/gallery/02-scrolled.png" });
const afterScroll = await page.evaluate(()=>({ y:window.scrollY, x:window.scrollX }));
console.log("AFTER WHEEL:", JSON.stringify(afterScroll));

await browser.close(); process.exit(0);
