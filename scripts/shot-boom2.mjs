import { chromium } from "playwright";
const B = "http://localhost:3011";
const OUT = "docs/design-references/my-intro";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = []; page.on("pageerror", e => errs.push(e.message));
await page.goto(B + "/galerie/mariages", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});

// attendre l'apparition de .shatter.is-fall (début de l'explosion)
await page.waitForSelector(".shatter.is-fall", { timeout: 8000 }).catch(() => console.log("is-fall jamais vu"));
// capturer 3 frames pendant l'explosion (transform 1.55s)
await page.screenshot({ path: `${OUT}/v5-boom-a.png` });
await page.waitForTimeout(350);
await page.screenshot({ path: `${OUT}/v5-boom-b.png` });
await page.waitForTimeout(350);
await page.screenshot({ path: `${OUT}/v5-boom-c.png` });
console.log("errs:", errs.slice(0, 3));
await browser.close();
process.exit(0);
