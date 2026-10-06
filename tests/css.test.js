import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

// Thought Pilot Console design system tokens (white only).
const tokens = {
  canvas: "#e6e4ee", paper: "rgba(255, 255, 255, .72)", surface: "rgba(255, 255, 255, .5)",
  sunken: "rgba(10, 10, 11, .04)", ink: "#0a0a0b", "ink-2": "#35353c", muted: "#63636d",
  rule: "rgba(10, 10, 11, .1)", "rule-strong": "rgba(10, 10, 11, .2)",
  brand: "#b9a8ff", "brand-deep": "#5b3fd6", alert: "#c8102e", caution: "#7a5c00",
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("all console design-system tokens are defined on :root", () => {
  const root = css.match(/:root\s*{[^}]*}/)[0];
  for (const [k, v] of Object.entries(tokens)) assert.match(root, new RegExp(`--${k}:\\s*${esc(v)};`, "i"), k);
});

test("one theme, white only: no dark palette and no theme toggle", () => {
  assert.doesNotMatch(css, /prefers-color-scheme:\s*dark/);
  assert.doesNotMatch(css, /data-theme/);
  assert.match(css, /color-scheme:\s*light/);
});

test("nothing is round: every border-radius is 0", () => {
  for (const [, v] of css.matchAll(/border-radius:\s*([^;}]+)/g)) assert.equal(v.trim(), "0", v);
});

test("toned canvas ground with glass panels", () => {
  assert.match(css, /body\s*{[^}]*background:[^;]*var\(--canvas\)/);
  assert.match(css, /--glass-blur:\s*blur\(20px\) saturate\(150%\)/);
  assert.match(css, /backdrop-filter:\s*var\(--glass-blur\)/);
  assert.match(css, /--glass-rim:/);
});

test("monospace everywhere, tabular numerals", () => {
  assert.match(css, /--mono:\s*ui-monospace,\s*"SF Mono",\s*Menlo,\s*Consolas/);
  assert.match(css, /body\s*{[^}]*font:[^;]*var\(--mono\)/);
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);
  assert.doesNotMatch(css, /Fraunces|Inter"|JetBrains/);
});

test("focus ring is 2px brand-deep, offset 2px", () => {
  assert.match(css, /:focus-visible\s*{[^}]*outline:\s*2px solid var\(--brand-deep\)[^}]*outline-offset:\s*2px/);
});

test("reveal hiding only applies when JS is running", () => {
  assert.match(css, /\.js \[data-reveal\]/);
  for (const [, selector] of css.matchAll(/([^{}]+)\{[^}]*opacity:\s*0\s*[;}]/g)) {
    if (selector.includes("data-reveal")) assert.ok(selector.includes(".js"), selector.trim());
  }
});

test("reduced motion disables animation and shows content", () => {
  const block = css.split("@media (prefers-reduced-motion: reduce)")[1] || "";
  assert.ok(block.length > 0);
  assert.match(block, /opacity:\s*1/);
  assert.match(block, /transition:\s*none/);
});

test("long console text cannot force page scroll", () => {
  assert.match(css, /\.console-body\s*{[^}]*overflow-wrap:\s*anywhere/);
});

test("container width and gutter per spec", () => {
  assert.match(css, /--container:\s*1120px/);
  assert.match(css, /--gutter:\s*16px/);
});

test("gate lines are not block-level inside <pre> (avoids doubled line breaks)", () => {
  assert.doesNotMatch(css, /\[data-gate-line\]\s*{[^}]*display:\s*block/);
});

test("scroll pipeline dims inactive steps only when JS runs", () => {
  assert.match(css, /\.js \.pipe-row:not\(\.is-active\)/);
  assert.doesNotMatch(css, /(^|[^.\w-])\.pipe-row:not\(\.is-active\)\s*{[^}]*opacity:\s*0[;\s}]/m);
});

test("marquee and console animations stop under reduced motion", () => {
  const block = css.split("@media (prefers-reduced-motion: reduce)")[1] || "";
  assert.match(block, /\.marquee-track\s*{[^}]*animation:\s*none/);
  assert.match(block, /\.caret\s*{[^}]*animation:\s*none/);
});

test("sticky mobile CTA appears only after the hero, and only on small screens", () => {
  assert.match(css, /\.past-hero \.sticky-cta/);
  assert.match(css, /@media \(min-width: 900px\)\s*{\s*\.sticky-cta\s*{\s*display:\s*none/);
});

test("six reasons use a shared-hairline lattice", () => {
  assert.match(css, /\.lattice\s*{[^}]*border-top:\s*1px solid var\(--rule\)[^}]*border-left:\s*1px solid var\(--rule\)/);
  assert.match(css, /\.lattice > \*\s*{[^}]*border-right:\s*1px solid var\(--rule\)[^}]*border-bottom:\s*1px solid var\(--rule\)/);
});

test("FAQ summaries show an open/closed indicator", () => {
  assert.match(css, /summary::after\s*{[^}]*content:/);
  assert.match(css, /details\[open\] summary::after\s*{[^}]*content:/);
});

test("tab buttons are hidden when JS is not running", () => {
  assert.match(css, /html:not\(\.js\) \[role="tablist"\]\s*{[^}]*display:\s*none/);
});

test("the hidden attribute always wins over component display rules", () => {
  assert.match(css, /\[hidden\]\s*{\s*display:\s*none\s*!important/);
});
