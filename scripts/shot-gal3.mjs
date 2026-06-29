import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = []; page.on("pageerror", e => errs.push(e.message));
await page.goto("http://localhost:3008/galerie/nature", { waitUntil: "load", timeout: 60000 }).catch(() => {});
// laisse le fracas tomber
await page.waitForTimeout(2800);

// --- mode horizontal : clic sur le bouton rond ---
await page.click(".dock__round");
await page.waitForTimeout(700);
await page.screenshot({ path: "docs/design-references/my-intro/v3-gal-horizontal.png" });
const dirClass = await page.evaluate(() => document.querySelector(".gv")?.className);
console.log("gv class apres toggle:", dirClass);

// avance d'une image avec la fleche suivante
await page.click('.dock__arrow[aria-label="Suivant"]');
await page.waitForTimeout(1100);
await page.screenshot({ path: "docs/design-references/my-intro/v3-gal-h-next.png" });
const cH = await page.evaluate(() => document.querySelector(".dock__count")?.textContent);
console.log("compteur apres 1 suivant (h):", cH);

// --- lightbox : clic sur l'image ---
await page.click(".gv__imgbtn");
await page.waitForTimeout(700);
await page.screenshot({ path: "docs/design-references/my-intro/v3-lightbox.png" });
const lbOpen = await page.evaluate(() => !!document.querySelector(".lb"));
console.log("lightbox ouverte:", lbOpen);

console.log("pageerrors:", errs);
await browser.close();
process.exit(0);
