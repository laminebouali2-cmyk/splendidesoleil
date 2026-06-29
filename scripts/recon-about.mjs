import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errs = []; page.on("pageerror", e => errs.push(e.message));

await page.goto("https://aikawakenichi.com/about", { waitUntil: "load", timeout: 90000 }).catch(e => console.log("nav:", e.message));

// attendre la fin du loader : le texte "100%" puis sa disparition
await page.waitForTimeout(2000);
for (let i = 0; i < 40; i++) {
  const pct = await page.evaluate(() => {
    const t = document.body.innerText || "";
    const m = t.match(/(\d{1,3})%/);
    return m ? m[1] : null;
  });
  if (pct === null) break; // loader parti
  await page.waitForTimeout(400);
}
await page.waitForTimeout(2500); // laisser l'intro jouer

await page.screenshot({ path: "docs/design-references/real-about/a-top.png" });

// dimensions du scroll virtuel
const dims = await page.evaluate(() => ({
  scrollH: document.body.scrollHeight,
  vh: window.innerHeight,
  bodyText: (document.body.innerText || "").slice(0, 400),
}));
console.log("dims:", JSON.stringify(dims));

// descendre via wheel (scroll virtuel WebGL) en plusieurs paliers
const shots = ["b-q1", "c-q2", "d-q3", "e-bottom"];
for (let i = 0; i < 14; i++) {
  await page.mouse.wheel(0, 1100);
  await page.waitForTimeout(450);
  if ([3, 6, 9, 13].includes(i)) {
    const idx = [3, 6, 9, 13].indexOf(i);
    await page.screenshot({ path: `docs/design-references/real-about/${shots[idx]}.png` });
  }
}
await page.waitForTimeout(1200);
await page.screenshot({ path: "docs/design-references/real-about/f-final.png" });

// analyse de l'image background du bas
const bg = await page.evaluate(() => {
  const img = document.querySelector(".about-background__image, [class*=about-background] img, [class*=background] img");
  if (!img) return null;
  const r = img.getBoundingClientRect();
  const cs = getComputedStyle(img);
  const parent = img.closest("[class*=about-background], section, div");
  return {
    cls: img.className?.toString(),
    w: Math.round(r.width), h: Math.round(r.height),
    objectFit: cs.objectFit,
    parentCls: parent?.className?.toString().slice(0, 60),
    parentH: parent ? Math.round(parent.getBoundingClientRect().height) : null,
    src: img.currentSrc || img.src,
  };
});
console.log("bg image:", JSON.stringify(bg, null, 2));
console.log("errs:", errs.slice(0, 5));
await browser.close();
process.exit(0);
