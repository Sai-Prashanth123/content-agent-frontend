import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { safeUrl, wireBookingLinks, wireContact, renderProof, renderResults, initTabs, initMotion, init } from "../main.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
function page({ reduced = false } = {}) {
  const dom = new JSDOM(html);
  dom.window.matchMedia = (q) => ({ matches: reduced && q.includes("reduce"), addEventListener() {}, removeEventListener() {} });
  return dom;
}

test("safeUrl accepts http(s)/mailto and rejects everything else", () => {
  assert.equal(safeUrl("https://cal.com/tp/intro"), "https://cal.com/tp/intro");
  assert.equal(safeUrl("  https://calendly.com/x  "), "https://calendly.com/x");
  assert.equal(safeUrl("mailto:hi@example.com"), "mailto:hi@example.com");
  for (const bad of ["", "   ", "REPLACE_ME", "javascript:alert(1)", "JavaScript:alert(1)", "data:text/html,x", "//evil.com", undefined, null]) {
    assert.equal(safeUrl(bad), null, String(bad));
  }
});

test("valid booking URL is applied to every CTA in a new tab", () => {
  const { document } = page().window;
  const n = wireBookingLinks(document, "https://cal.com/tp/intro");
  const ctas = [...document.querySelectorAll('[data-cta="book"]')];
  assert.equal(n, ctas.length);
  for (const a of ctas) {
    assert.equal(a.getAttribute("href"), "https://cal.com/tp/intro");
    assert.equal(a.getAttribute("target"), "_blank");
    assert.equal(a.getAttribute("rel"), "noopener");
  }
});

test("placeholder or unsafe booking URL falls back to #book", () => {
  for (const url of ["REPLACE_ME", "", "javascript:alert(1)"]) {
    const { document } = page().window;
    wireBookingLinks(document, url);
    for (const a of document.querySelectorAll('[data-cta="book"]')) {
      assert.equal(a.getAttribute("href"), "#book");
      assert.equal(a.hasAttribute("target"), false);
    }
  }
});

test("contact email only shows when real", () => {
  let { document } = page().window;
  assert.equal(wireContact(document, "REPLACE_ME"), false);
  for (const el of document.querySelectorAll("[data-contact]")) assert.ok(el.hidden);
  ({ document } = page().window);
  assert.equal(wireContact(document, "hello@thought-pilot.com"), true);
  for (const el of document.querySelectorAll("[data-contact]")) assert.equal(el.hidden, false);
  const link = document.querySelector("[data-contact-link]");
  assert.equal(link.getAttribute("href"), "mailto:hello@thought-pilot.com");
  assert.equal(link.textContent, "hello@thought-pilot.com");
});

test("proof stays hidden when empty", () => {
  const { document } = page().window;
  assert.equal(renderProof(document, [], []), false);
  assert.ok(document.getElementById("proof").hidden);
});

test("proof renders as text, never markup", () => {
  const { document } = page().window;
  const evil = '<img src=x onerror="window.pwned=1">';
  const shown = renderProof(document, [{ name: "Acme", src: "assets/logos/acme.svg" }], [{ quote: evil, name: "Jane", role: "CEO" }]);
  assert.equal(shown, true);
  assert.equal(document.getElementById("proof").hidden, false);
  assert.equal(document.querySelector("#proof-testimonials img"), null);
  assert.ok(document.querySelector("#proof-testimonials").textContent.includes(evil));
  const logo = document.querySelector("#proof-logos img");
  assert.equal(logo.getAttribute("alt"), "Acme");
});

test("tabs: one panel visible, click and arrow keys switch", () => {
  const { window } = page();
  const { document } = window;
  const root = document.querySelector(".tabs");
  initTabs(root);
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const visible = () => [...root.querySelectorAll('[role="tabpanel"]')].filter((p) => !p.hidden).map((p) => p.id);
  assert.deepEqual(visible(), ["panel-li"]);
  tabs[2].click();
  assert.deepEqual(visible(), ["panel-yt"]);
  assert.equal(tabs[2].getAttribute("aria-selected"), "true");
  tabs[2].dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  assert.deepEqual(visible(), ["panel-vis"]);
  tabs[3].dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  assert.deepEqual(visible(), ["panel-li"], "wraps around");
  tabs[0].dispatchEvent(new window.KeyboardEvent("keydown", { key: "End", bubbles: true }));
  assert.deepEqual(visible(), ["panel-vis"]);
});

test("reduced motion: everything visible and gate lines complete immediately", () => {
  const { window } = page({ reduced: true });
  const { document } = window;
  const fullTexts = [...document.querySelectorAll("[data-gate-line]")].map((s) => s.textContent);
  initMotion(document, window);
  for (const el of document.querySelectorAll("[data-reveal]")) assert.ok(el.classList.contains("is-visible"));
  assert.deepEqual([...document.querySelectorAll("[data-gate-line]")].map((s) => s.textContent), fullTexts);
  for (const n of document.querySelectorAll(".pipe-node")) assert.ok(n.classList.contains("is-lit"));
});

test("no IntersectionObserver: same safe fallback as reduced motion", () => {
  const { window } = page();
  delete window.IntersectionObserver;
  initMotion(window.document, window);
  for (const el of window.document.querySelectorAll("[data-reveal]")) assert.ok(el.classList.contains("is-visible"));
});

test("init wires everything with default config and sets the year", () => {
  const { window } = page({ reduced: true });
  init(window.document, window, { BOOKING_URL: "REPLACE_ME", CONTACT_EMAIL: "REPLACE_ME", LOGOS: [], TESTIMONIALS: [] });
  assert.equal(window.document.getElementById("year").textContent, String(new Date().getFullYear()));
  assert.ok(window.document.getElementById("proof").hidden);
});

test("typing a gate card keeps its height (no layout shift)", () => {
  const { window } = page();
  const { document } = window;
  window.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(el) { this.cb([{ isIntersecting: true, target: el }]); }
    unobserve() {}
  };
  window.setTimeout = () => 0; // freeze typing after the first character
  for (const pre of document.querySelectorAll(".gate-lines")) Object.defineProperty(pre, "offsetHeight", { value: 128 });
  initMotion(document, window);
  for (const pre of document.querySelectorAll(".gate-lines")) assert.equal(pre.style.minHeight, "128px");
});

test("renderResults shows approved results as text and unhides the section", () => {
  const { document } = page().window;
  assert.equal(renderResults(document, []), false);
  assert.ok(document.getElementById("results").hidden);
  const ok = renderResults(document, [{ who: "<img src=x onerror=1>SaaS operator on X", before: "124", after: "615", metric: "median views per post", window: "10 weeks" }, null, 3]);
  assert.equal(ok, true);
  assert.equal(document.getElementById("results").hidden, false);
  const cards = document.querySelectorAll("#results-list > *");
  assert.equal(cards.length, 1);
  assert.equal(document.querySelector("#results-list img"), null, "no markup injection");
  assert.ok(document.getElementById("results-list").textContent.includes("<img src=x onerror=1>"));
  assert.ok(document.getElementById("results-list").textContent.includes("615"));
});
