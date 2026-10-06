import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { STAGES, initialState, step, finalState } from "../console-demo.js";
import { formatCount } from "../counters.js";
import { stageIndexFor } from "../scroll-pipeline.js";
import { buildBookingUrl, isScheduledEvent, bookingOrigin } from "../booking.js";
import { createTracker } from "../tracking.js";

// ---------- console demo (pure state machine)
test("console demo walks every stage in order, then loops", () => {
  let s = initialState();
  const seen = [s.stage];
  for (let i = 0; i < 400 && seen.length < STAGES.length + 1; i++) {
    s = step(s);
    if (s.stage !== seen[seen.length - 1]) seen.push(s.stage);
  }
  assert.deepEqual(seen.slice(0, STAGES.length), STAGES);
  assert.equal(seen[STAGES.length], STAGES[0], "loops back to the first stage");
});

test("console demo final state shows the finished post with every check passed", () => {
  const f = finalState();
  assert.equal(f.stage, "done");
  assert.equal(f.checksPassed, f.checksTotal);
  assert.equal(f.postLines, f.postTotal);
  assert.equal(f.score, 100);
});

test("console demo typing advances the idea one character at a time", () => {
  const s0 = initialState();
  const s1 = step(s0);
  assert.equal(s1.stage, "idea");
  assert.equal(s1.ideaChars, s0.ideaChars + 1);
});

// ---------- counters
test("counters format with thousands separators, decimals and suffix", () => {
  assert.equal(formatCount(3526, 0, ""), "3,526");
  assert.equal(formatCount(5, 0, "x"), "5x");
  assert.equal(formatCount(1.6, 1, "%"), "1.6%");
  assert.equal(formatCount(45, 0, " days"), "45 days");
});

// ---------- scroll pipeline
test("scroll progress maps to a stage index", () => {
  assert.equal(stageIndexFor(0, 5), 0);
  assert.equal(stageIndexFor(0.19, 5), 0);
  assert.equal(stageIndexFor(0.2, 5), 1);
  assert.equal(stageIndexFor(0.99, 5), 4);
  assert.equal(stageIndexFor(1.5, 5), 4);
  assert.equal(stageIndexFor(-1, 5), 0);
});

// ---------- booking
test("booking URL carries UTM params and the embed flags", () => {
  const u = new URL(buildBookingUrl("https://calendly.com/tp/audit", "?utm_source=linkedin&utm_campaign=q4&gclid=abc&other=1", "example.com"));
  assert.equal(u.searchParams.get("utm_source"), "linkedin");
  assert.equal(u.searchParams.get("utm_campaign"), "q4");
  assert.equal(u.searchParams.get("other"), null, "only utm_* params are forwarded");
  assert.equal(u.searchParams.get("embed_domain"), "example.com");
  assert.equal(u.searchParams.get("embed_type"), "Inline");
  const c = new URL(buildBookingUrl("https://cal.com/tp/audit", "?utm_source=meta", "example.com"));
  assert.equal(c.searchParams.get("embed"), "true");
  assert.equal(c.searchParams.get("utm_source"), "meta");
});

test("booking URL rejects unsafe or placeholder links", () => {
  for (const bad of ["REPLACE_ME", "", "javascript:alert(1)", "http://calendly.com/x"]) assert.equal(buildBookingUrl(bad, "", "x.com"), null, bad);
});

test("scheduled-event detection only trusts the booking provider's origin", () => {
  assert.equal(bookingOrigin("https://calendly.com/tp/audit"), "https://calendly.com");
  assert.ok(isScheduledEvent({ origin: "https://calendly.com", data: { event: "calendly.event_scheduled" } }, "https://calendly.com"));
  assert.ok(isScheduledEvent({ origin: "https://cal.com", data: { originator: "CAL", type: "bookingSuccessful" } }, "https://cal.com"));
  assert.ok(!isScheduledEvent({ origin: "https://evil.com", data: { event: "calendly.event_scheduled" } }, "https://calendly.com"));
  assert.ok(!isScheduledEvent({ origin: "https://calendly.com", data: { event: "calendly.page_height" } }, "https://calendly.com"));
  assert.ok(!isScheduledEvent({ origin: "https://calendly.com", data: null }, "https://calendly.com"));
});

// ---------- tracking + consent
function dom() {
  const d = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>", { url: "https://example.com/?utm_source=x" });
  return d.window;
}
const PIX = { meta: "123", linkedin: "456", linkedinConversionId: "", google: "G-ABC", googleAdsSendTo: "", x: "o1x2", xEventId: "" };

test("no pixel script loads before consent", () => {
  const win = dom();
  const t = createTracker(win.document, win, { PIXELS: PIX, CONSENT_REQUIRED: true });
  t.track("schedule");
  assert.equal(win.document.querySelectorAll("script[src]").length, 0);
  assert.equal(t.hasConsent(), false);
});

test("accepting consent loads exactly the configured pixels", () => {
  const win = dom();
  const t = createTracker(win.document, win, { PIXELS: { ...PIX, x: "" }, CONSENT_REQUIRED: true });
  t.accept();
  const srcs = [...win.document.querySelectorAll("script[src]")].map((s) => s.src);
  assert.ok(srcs.some((s) => s.includes("connect.facebook.net")));
  assert.ok(srcs.some((s) => s.includes("snap.licdn.com")));
  assert.ok(srcs.some((s) => s.includes("googletagmanager.com/gtag/js?id=G-ABC")));
  assert.ok(!srcs.some((s) => s.includes("ads-twitter.com")), "empty X id loads nothing");
  assert.equal(t.hasConsent(), true);
});

test("declining consent loads nothing and is remembered", () => {
  const win = dom();
  const t = createTracker(win.document, win, { PIXELS: PIX, CONSENT_REQUIRED: true });
  t.decline();
  assert.equal(win.document.querySelectorAll("script[src]").length, 0);
  const t2 = createTracker(win.document, win, { PIXELS: PIX, CONSENT_REQUIRED: true });
  assert.equal(t2.decided(), true);
  assert.equal(t2.hasConsent(), false);
});

test("no pixel ids means no banner is needed", () => {
  const win = dom();
  const t = createTracker(win.document, win, { PIXELS: { meta: "", linkedin: "", google: "", x: "" }, CONSENT_REQUIRED: true });
  assert.equal(t.needsBanner(), false);
});

test("track after consent calls each loaded pixel's conversion API", () => {
  const win = dom();
  const calls = [];
  const t = createTracker(win.document, win, { PIXELS: { ...PIX, linkedinConversionId: "999", googleAdsSendTo: "AW-1/abc", xEventId: "tw-1" }, CONSENT_REQUIRED: true });
  t.accept();
  win.fbq = (...a) => calls.push(["fbq", ...a]);
  win.gtag = (...a) => calls.push(["gtag", ...a]);
  win.lintrk = (...a) => calls.push(["lintrk", ...a]);
  win.twq = (...a) => calls.push(["twq", ...a]);
  t.track("schedule");
  const names = calls.map((c) => c[0]);
  assert.ok(names.includes("fbq") && names.includes("gtag") && names.includes("lintrk") && names.includes("twq"), names.join(","));
  assert.ok(calls.some((c) => c[0] === "fbq" && c[2] === "Schedule"));
  assert.ok(calls.some((c) => c[0] === "gtag" && c[2] === "conversion"));
});
