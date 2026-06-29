import { chromium } from "playwright";
import fs from "fs";

fs.mkdirSync("docs/research/flatten", { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto("https://aikawakenichi.com", { waitUntil: "load", timeout: 60000 }).catch((e) => console.log("warn:", e.message));

const findBtn = () =>
  page.evaluate(() => {
    let best = null;
    for (const el of document.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const round = parseFloat(cs.borderRadius) >= r.width * 0.4;
      if (
        cs.cursor === "pointer" && round &&
        r.width >= 44 && r.width <= 84 && Math.abs(r.width - r.height) < 10 &&
        r.y > 780 && r.bottom <= window.innerHeight
      ) {
        const cx = r.x + r.width / 2;
        if (!best || cx > best.cx) best = { cx, cy: r.y + r.height / 2, w: Math.round(r.width) };
      }
    }
    return best;
  });

// Poll jusqu'à ce que le dock (bouton rond) apparaisse = repos complet
let cand = null;
for (let i = 0; i < 70; i++) {
  await page.waitForTimeout(1000);
  cand = await findBtn();
  if (cand) {
    console.log(`dock visible à t=${i + 1}s`, JSON.stringify(cand));
    break;
  }
}
await page.waitForTimeout(800);
await page.screenshot({ path: "docs/research/flatten/before.png" });

if (cand) {
  await page.mouse.move(cand.cx, cand.cy);
  await page.mouse.click(cand.cx, cand.cy);
  let prev = 0;
  for (const t of [200, 500, 900, 1400, 2200, 3400]) {
    await page.waitForTimeout(t - prev);
    prev = t;
    await page.screenshot({ path: `docs/research/flatten/after-${String(t).padStart(4, "0")}.png` });
  }
  await page.mouse.click(cand.cx, cand.cy);
  await page.waitForTimeout(2400);
  await page.screenshot({ path: "docs/research/flatten/toggle-back.png" });
} else {
  console.log("bouton introuvable");
}
console.log("✓ flatten frames");
await browser.close();
