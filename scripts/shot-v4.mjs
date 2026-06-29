import { chromium } from "playwright";

const B = "http://localhost:3010";
const OUT = "docs/design-references/my-intro";
const browser = await chromium.launch();

async function shot(path, file, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto(B + path, { waitUntil: "load", timeout: 60000 }).catch(() => {});
  await fn(page);
  await ctx.close();
  if (errs.length) console.log(file, "ERRORS:", errs.slice(0, 3));
}

// --- SHATTER : fissure (~280ms) puis explosion 3D (~1150ms) ---
await shot("/galerie/mariages", "shatter", async (page) => {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/v4-shatter-crack.png` });
  await page.waitForTimeout(850); // dans l'explosion
  await page.screenshot({ path: `${OUT}/v4-shatter-boom.png` });
});

// --- GALERIE : carte titre + 1re image (fond blanc, image plus haute) ---
await shot("/galerie/nature", "galerie", async (page) => {
  await page.waitForTimeout(2600); // shatter fini
  await page.screenshot({ path: `${OUT}/v4-gal-title.png` });
  await page.mouse.wheel(0, 1000);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${OUT}/v4-gal-img.png` });
  const c = await page.evaluate(() => document.querySelector(".dock__count")?.textContent);
  console.log("compteur:", c);
});

// --- ABOUT : haut (titre géant) + bas (image plein cadre) ---
await shot("/about", "about", async (page) => {
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/v4-about-top.png` });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/v4-about-bottom.png` });
});

await browser.close();
process.exit(0);
