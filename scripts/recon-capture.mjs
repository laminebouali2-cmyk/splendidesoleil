import { chromium } from "playwright";
import fs from "fs";

const URL = process.argv[2] || "https://aikawakenichi.com/";
const REF = "docs/design-references";
const OUT = "docs/research";
fs.mkdirSync(`${REF}/video`, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  recordVideo: { dir: `${REF}/video`, size: { width: 1440, height: 900 } },
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});
const page = await ctx.newPage();

const assets = new Set();
page.on("response", (r) => {
  const u = r.url();
  if (/\.(jpe?g|png|webp|avif|mp4|webm|ktx2|basis|glb)(\?|$)/i.test(u)) assets.add(u);
});

await page.goto(URL, { waitUntil: "load", timeout: 60000 }).catch((e) => console.log("goto warn:", e.message));
for (let i = 0; i < 30; i++) {
  const l = await page.evaluate(() => document.documentElement.classList.contains("--is-loading"));
  if (!l) break;
  await page.waitForTimeout(1000);
}
await page.waitForTimeout(2500);

// 1) Specs DOM du shell (texte visible + styles calculés + positions)
const domSpecs = await page.evaluate(() => {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0 && el.offsetParent !== null;
  };
  const out = [];
  for (const el of document.querySelectorAll("h1,h2,h3,h4,p,a,span,button,nav,div")) {
    const t = (el.textContent || "").trim().replace(/\s+/g, " ");
    if (!vis(el)) continue;
    // garder seulement les éléments "feuilles" porteurs de texte court, ou éléments interactifs
    const leaf = el.children.length <= 2;
    if ((t.length > 0 && t.length < 40 && leaf) || el.tagName === "BUTTON" || el.tagName === "A") {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 50),
        text: t.slice(0, 40),
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
        color: cs.color,
        mixBlendMode: cs.mixBlendMode,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      });
    }
  }
  const body = getComputedStyle(document.body);
  return {
    bg: body.backgroundColor,
    bodyColor: body.color,
    title: document.title,
    elements: out.slice(0, 60),
  };
});
fs.writeFileSync(`${OUT}/DOM_SPECS.json`, JSON.stringify(domSpecs, null, 2));
await page.screenshot({ path: `${REF}/real-00-loaded.png` });

// 2) Parallax — bouger la souris aux 4 coins
const corners = [[120, 120], [1320, 120], [1320, 780], [120, 780], [720, 450]];
for (let i = 0; i < corners.length; i++) {
  await page.mouse.move(corners[i][0], corners[i][1], { steps: 10 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${REF}/parallax-${i}.png` });
}

// 3) Rotation du carrousel via molette
await page.mouse.move(720, 450);
for (let i = 1; i <= 14; i++) {
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(650);
  await page.screenshot({ path: `${REF}/rotate-${String(i).padStart(2, "0")}.png` });
}

// 4) Essayer le dock (flèche suivante) si présent
try {
  const next = page.locator("button").last();
  for (let i = 0; i < 4; i++) {
    await next.click({ timeout: 2000 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${REF}/dock-next-${i}.png` });
  }
} catch (e) {
  console.log("dock click warn:", e.message);
}

fs.writeFileSync(`${OUT}/ASSETS_FULL.json`, JSON.stringify([...assets].sort(), null, 2));
console.log("Assets captés:", assets.size);
console.log("DOM elements:", domSpecs.elements.length, "| bg:", domSpecs.bg);
await ctx.close(); // sauvegarde la vidéo
await browser.close();
console.log("✓ Capture terminée → docs/design-references/ (+ /video) et docs/research/DOM_SPECS.json");
