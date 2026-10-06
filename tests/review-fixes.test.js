import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { renderProof, init } from "../main.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("if main.js never runs, the inline failsafe removes the js class (content becomes visible)", async () => {
  // runScripts executes the inline <script>; main.js is never loaded (no resources).
  const dom = new JSDOM(html, { runScripts: "dangerously" });
  assert.ok(dom.window.document.documentElement.classList.contains("js"));
  await new Promise((r) => setTimeout(r, 3300));
  assert.equal(dom.window.document.documentElement.classList.contains("js"), false);
  dom.window.close();
});

test("init marks the page ready so the failsafe does not fire", () => {
  const dom = new JSDOM(html);
  dom.window.matchMedia = () => ({ matches: true });
  init(dom.window.document, dom.window, { BOOKING_URL: "REPLACE_ME", CONTACT_EMAIL: "REPLACE_ME", LOGOS: [], TESTIMONIALS: [] });
  assert.equal(dom.window.__tpReady, true);
});

test("a bad config entry cannot block reveals", () => {
  const dom = new JSDOM(html);
  dom.window.matchMedia = () => ({ matches: true });
  init(dom.window.document, dom.window, { BOOKING_URL: "REPLACE_ME", CONTACT_EMAIL: "REPLACE_ME", LOGOS: [null, 5], TESTIMONIALS: [null, "x"] });
  for (const el of dom.window.document.querySelectorAll("[data-reveal]")) assert.ok(el.classList.contains("is-visible"));
  assert.equal(dom.window.__tpReady, true);
});

test("renderProof skips non-object entries", () => {
  const { document } = new JSDOM(html).window;
  assert.equal(renderProof(document, [null], [null, 3]), false);
});

test("FAQ summaries show an open/closed indicator", () => {
  assert.match(css, /summary::after\s*{[^}]*content:/);
  assert.match(css, /details\[open\] summary::after\s*{[^}]*content:/);
});

test("tab buttons are hidden when JS is not running", () => {
  assert.match(css, /html:not\(\.js\) \[role="tablist"\]\s*{[^}]*display:\s*none/);
});

test("copy makes no operational, results or absolute privacy claims", () => {
  const text = new JSDOM(html).window.document.body.textContent;
  assert.doesNotMatch(text, /\bdaily\b/i);
  assert.doesNotMatch(text, /\bdoubled\b/i);
  assert.doesNotMatch(text, /never used to write for anyone else/i);
});

test("late-arriving main.js restores the js class so tabs stay usable", () => {
  const dom = new JSDOM(html);
  dom.window.matchMedia = () => ({ matches: true });
  dom.window.document.documentElement.classList.remove("js"); // failsafe already fired
  init(dom.window.document, dom.window, { BOOKING_URL: "REPLACE_ME", CONTACT_EMAIL: "REPLACE_ME", LOGOS: [], TESTIMONIALS: [] });
  assert.ok(dom.window.document.documentElement.classList.contains("js"));
});
