// Real-browser check of the conversion plumbing (needs the local server running).
// Serves a test config (fake booking URL + fake pixel IDs), blocks and records
// every third-party request, then verifies consent gating, the booking modal,
// UTM passthrough and the booking conversion.
// Usage: node scripts/behavior-check.mjs [url]
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const base = process.argv[2] || "http://localhost:4173/";
const chrome = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(existsSync);
const TEST_CONFIG = `
export const BOOKING_URL = "https://calendly.com/test-tp/voice-audit";
export const CONTACT_EMAIL = "REPLACE_ME";
export const LOGOS = [];
export const TESTIMONIALS = [];
export const PIXELS = { meta: "111", linkedin: "222", linkedinConversionId: "333", google: "G-TEST", googleAdsSendTo: "AW-1/x", x: "o1abc", xEventId: "tw-1" };
export const CONSENT_REQUIRED = true;
export const RESULTS = [];`;

const host = new URL(base).host;
const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage();
const thirdParty = [];
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(m.text()); }); // blocked third-party loads are expected
await page.setRequestInterception(true);
page.on("request", (r) => {
  const u = new URL(r.url());
  if (u.pathname.endsWith("/config.js") && u.host === host) return r.respond({ status: 200, contentType: "text/javascript", body: TEST_CONFIG });
  if (u.host !== host && u.protocol.startsWith("http")) { thirdParty.push(u.host); return r.abort(); }
  r.continue();
});
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${base}?utm_source=linkedin&utm_campaign=q4test`, { waitUntil: "networkidle0" });

const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`); };

check("no third-party request before consent", thirdParty.length === 0, thirdParty.join(", "));
check("consent banner visible when pixels are configured", await page.$eval("#consent", (el) => !el.hidden));

await page.click("[data-consent-accept]");
await new Promise((r) => setTimeout(r, 800));
const pixelHosts = [...new Set(thirdParty)];
for (const h of ["connect.facebook.net", "snap.licdn.com", "www.googletagmanager.com", "static.ads-twitter.com"]) check(`pixel requested after consent: ${h}`, pixelHosts.includes(h));
check("banner hidden after choice", await page.$eval("#consent", (el) => el.hidden));

await page.click("#hero [data-cta=book]");
await new Promise((r) => setTimeout(r, 500));
check("booking modal opens", await page.$eval("#booking-modal", (d) => d.open));
const src = await page.$eval("#booking-modal iframe", (f) => f.src).catch(() => "");
check("scheduler iframe carries UTM params", src.includes("utm_source=linkedin") && src.includes("utm_campaign=q4test"), src);

// Simulate the scheduler's "booked" message from its own origin.
const fired = await page.evaluate(() => {
  const calls = [];
  window.fbq = (...a) => calls.push(["fbq", ...a]);
  window.gtag = (...a) => calls.push(["gtag", ...a]);
  window.lintrk = (...a) => calls.push(["lintrk", ...a]);
  window.twq = (...a) => calls.push(["twq", ...a]);
  window.dispatchEvent(new MessageEvent("message", { origin: "https://calendly.com", data: { event: "calendly.event_scheduled" } }));
  window.dispatchEvent(new MessageEvent("message", { origin: "https://evil.example", data: { event: "calendly.event_scheduled" } }));
  return { calls, done: !document.querySelector("[data-booking-done]").hidden };
});
check("booking fires Schedule on Meta", fired.calls.some((c) => c[0] === "fbq" && c[2] === "Schedule"));
check("booking fires Google Ads conversion", fired.calls.some((c) => c[0] === "gtag" && c[2] === "conversion"));
check("booking fires LinkedIn + X conversions", fired.calls.some((c) => c[0] === "lintrk") && fired.calls.some((c) => c[0] === "twq"));
check("conversion fires once (forged origin ignored)", fired.calls.filter((c) => c[0] === "fbq" && c[2] === "Schedule").length === 1);
check("thank-you state shown", fired.done);
check("no console errors", errors.length === 0, errors.join(" | "));

await browser.close();
process.exit(results.every(Boolean) ? 0 : 1);
