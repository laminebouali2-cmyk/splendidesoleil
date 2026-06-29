import { chromium } from "playwright";

const url = "http://localhost:3000";
const browser = await chromium.launch();

// Desktop 1440 : loader en cours + hero final
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "commit", timeout: 60000 }).catch((e) => console.log("warn:", e.message));
  await page.waitForTimeout(2300);
  await page.screenshot({ path: "docs/design-references/qa-loader.png" });
  await page.waitForTimeout(4200);
  await page.screenshot({ path: "docs/design-references/qa-hero-1440.png" });
  await ctx.close();
  console.log("✓ desktop");
}

// Mobile 375
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "commit", timeout: 60000 }).catch((e) => console.log("warn:", e.message));
  await page.waitForTimeout(7000);
  await page.screenshot({ path: "docs/design-references/qa-hero-375.png" });
  await ctx.close();
  console.log("✓ mobile");
}

await browser.close();
