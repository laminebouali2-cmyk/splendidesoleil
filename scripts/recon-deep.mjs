import { chromium } from "playwright";
import fs from "fs";

const URL = process.argv[2] || "https://aikawakenichi.com/";
const REF = "docs/design-references";
const OUT = "docs/research";
fs.mkdirSync(REF, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});
const page = await ctx.newPage();

// Capture des assets via le réseau (les photos sont des textures, pas des <img>)
const assets = new Set();
page.on("response", (r) => {
  const u = r.url();
  if (/\.(jpe?g|png|webp|avif|gif|svg|mp4|webm|woff2?|ktx2|basis|glb|json)(\?|$)/i.test(u)) assets.add(u);
});

console.log("→ Chargement…");
await page.goto(URL, { waitUntil: "load", timeout: 60000 }).catch((e) => console.log("goto warn:", e.message));

// Attendre la fin du préchargeur (--is-loading retiré)
let loaded = false;
for (let i = 0; i < 30; i++) {
  const isLoading = await page.evaluate(() => document.documentElement.classList.contains("--is-loading"));
  if (!isLoading) { loaded = true; break; }
  await page.waitForTimeout(1000);
}
console.log("Préchargeur terminé:", loaded);
await page.waitForTimeout(2500);

const grab = () =>
  page.evaluate(() => ({
    y: Math.round(window.scrollY),
    h: document.documentElement.scrollHeight,
    imgs: document.querySelectorAll("img").length,
    canvas: document.querySelectorAll("canvas").length,
    videos: document.querySelectorAll("video").length,
    htmlClass: document.documentElement.className.slice(0, 100),
    visibleText: [...document.querySelectorAll("h1,h2,h3,a,p,span")]
      .filter((el) => { const r = el.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0 && el.offsetParent !== null; })
      .map((el) => (el.textContent || "").trim().replace(/\s+/g, " "))
      .filter((t) => t.length > 1 && t.length < 60)
      .slice(0, 12),
  }));

const steps = [];
const initial = await grab();
console.log("État initial:", JSON.stringify(initial));
await page.screenshot({ path: `${REF}/home-00-hero.png` });
steps.push({ step: 0, ...initial });

// Scroll progressif (pilote Lenis via wheel events réels)
await page.mouse.move(720, 450);
for (let i = 1; i <= 10; i++) {
  await page.mouse.wheel(0, 1000);
  await page.waitForTimeout(1100);
  const s = await grab();
  await page.screenshot({ path: `${REF}/home-${String(i).padStart(2, "0")}-scroll.png` });
  steps.push({ step: i, ...s });
  console.log(`scroll ${i}: y=${s.y} imgs=${s.imgs} canvas=${s.canvas}`);
}

const assetList = [...assets].sort();
fs.writeFileSync(`${OUT}/SCROLL_LOG.json`, JSON.stringify(steps, null, 2));
fs.writeFileSync(`${OUT}/ASSETS.json`, JSON.stringify(assetList, null, 2));
console.log("\n=== ASSETS captés (" + assetList.length + ") ===");
assetList.slice(0, 40).forEach((a) => console.log(a));
console.log("\n✓ Screenshots → docs/design-references/home-*.png");
await browser.close();
