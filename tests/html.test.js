import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { findCopyViolations } from "../scripts/check-copy.mjs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const doc = new JSDOM(html).window.document;

test("has exactly one h1 and the spec's section ids in order", () => {
  assert.equal(doc.querySelectorAll("h1").length, 1);
  const ids = [...doc.querySelectorAll("main > section")].map((s) => s.id);
  assert.deepEqual(ids, ["hero", "problem", "how", "why", "outputs", "inside", "onboarding", "proof", "faq", "book"]);
});

test("every Book a call CTA ships a working no-JS fallback", () => {
  const ctas = [...doc.querySelectorAll('[data-cta="book"]')];
  assert.ok(ctas.length >= 3, "header, hero and final band at least");
  for (const a of ctas) assert.equal(a.getAttribute("href"), "#book");
});

test("proof section is hidden by default and contact is hidden", () => {
  assert.ok(doc.getElementById("proof").hasAttribute("hidden"));
  for (const el of doc.querySelectorAll("[data-contact]")) assert.ok(el.hasAttribute("hidden"));
});

test("SEO and share metadata present", () => {
  assert.ok(doc.querySelector("title").textContent.includes("ThoughtPilot"));
  assert.ok(doc.querySelector('meta[name="description"]').content.length > 50);
  assert.ok(doc.querySelector('meta[property="og:image"]').content.endsWith("og-image.png"));
  assert.equal(doc.documentElement.lang, "en");
  assert.ok(doc.querySelector('a.skip-link[href="#main"]'));
});

test("no external requests at all: no external scripts, styles or font hosts", () => {
  for (const s of doc.querySelectorAll("script[src]")) assert.ok(!/^https?:/.test(s.getAttribute("src")));
  for (const l of doc.querySelectorAll("link[href]")) {
    const rel = l.getAttribute("rel");
    if (rel === "canonical") continue;
    assert.ok(!/^https?:/.test(l.getAttribute("href")), l.outerHTML);
  }
});

test("pipeline is a labelled segmented meter with five steps", () => {
  const meter = doc.querySelector(".meter.pipeline-diagram");
  assert.ok(meter);
  assert.equal(meter.getAttribute("role"), "img");
  assert.ok(meter.getAttribute("aria-label"));
  assert.equal(meter.querySelectorAll(".seg.pipe-node").length, 5);
});

test("six reasons render as a lattice of six cells", () => {
  assert.equal(doc.querySelectorAll("#why .lattice > article").length, 6);
});

test("svg diagrams are labelled images", () => {
  for (const svg of doc.querySelectorAll("svg[data-diagram]")) {
    assert.equal(svg.getAttribute("role"), "img");
    assert.ok(svg.getAttribute("aria-label"));
  }
});

test("sample content is labelled illustrative", () => {
  assert.ok(doc.querySelectorAll(".illustrative").length >= 5);
});

test("copy obeys the house rules", () => {
  assert.deepEqual(findCopyViolations(doc.body.textContent + " " + doc.head.innerHTML), []);
});

test("copy scanner catches violations", () => {
  const bad = "This is a game-changer — it's not a tool, it's a team. Jane Example";
  const found = findCopyViolations(bad, ["Jane Example"]);
  assert.ok(found.length >= 4, found.join(","));
  assert.ok(found.includes("client name"));
});

test("client blocklist is not hard-coded in the published scanner", () => {
  const src = readFileSync(new URL("../scripts/check-copy.mjs", import.meta.url), "utf8");
  assert.match(src, /client-blocklist\.local\.txt/);
  assert.doesNotMatch(src, /[A-Z][a-z]+ [A-Z][a-z]+\|[A-Z][a-z]+ [A-Z][a-z]+\|/, "no inline list of names");
});

test("above-the-fold hero is never hidden by reveal animation (LCP)", () => {
  assert.equal(doc.querySelectorAll("#hero [data-reveal], #hero[data-reveal]").length, 0);
});
