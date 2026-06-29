import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

await page.goto(url, { waitUntil: "load", timeout: 60000 }).catch((e) => console.log("warn:", e.message));
await page.waitForTimeout(4000);
await page.mouse.move(720, 450);

const labels = [];
const read = async () => (await page.locator(".dock__name").first().textContent())?.trim();

labels.push(await read());
await page.screenshot({ path: "docs/design-references/interact-0.png" });

for (let i = 1; i <= 2; i++) {
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(1700);
  labels.push(await read());
  await page.screenshot({ path: `docs/design-references/interact-${i}.png` });
}

console.log("Catégorie active (molette):", labels.join(" → "));
await browser.close();
