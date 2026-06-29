import { chromium } from "playwright";
import fs from "fs";

const URL = process.argv[2] || "https://aikawakenichi.com/";
const OUT = "docs/research";
const REF = "docs/design-references";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(REF, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});
const page = await ctx.newPage();
const consoleMsgs = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") consoleMsgs.push(`[${m.type()}] ${m.text()}`.slice(0, 200));
});

console.log("→ Chargement de", URL);
await page.goto(URL, { waitUntil: "load", timeout: 60000 }).catch((e) => console.log("goto warn:", e.message));
// laisser le préchargeur + animations d'intro s'initialiser
await page.waitForTimeout(6000);

const info = await page.evaluate(() => {
  const w = window;
  const has = (x) => typeof x !== "undefined" && x !== null;
  const q = (s) => !!document.querySelector(s);
  const libs = {
    gsap: has(w.gsap) || has(w.TweenMax) || has(w.TweenLite),
    ScrollTrigger: has(w.ScrollTrigger) || (has(w.gsap) && !!w.gsap?.plugins?.ScrollTrigger),
    lenis: has(w.Lenis) || has(w.lenis) || has(w.__lenis) || q('.lenis,[class*="lenis"]'),
    locomotive: has(w.LocomotiveScroll) || q('[data-scroll],.has-scroll-smooth,[class*="locomotive"]'),
    three: has(w.THREE),
    pixi: has(w.PIXI),
    barba: has(w.barba) || has(w.Barba),
    swiper: has(w.Swiper) || q(".swiper"),
    splitting: has(w.Splitting),
    framerMotion: q("[data-projection-id],[style*='transform']") && has(w.__FRAMER__),
  };
  const canvases = [...document.querySelectorAll("canvas")].map((c) => ({
    w: c.width, h: c.height, cls: (c.className || "").toString().slice(0, 60),
  }));
  const scripts = [...document.querySelectorAll("script[src]")].map((s) => s.src);
  const fontFamilies = [...new Set([...document.querySelectorAll("*")].slice(0, 500).map((el) => getComputedStyle(el).fontFamily))];
  const fontLinks = [...document.querySelectorAll("link")].map((l) => l.href).filter((h) => /font|googleapis|typekit|typography|\.woff/i.test(h));
  const sections = [...document.querySelectorAll("body > *, main > *, section, [class*='section']")].slice(0, 40).map((el) => ({
    tag: el.tagName.toLowerCase(),
    cls: (el.className || "").toString().slice(0, 70),
    id: el.id,
    text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 50),
  }));
  return {
    title: document.title,
    url: location.href,
    generator: document.querySelector("meta[name=generator]")?.content || null,
    webflow: q("html[data-wf-page],.w-nav") || /webflow\.com/i.test(document.documentElement.outerHTML.slice(0, 3000)),
    framer: /framer/i.test(document.documentElement.className) || q("[data-framer-name],[data-framer-component-type]"),
    libs,
    canvasCount: canvases.length,
    canvases,
    videoCount: document.querySelectorAll("video").length,
    imgCount: document.querySelectorAll("img").length,
    svgCount: document.querySelectorAll("svg").length,
    scriptCount: scripts.length,
    scripts: scripts.slice(0, 50),
    bodyFont: getComputedStyle(document.body).fontFamily,
    h1Font: document.querySelector("h1") ? getComputedStyle(document.querySelector("h1")).fontFamily : null,
    fontFamilies: fontFamilies.slice(0, 15),
    fontLinks,
    htmlClasses: document.documentElement.className.slice(0, 120),
    bodyClasses: document.body.className.slice(0, 120),
    docHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
    sectionsCount: sections.length,
    sections,
  };
});

fs.writeFileSync(`${OUT}/RECON_RAW.json`, JSON.stringify({ info, consoleMsgs }, null, 2));
await page.screenshot({ path: `${REF}/home-1440-top.png` }).catch((e) => console.log("shot warn:", e.message));

console.log(JSON.stringify(info, null, 2));
console.log("\nCONSOLE (sample):", consoleMsgs.slice(0, 6));
await browser.close();
console.log("\n✓ Recon terminé → docs/research/RECON_RAW.json + docs/design-references/home-1440-top.png");
