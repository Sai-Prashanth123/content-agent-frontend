// Layout check (spec section 7): no horizontal scroll at 360px, plus screenshots.
// Usage: node scripts/layout-check.mjs [url]   (needs the local server running)
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync } from "node:fs";

const url = process.argv[2] || "http://localhost:4173/";
const chrome = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(existsSync);
mkdirSync("shots", { recursive: true });
const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
let failed = false;
for (const [name, width, scheme] of [["mobile-360-light", 360, "light"], ["mobile-375-dark", 375, "dark"], ["desktop-1440-light", 1440, "light"]]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 800, isMobile: width < 800, hasTouch: width < 800, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }, { name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(url, { waitUntil: "networkidle0" });
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  const ok = sw <= width;
  if (!ok) failed = true;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: scrollWidth ${sw} <= ${width}`);
  await page.screenshot({ path: `shots/${name}.png`, fullPage: true });
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
