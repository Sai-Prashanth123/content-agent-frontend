# ThoughtPilot Content Agent Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single static landing page that sells ThoughtPilot's content-agent service and drives "Book a call".

**Architecture:** One `index.html` holds all copy and markup. `styles.css` holds design tokens and layout, and `main.js` is an ES module that adds behaviour (booking-link wiring, proof rendering, tabs, scroll reveals, gate-line typing). `config.js` is the only file a non-developer edits besides copy. The page works fully without JavaScript: CTAs point at `#book` in the HTML and reveal effects are opt-in via a `js` class. Behaviour is unit-tested in Node with jsdom; layout, contrast and performance are verified with headless Chrome and Lighthouse.

**Tech Stack:** HTML5, CSS custom properties, vanilla ES modules, Google Fonts (Fraunces, Inter, JetBrains Mono). Dev only: Node 25 `node:test`, `jsdom`, `html-validate`, `lighthouse` via npx, Chrome headless.

**Spec:** `docs/superpowers/specs/2026-10-06-content-agent-landing-page-design.md`

## Global Constraints

- One page. Brand "ThoughtPilot". Primary action "Book a call".
- No framework, no build step, no trackers. The only external requests are Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`).
- `BOOKING_URL` and `CONTACT_EMAIL` default to `"REPLACE_ME"`. While they are unset, CTAs go to `#book` and the site never links to a dead URL.
- Proof section stays `hidden` while `LOGOS` and `TESTIMONIALS` are both empty.
- Copy rules (spec §5):
  - every claim maps to a real content-agent capability;
  - no client names, logos, handles, numbers, quotes or real posts;
  - sample content is labelled "Illustrative example";
  - no performance promises; commercial terms are "agreed on the call";
  - no em dash (`—`), no "it's not X, it's Y" / "isn't about", no hype words (game-changer, unlock, supercharge, 10x).
- Tokens exactly as spec §3:
  - Light: bg `#F7F5F0`, surface `#FFFFFF`, ink `#141414`, muted `#5B5B57`, line `#E3DFD6`, accent `#1F4FFF`, pass `#1E7A46`, fail `#B42318`.
  - Dark: bg `#111214`, surface `#1A1C1F`, ink `#EDEBE6`, muted `#A3A19B`, line `#2A2C30`, accent `#6E8BFF`, pass `#4CC38A`, fail `#F97066`.
- Container max width 1,120px; 16px mobile gutter; no horizontal scroll at 360px.
- All motion disabled under `prefers-reduced-motion: reduce`.
- Lighthouse mobile ≥95 in Performance, Accessibility, Best Practices, SEO.
- Commit after every task; commit messages end with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Review Focus

1. **Unsafe or empty `BOOKING_URL`.** `""`, `"REPLACE_ME"`, `"javascript:alert(1)"`, `"  "` must all fall back to `#book`; only `https:`/`http:`/`mailto:` URLs are used. Covered in Task 4 tests.
2. **HTML in proof strings.** A testimonial quote containing `<img onerror>` must render as literal text, never as markup. Covered in Task 4 tests.
3. **JavaScript disabled or failing.** All content stays visible and CTAs still work. Reveal styles apply only under `html.js`, and the HTML ships `href="#book"`. Covered in Task 2 and Task 3 tests.
4. **Reduced motion.** Gate lines show their full text immediately, and no element stays at opacity 0. Covered in Task 4 tests.
5. **Narrow phones (360px).** Long mono gate lines must not cause page-level horizontal scroll. They wrap inside their card (`overflow-wrap:anywhere`). Covered in Task 6 layout check.

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json` | Dev-only test tooling and scripts (`test`, `validate`, `serve`) |
| `.gitignore` | Ignore `node_modules/`, `.lighthouse/`, `shots/` |
| `config.js` | Owner-editable values: `BOOKING_URL`, `CONTACT_EMAIL`, `LOGOS`, `TESTIMONIALS` |
| `index.html` | All markup and copy, SEO/OG meta, no-JS fallbacks |
| `styles.css` | Tokens (light/dark), base, layout, components, motion, reduced motion |
| `main.js` | Exported pure-ish functions plus `init()` bootstrapping in the browser |
| `assets/favicon.svg`, `assets/wordmark.svg` | Brand marks |
| `assets/og-image.png` (+ `assets/og.html` source) | 1200x630 share image rendered with headless Chrome |
| `tests/*.test.js` | Node tests (config, html, css, main) |
| `scripts/check-copy.mjs` | Copy-rule scanner used by tests and before launch |
| `README.md` | Edit copy, set booking URL, add proof, preview, deploy |

---

### Task 1: Scaffold and config

**Files:**
- Create: `package.json`, `.gitignore`, `config.js`, `tests/config.test.js`

**Interfaces:**
- Produces: `config.js` named exports `BOOKING_URL: string`, `CONTACT_EMAIL: string`, `LOGOS: Array<{name:string, src:string}>`, `TESTIMONIALS: Array<{quote:string, name:string, role:string}>`.

- [ ] **Step 1: Create `package.json` and `.gitignore`**

`package.json`:
```json
{
  "name": "content-agent-site",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "ThoughtPilot content agent landing page (static).",
  "scripts": {
    "test": "node --test tests/",
    "validate": "html-validate index.html",
    "copy": "node scripts/check-copy.mjs",
    "serve": "npx --yes http-server -p 4173 -c-1 ."
  },
  "devDependencies": {
    "html-validate": "^9.0.0",
    "jsdom": "^26.0.0"
  }
}
```

`.gitignore`:
```
node_modules/
.lighthouse/
shots/
```

Run: `npm install`
Expected: installs jsdom and html-validate without errors.

- [ ] **Step 2: Write the failing test** `tests/config.test.js`
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import * as cfg from "../config.js";

test("config exports owner-editable values with safe defaults", () => {
  assert.equal(cfg.BOOKING_URL, "REPLACE_ME");
  assert.equal(cfg.CONTACT_EMAIL, "REPLACE_ME");
  assert.deepEqual(cfg.LOGOS, []);
  assert.deepEqual(cfg.TESTIMONIALS, []);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL, cannot find module `../config.js`.

- [ ] **Step 4: Create `config.js`**
```js
// ThoughtPilot landing page settings. This is the only file you need to edit
// besides the copy in index.html.

// Paste your Calendly / Cal.com link here. While it is "REPLACE_ME", every
// "Book a call" button scrolls to the booking section instead.
export const BOOKING_URL = "REPLACE_ME";

// Shown in the footer and booking section. "REPLACE_ME" hides the address.
export const CONTACT_EMAIL = "REPLACE_ME";

// Client logos, only once the client has approved being named.
// Example: { name: "Acme", src: "assets/logos/acme.svg" }
export const LOGOS = [];

// Testimonials, only once approved. Plain text only; markup is not rendered.
// Example: { quote: "...", name: "Jane Doe", role: "CEO, Acme" }
export const TESTIMONIALS = [];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**
```bash
git add package.json package-lock.json .gitignore config.js tests/config.test.js
git commit -m "chore: scaffold landing page repo and owner config"
```

---

### Task 2: Page markup and copy (`index.html`) + copy scanner

**Files:**
- Create: `index.html`, `scripts/check-copy.mjs`, `tests/html.test.js`

**Interfaces:**
- Consumes: nothing at runtime (loads `styles.css`, `main.js` by path).
- Produces, for `main.js`:
  - `[data-cta="book"]` links, which ship with `href="#book"`;
  - `#proof[hidden]` containing `#proof-logos` and `#proof-testimonials`;
  - `[data-contact]` elements (hidden by default);
  - `[data-reveal]` elements;
  - `[data-gate-line]` spans with their full text inside;
  - `.tabs` with `[role=tablist]`, `[role=tab][aria-controls]` and `[role=tabpanel]`;
  - `.pipeline [data-step]` items;
  - `#year` span.
- Produces `scripts/check-copy.mjs` exporting `findCopyViolations(text): string[]`.

- [ ] **Step 1: Write the failing tests** `tests/html.test.js`
```js
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

test("no external scripts and only Google Fonts as external styles", () => {
  for (const s of doc.querySelectorAll("script[src]")) assert.ok(!/^https?:/.test(s.getAttribute("src")));
  for (const l of doc.querySelectorAll('link[rel="stylesheet"]')) {
    const href = l.getAttribute("href");
    assert.ok(!/^https?:/.test(href) || href.startsWith("https://fonts.googleapis.com/"), href);
  }
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
  const found = findCopyViolations(bad);
  assert.ok(found.length >= 3, found.join(","));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, `index.html` / `check-copy.mjs` missing.

- [ ] **Step 3: Create `scripts/check-copy.mjs`**
```js
// Copy-rule scanner (spec section 5). Usage: node scripts/check-copy.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const RULES = [
  [/—/, "em dash"],
  [/\bit'?s not [^.\n]{1,60}, it'?s\b/i, "it's not X, it's Y"],
  [/\bisn'?t about\b/i, "isn't about"],
  [/\b(game[- ]changer|supercharge|skyrocket|10x)\b/i, "hype word"],
  [/\bunlock(s|ing)?\b/i, "hype word: unlock"],
    // Client names: loaded from the git-ignored scripts/client-blocklist.local.txt (see final implementation); never inline them.
];

export function findCopyViolations(text) {
  return RULES.filter(([re]) => re.test(text)).map(([, label]) => label);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = ["index.html", "README.md"];
  let bad = 0;
  for (const f of files) {
    const v = findCopyViolations(readFileSync(f, "utf8"));
    if (v.length) { bad++; console.log(`FAIL ${f}: ${v.join(", ")}`); } else console.log(`PASS ${f}`);
  }
  process.exit(bad ? 1 : 0);
}
```

- [ ] **Step 4: Create `index.html`**
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ThoughtPilot Content Agent: your voice, your proof, zero AI slop</title>
  <meta name="description" content="ThoughtPilot's content agent writes LinkedIn, X and YouTube content that sounds like you, cites every number, and has to pass a panel of critics before you see it.">
  <link rel="canonical" href="https://REPLACE_ME/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="ThoughtPilot Content Agent">
  <meta property="og:description" content="Content that sounds like you, cites every number, and survives a critic panel before you see it.">
  <meta property="og:image" content="assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#F7F5F0" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#111214" media="(prefers-color-scheme: dark)">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
  <link rel="stylesheet" href="styles.css">
  <script>document.documentElement.classList.add("js");</script>
  <script type="module" src="main.js"></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <header class="site-header">
    <div class="container header-inner">
      <a class="wordmark" href="#hero" aria-label="ThoughtPilot home"><img src="assets/wordmark.svg" alt="ThoughtPilot" width="148" height="28"></a>
      <a class="btn btn-primary btn-sm" data-cta="book" href="#book">Book a call</a>
    </div>
  </header>

  <main id="main">
    <section id="hero" class="hero">
      <div class="container hero-grid">
        <div class="hero-copy" data-reveal>
          <p class="eyebrow">ThoughtPilot Content Agent</p>
          <h1>Your voice. Your proof. Zero AI slop.</h1>
          <p class="lede">Our content agent writes LinkedIn, X and YouTube content that sounds like you, cites every number, and has to get past a panel of critics before you ever see it.</p>
          <div class="hero-ctas">
            <a class="btn btn-primary" data-cta="book" href="#book">Book a call</a>
            <a class="btn btn-ghost" href="#how">See how it works</a>
          </div>
        </div>
        <figure class="gate-card" data-reveal aria-label="Example of the checks every draft passes">
          <figcaption class="gate-card-title"><span class="dot" aria-hidden="true"></span>draft_0142 · LinkedIn post</figcaption>
          <pre class="gate-lines"><span data-gate-line class="pass">PASS [voice]    voice match 100/100</span>
<span data-gate-line class="pass">PASS [source]   4 claim(s) verified</span>
<span data-gate-line class="pass">PASS [cooldown] no repeat in 45 days</span>
<span data-gate-line class="pass">PASS [critics]  voice · hook · substance</span></pre>
          <p class="illustrative">Illustrative example</p>
        </figure>
      </div>
    </section>

    <section id="problem" class="section">
      <div class="container">
        <h2 data-reveal>Posting as yourself is hard to outsource.</h2>
        <div class="cards three">
          <article class="card" data-reveal>
            <h3>Ghostwriters don't know your story.</h3>
            <p>They write what sounds good, then you spend an hour rewriting it so it sounds like you.</p>
          </article>
          <article class="card" data-reveal>
            <h3>AI posts all sound the same.</h3>
            <p>Your buyers scroll past the same hooks, the same structures and the same tired phrases every day.</p>
          </article>
          <article class="card" data-reveal>
            <h3>One invented number costs you credibility.</h3>
            <p>A made-up stat under your name is worse than not posting at all.</p>
          </article>
        </div>
      </div>
    </section>

    <section id="how" class="section section-alt">
      <div class="container">
        <h2 data-reveal>How the content agent works</h2>
        <p class="section-lede" data-reveal>Five steps, run for every client, every draft.</p>
        <svg data-diagram class="pipeline-diagram" role="img" aria-label="Pipeline: Learn, Codify, Write, Challenge, Ship and learn" viewBox="0 0 1000 120" preserveAspectRatio="xMidYMid meet">
          <line x1="100" y1="44" x2="900" y2="44" class="pipe-line"/>
          <g class="pipe-node" data-step="1"><circle cx="100" cy="44" r="22"/><text x="100" y="50">1</text><text class="pipe-label" x="100" y="100">Learn</text></g>
          <g class="pipe-node" data-step="2"><circle cx="300" cy="44" r="22"/><text x="300" y="50">2</text><text class="pipe-label" x="300" y="100">Codify</text></g>
          <g class="pipe-node" data-step="3"><circle cx="500" cy="44" r="22"/><text x="500" y="50">3</text><text class="pipe-label" x="500" y="100">Write</text></g>
          <g class="pipe-node" data-step="4"><circle cx="700" cy="44" r="22"/><text x="700" y="50">4</text><text class="pipe-label" x="700" y="100">Challenge</text></g>
          <g class="pipe-node" data-step="5"><circle cx="900" cy="44" r="22"/><text x="900" y="50">5</text><text class="pipe-label" x="900" y="100">Ship and learn</text></g>
        </svg>
        <ol class="pipeline">
          <li data-step="1" data-reveal><h3>Learn</h3><p>We collect your posts, video transcripts and website, so the agent starts from what you have actually said.</p></li>
          <li data-step="2" data-reveal><h3>Codify</h3><p>Your voice is measured into a voiceprint and written into "law" files: identity, voice, receipts, quality bar and content plan.</p></li>
          <li data-step="3" data-reveal><h3>Write</h3><p>Drafts are built only from your real stories, numbers and frameworks, in structures proven on your own account.</p></li>
          <li data-step="4" data-reveal><h3>Challenge</h3><p>Linters, then independent critics for voice, hook and substance, then an editor-in-chief. One veto sends it back.</p></li>
          <li data-step="5" data-reveal><h3>Ship and learn</h3><p>You approve every post. Your edits are recorded and tune your voice for the next draft.</p></li>
        </ol>
      </div>
    </section>

    <section id="why" class="section">
      <div class="container">
        <h2 data-reveal>Six reasons it reads like you wrote it</h2>
        <div class="cards three">
          <article class="card" data-reveal><h3>Voice cloned from your data</h3><p>Sentence rhythm, vocabulary and register are measured from your own posts. Every draft is scored against them.</p><p class="evidence">voice match scored on every draft</p></article>
          <article class="card" data-reveal><h3>No receipt, no ship</h3><p>Every number in a draft must trace to a source. If it can't be sourced, it comes out.</p><p class="evidence">source gate: claims verified or removed</p></article>
          <article class="card" data-reveal><h3>An adversarial critic panel</h3><p>Separate critics read each draft trying to break it. A single veto sends it back for a rewrite.</p><p class="evidence">voice · hook · substance · editor</p></article>
          <article class="card" data-reveal><h3>Anti-AI-slop linters</h3><p>The phrasing that makes posts read as machine-written is caught automatically, before any human reads the draft.</p><p class="evidence">banned patterns blocked in code</p></article>
          <article class="card" data-reveal><h3>Never repeats itself</h3><p>Hooks, topics and even the shape of a post go on a cooldown, so your feed stays fresh.</p><p class="evidence">45-day cooldown on hooks and structure</p></article>
          <article class="card" data-reveal><h3>Watches your peers</h3><p>The agent tracks the accounts you compete with for attention and learns which formats and topics are working now.</p><p class="evidence">peer accounts tracked daily</p></article>
        </div>
      </div>
    </section>

    <section id="outputs" class="section section-alt">
      <div class="container">
        <h2 data-reveal>What you get</h2>
        <div class="tabs" data-reveal>
          <div role="tablist" aria-label="Content formats">
            <button role="tab" id="tab-li" aria-controls="panel-li" aria-selected="true">LinkedIn</button>
            <button role="tab" id="tab-x" aria-controls="panel-x" aria-selected="false" tabindex="-1">X</button>
            <button role="tab" id="tab-yt" aria-controls="panel-yt" aria-selected="false" tabindex="-1">YouTube</button>
            <button role="tab" id="tab-vis" aria-controls="panel-vis" aria-selected="false" tabindex="-1">Visuals</button>
          </div>
          <div role="tabpanel" id="panel-li" aria-labelledby="tab-li">
            <h3>LinkedIn posts, carousels and infographic briefs</h3>
            <p>Framework posts, stories and opinion pieces in your structures, each with a visual brief when the idea deserves one.</p>
            <blockquote class="sample"><p>Founder: "We post every day and nothing happens."<br>Me: "Start from your three best client conversations:"</p></blockquote>
            <p class="illustrative">Illustrative example</p>
          </div>
          <div role="tabpanel" id="panel-x" aria-labelledby="tab-x">
            <h3>X tweets, threads and articles</h3>
            <p>Short posts, threads and long-form articles cut for how X distributes, with the hook written first and checked last.</p>
            <blockquote class="sample"><p>We stopped writing "content".<br>We started writing down what customers asked us on calls.<br>Our replies doubled the week we switched.</p></blockquote>
            <p class="illustrative">Illustrative example</p>
          </div>
          <div role="tabpanel" id="panel-yt" aria-labelledby="tab-yt">
            <h3>YouTube scripts, long-form and Shorts</h3>
            <p>Scripts built from your own transcripts: how you open, how you move between sections, how you close.</p>
            <blockquote class="sample"><p>"In this video, I'll show you the three-step system we use to plan a month of content in one afternoon."</p></blockquote>
            <p class="illustrative">Illustrative example</p>
          </div>
          <div role="tabpanel" id="panel-vis" aria-labelledby="tab-vis">
            <h3>Infographics and article covers</h3>
            <p>Visual briefs and covers that turn a framework into something people save, using only numbers that passed the source check.</p>
            <blockquote class="sample"><p>Cover concept: one hero object, a five-word title, your brand colour.</p></blockquote>
            <p class="illustrative">Illustrative example</p>
          </div>
        </div>
      </div>
    </section>

    <section id="inside" class="section">
      <div class="container inside-grid">
        <div>
          <h2 data-reveal>Inside a draft</h2>
          <p class="section-lede" data-reveal>Every draft ships with the checks it passed. You see the proof, not just the post.</p>
          <article class="post-mock" data-reveal>
            <p><mark data-callout="1">I've reviewed 40 content plans this quarter.</mark></p>
            <p>The ones that worked had one thing in common:</p>
            <p>- They started from customer questions;<br>- They repeated a few topics on purpose;<br>- <mark data-callout="2">They never shipped a number they couldn't source.</mark></p>
            <p>Which question do your customers ask most?</p>
            <p class="illustrative">Illustrative example</p>
          </article>
        </div>
        <figure class="gate-card" data-reveal aria-label="Gate report for the example draft">
          <figcaption class="gate-card-title"><span class="dot" aria-hidden="true"></span>gate report</figcaption>
          <pre class="gate-lines"><span data-gate-line class="pass">PASS [freshness] source data current</span>
<span data-gate-line class="pass">PASS [voice]     voice match 100/100</span>
<span data-gate-line class="pass">PASS [source]    4 claim(s) verified</span>
<span data-gate-line class="pass">PASS [cooldown]  no repeat in 45 days</span>
<span data-gate-line class="pass">PASS [critics]   voice · hook · substance</span></pre>
          <ol class="callouts">
            <li><span class="callout-num">1</span> The number in the hook was traced to a source before the draft reached you.</li>
            <li><span class="callout-num">2</span> The voice critic checked this line against your real posts.</li>
          </ol>
          <p class="illustrative">Illustrative example</p>
        </figure>
      </div>
    </section>

    <section id="onboarding" class="section section-alt">
      <div class="container">
        <h2 data-reveal>Your first two weeks</h2>
        <ol class="timeline">
          <li data-reveal><span class="tl-step">Kickoff call</span><p>We learn your goals, your audience and what you will never say.</p></li>
          <li data-reveal><span class="tl-step">Knowledge base</span><p>We build your voiceprint and law files from your own posts, videos and site.</p></li>
          <li data-reveal><span class="tl-step">First drafts</span><p>You review drafts that have already passed every check, and tell us what to change.</p></li>
          <li data-reveal><span class="tl-step">Weekly rhythm</span><p>A steady flow of approved posts, with your edits feeding back into the voice.</p></li>
        </ol>
      </div>
    </section>

    <section id="proof" class="section" hidden>
      <div class="container">
        <h2>Trusted by founders who post as themselves</h2>
        <ul id="proof-logos" class="logo-row"></ul>
        <div id="proof-testimonials" class="cards three"></div>
      </div>
    </section>

    <section id="faq" class="section">
      <div class="container narrow">
        <h2 data-reveal>Questions</h2>
        <details><summary>Will it sound like AI?</summary><p>Every draft is scored against a voiceprint measured from your own posts and checked by linters that block common machine-written patterns. Then separate critics review it for voice before you see it.</p></details>
        <details><summary>Who approves each post?</summary><p>You do. Nothing is published without your approval, and every edit you make is recorded so the next draft needs fewer.</p></details>
        <details><summary>Do you publish for me?</summary><p>That depends on how you like to work. Publishing, scheduling and cadence are agreed on the call.</p></details>
        <details><summary>What data do you use?</summary><p>Your public posts, your video transcripts, your website, and anything you share with us during onboarding. Every number in a draft traces back to one of those sources.</p></details>
        <details><summary>Is my data kept private?</summary><p>Your knowledge base is used only to write your content. Your material is never used to write for anyone else.</p></details>
        <details><summary>What platforms do you cover?</summary><p>LinkedIn, X and YouTube scripts, plus the visuals that go with them.</p></details>
      </div>
    </section>

    <section id="book" class="section cta-band">
      <div class="container narrow center">
        <h2 data-reveal>See your voice through the agent.</h2>
        <p class="section-lede">Book a call and we'll walk you through how it would work for your account.</p>
        <a class="btn btn-primary btn-lg" data-cta="book" href="#book">Book a call</a>
        <p class="contact" data-contact hidden>Or email <a data-contact-link href="#"></a></p>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <img src="assets/wordmark.svg" alt="ThoughtPilot" width="120" height="23">
      <p>&copy; <span id="year">2026</span> ThoughtPilot</p>
      <p data-contact hidden><a data-contact-link href="#"></a></p>
    </div>
  </footer>
</body>
</html>
```

Note on copy: the sample "Our replies doubled the week we switched" is a fictional sample in the X panel, labelled illustrative. Rule 3 (no performance promises) concerns ThoughtPilot's claims, not obviously fictional sample posts. If a reviewer prefers zero numbers in samples, change it to "Our replies changed the week we switched."

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (config 1 + html 9).

- [ ] **Step 6: Commit**
```bash
git add index.html scripts/check-copy.mjs tests/html.test.js
git commit -m "feat: landing page markup, copy and copy-rule scanner"
```

---

### Task 3: Styles (`styles.css`)

**Files:**
- Create: `styles.css`, `tests/css.test.js`

**Interfaces:**
- Consumes: class names and attributes from Task 2 (`.js`, `[data-reveal]`, `.is-visible`, `.is-lit`, `.gate-lines`, `[data-gate-line]`, `.tabs`, `[role=tab]`, `[role=tabpanel]`).
- Produces, for `main.js`: state classes `.is-visible` (reveal done), `.is-lit` (pipeline step lit), `.is-typing` (gate line typing).

- [ ] **Step 1: Write the failing test** `tests/css.test.js`
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const light = { bg: "#F7F5F0", surface: "#FFFFFF", ink: "#141414", muted: "#5B5B57", line: "#E3DFD6", accent: "#1F4FFF", pass: "#1E7A46", fail: "#B42318" };
const dark = { bg: "#111214", surface: "#1A1C1F", ink: "#EDEBE6", muted: "#A3A19B", line: "#2A2C30", accent: "#6E8BFF", pass: "#4CC38A", fail: "#F97066" };

test("all spec tokens defined for both themes", () => {
  for (const [k, v] of Object.entries(light)) assert.match(css, new RegExp(`--${k}:\\s*${v}`, "i"), `light ${k}`);
  for (const [k, v] of Object.entries(dark)) assert.match(css, new RegExp(`--${k}:\\s*${v}`, "i"), `dark ${k}`);
});

test("dark mode via media query (guarded) and data-theme", () => {
  assert.match(css, /@media \(prefers-color-scheme: dark\)\s*{\s*:root:not\(\[data-theme="light"\]\)/);
  assert.match(css, /:root\[data-theme="dark"\]/);
});

test("body has an explicit background", () => {
  assert.match(css, /body\s*{[^}]*background:\s*var\(--bg\)/);
});

test("reveal hiding only applies when JS is running", () => {
  assert.match(css, /\.js \[data-reveal\]/);
  // Every rule that hides a [data-reveal] element must be scoped under .js
  for (const [, selector] of css.matchAll(/([^{}]+)\{[^}]*opacity:\s*0\s*[;}]/g)) {
    if (selector.includes("data-reveal")) assert.ok(selector.includes(".js"), selector.trim());
  }
});

test("reduced motion disables animation and shows content", () => {
  const block = css.split("@media (prefers-reduced-motion: reduce)")[1] || "";
  assert.ok(block.length > 0, "reduced-motion block exists");
  assert.match(block, /opacity:\s*1/);
  assert.match(block, /transition:\s*none/);
});

test("long mono lines cannot force page scroll", () => {
  assert.match(css, /\.gate-lines\s*{[^}]*overflow-wrap:\s*anywhere/);
  assert.match(css, /\.gate-lines\s*{[^}]*white-space:\s*pre-wrap/);
});

test("container width and gutter per spec", () => {
  assert.match(css, /--container:\s*1120px/);
  assert.match(css, /--gutter:\s*16px/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL, `styles.css` not found.

- [ ] **Step 3: Create `styles.css`**
```css
/* ThoughtPilot content agent landing page. Editorial lab theme. */
:root {
  --bg: #F7F5F0; --surface: #FFFFFF; --ink: #141414; --muted: #5B5B57;
  --line: #E3DFD6; --accent: #1F4FFF; --pass: #1E7A46; --fail: #B42318;
  --accent-ink: #FFFFFF;
  --container: 1120px; --gutter: 16px; --radius: 14px;
  --font-display: "Fraunces", Georgia, "Times New Roman", serif;
  --font-body: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "Cascadia Mono", Consolas, monospace;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #111214; --surface: #1A1C1F; --ink: #EDEBE6; --muted: #A3A19B;
    --line: #2A2C30; --accent: #6E8BFF; --pass: #4CC38A; --fail: #F97066;
    --accent-ink: #0B0D12;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #111214; --surface: #1A1C1F; --ink: #EDEBE6; --muted: #A3A19B;
  --line: #2A2C30; --accent: #6E8BFF; --pass: #4CC38A; --fail: #F97066;
  --accent-ink: #0B0D12;
  color-scheme: dark;
}

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--ink);
  font: 400 17px/1.6 var(--font-body); overflow-x: hidden;
}
img, svg { max-width: 100%; height: auto; display: block; }
a { color: var(--accent); }
h1, h2, h3 { font-family: var(--font-display); font-weight: 600; line-height: 1.15; margin: 0 0 .5em; letter-spacing: -0.01em; }
h1 { font-size: clamp(2.5rem, 6vw + .5rem, 4rem); }
h2 { font-size: clamp(1.75rem, 3vw + .75rem, 2.6rem); }
h3 { font-size: 1.2rem; font-family: var(--font-body); font-weight: 600; letter-spacing: 0; }
p { margin: 0 0 1em; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; border-radius: 6px; }

.skip-link { position: absolute; left: -9999px; top: 8px; background: var(--surface); color: var(--ink); padding: 8px 12px; border-radius: 8px; z-index: 100; }
.skip-link:focus { left: 8px; }

.container { width: 100%; max-width: var(--container); margin: 0 auto; padding: 0 var(--gutter); }
.narrow { max-width: 760px; }
.center { text-align: center; }

/* Header */
.site-header { position: sticky; top: 0; z-index: 50; background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }
.header-inner { display: flex; align-items: center; justify-content: space-between; height: 64px; }
.wordmark img { height: 28px; width: auto; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .wordmark img, :root:not([data-theme="light"]) .site-footer img { filter: invert(1); } }
:root[data-theme="dark"] .wordmark img, :root[data-theme="dark"] .site-footer img { filter: invert(1); }

/* Buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; border: 1px solid transparent; transition: transform .15s ease, background-color .15s ease; }
.btn-primary { background: var(--accent); color: var(--accent-ink); }
.btn-primary:hover { transform: translateY(-1px); }
.btn-ghost { color: var(--ink); border-color: var(--line); background: var(--surface); }
.btn-sm { min-height: 40px; padding: 0 16px; font-size: .95rem; }
.btn-lg { min-height: 56px; padding: 0 30px; font-size: 1.05rem; }

/* Sections */
.section { padding: clamp(64px, 9vw, 112px) 0; }
.section-alt { background: var(--surface); border-block: 1px solid var(--line); }
.section-lede, .lede { color: var(--muted); font-size: 1.1rem; max-width: 62ch; }
.eyebrow { font-family: var(--font-mono); font-size: .85rem; color: var(--accent); letter-spacing: .02em; margin-bottom: 1em; }

/* Hero */
.hero { padding: clamp(48px, 8vw, 104px) 0; }
.hero-grid { display: grid; gap: 40px; align-items: center; }
.hero-ctas { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
@media (min-width: 900px) { .hero-grid { grid-template-columns: 1.15fr .85fr; } }

/* Gate card: the signature visual */
.gate-card { margin: 0; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 18px 20px; box-shadow: 0 1px 0 var(--line), 0 18px 40px -24px rgba(0,0,0,.25); }
.gate-card-title { font-family: var(--font-mono); font-size: .8rem; color: var(--muted); display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--pass); }
.gate-lines { margin: 0; font: 400 .9rem/1.8 var(--font-mono); white-space: pre-wrap; overflow-wrap: anywhere; }
[data-gate-line] { display: block; }
[data-gate-line].pass::first-letter { color: var(--pass); }
.pass { color: var(--ink); }
.gate-lines .pass { color: var(--pass); }
.illustrative { font-family: var(--font-mono); font-size: .72rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin: 12px 0 0; }

/* Cards */
.cards { display: grid; gap: 16px; margin-top: 32px; }
@media (min-width: 720px) { .cards.three { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1000px) { .cards.three { grid-template-columns: repeat(3, 1fr); } }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 24px; }
.section-alt .card { background: var(--bg); }
.card p { color: var(--muted); }
.evidence { font-family: var(--font-mono); font-size: .8rem; color: var(--pass) !important; margin: 0; }
.evidence::before { content: "PASS "; font-weight: 500; }

/* Pipeline */
.pipeline-diagram { display: none; margin: 40px 0 8px; }
.pipe-line { stroke: var(--line); stroke-width: 3; }
.pipe-node circle { fill: var(--surface); stroke: var(--line); stroke-width: 3; transition: fill .4s ease, stroke .4s ease; }
.pipe-node text { font: 600 18px var(--font-body); fill: var(--ink); text-anchor: middle; }
.pipe-node .pipe-label { font: 500 20px var(--font-body); fill: var(--muted); }
.pipe-node.is-lit circle { fill: var(--accent); stroke: var(--accent); }
.pipe-node.is-lit text:not(.pipe-label) { fill: var(--accent-ink); }
@media (min-width: 800px) { .pipeline-diagram { display: block; } }
.pipeline { list-style: none; padding: 0; margin: 24px 0 0; display: grid; gap: 16px; counter-reset: step; }
@media (min-width: 800px) { .pipeline { grid-template-columns: repeat(5, 1fr); } }
.pipeline li { counter-increment: step; background: var(--bg); border: 1px solid var(--line); border-radius: var(--radius); padding: 18px; }
.pipeline li h3::before { content: counter(step) ". "; color: var(--accent); }
.pipeline li p { color: var(--muted); font-size: .95rem; margin: 0; }

/* Tabs */
.tabs { margin-top: 28px; }
[role="tablist"] { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
[role="tab"] { font: 600 .95rem var(--font-body); color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: 999px; padding: 10px 18px; min-height: 44px; cursor: pointer; }
[role="tab"][aria-selected="true"] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
[role="tabpanel"] { background: var(--bg); border: 1px solid var(--line); border-radius: var(--radius); padding: 24px; margin-bottom: 12px; }
.js [role="tabpanel"][hidden] { display: none; }
.sample { margin: 16px 0 0; padding: 16px 18px; border-left: 3px solid var(--accent); background: var(--surface); border-radius: 0 10px 10px 0; }
.sample p { margin: 0; }

/* Inside a draft */
.inside-grid { display: grid; gap: 32px; align-items: start; }
@media (min-width: 900px) { .inside-grid { grid-template-columns: 1fr 1fr; } }
.post-mock { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 24px; margin-top: 8px; }
.post-mock mark { background: color-mix(in srgb, var(--accent) 16%, transparent); color: inherit; padding: 0 2px; border-radius: 3px; }
.callouts { list-style: none; padding: 0; margin: 16px 0 0; display: grid; gap: 10px; font-size: .95rem; color: var(--muted); }
.callout-num { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: var(--accent-ink); font: 600 .75rem var(--font-body); margin-right: 6px; }

/* Timeline */
.timeline { list-style: none; padding: 0; margin: 32px 0 0; display: grid; gap: 16px; }
@media (min-width: 800px) { .timeline { grid-template-columns: repeat(4, 1fr); } }
.timeline li { border-top: 3px solid var(--accent); padding-top: 14px; }
.tl-step { display: block; font-weight: 600; margin-bottom: 6px; }
.timeline p { color: var(--muted); margin: 0; }

/* Proof */
.logo-row { list-style: none; padding: 0; margin: 24px 0 0; display: flex; flex-wrap: wrap; gap: 28px; align-items: center; }
.logo-row img { height: 32px; width: auto; filter: grayscale(1); opacity: .8; }
.testimonial blockquote { margin: 0 0 12px; font-family: var(--font-display); font-size: 1.15rem; }
.testimonial cite { font-style: normal; color: var(--muted); font-size: .95rem; }

/* FAQ */
details { border-bottom: 1px solid var(--line); padding: 16px 0; }
summary { cursor: pointer; font-weight: 600; font-size: 1.05rem; list-style-position: outside; min-height: 44px; display: flex; align-items: center; }
details p { color: var(--muted); margin: 10px 0 0; }

/* CTA band + footer */
.cta-band { background: var(--surface); border-top: 1px solid var(--line); }
.cta-band .section-lede { margin: 0 auto 28px; }
.contact { margin-top: 18px; color: var(--muted); }
.site-footer { padding: 32px 0; border-top: 1px solid var(--line); color: var(--muted); font-size: .9rem; }
.footer-inner { display: flex; flex-wrap: wrap; gap: 16px 32px; align-items: center; justify-content: space-between; }
.footer-inner p { margin: 0; }

/* Motion: hidden state only when JS is running */
.js [data-reveal] { opacity: 0; transform: translateY(14px); transition: opacity .6s ease, transform .6s ease; }
.js [data-reveal].is-visible { opacity: 1; transform: none; }
.js [data-gate-line].is-typing { overflow: hidden; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .js [data-reveal], .js [data-reveal].is-visible { opacity: 1; transform: none; transition: none; }
  .pipe-node circle, .btn { transition: none; }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all css tests plus earlier ones).

- [ ] **Step 5: Commit**
```bash
git add styles.css tests/css.test.js
git commit -m "feat: editorial lab styles with tokens, dark mode and reduced motion"
```

---

### Task 4: Behaviour (`main.js`)

**Files:**
- Create: `main.js`, `tests/main.test.js`

**Interfaces:**
- Consumes: `config.js` exports (Task 1); DOM hooks (Task 2); state classes (Task 3).
- Produces (named exports, all take a `Document`/`Element` so they're testable):
  - `safeUrl(url: string): string | null`: returns the trimmed URL if it starts with `https:`, `http:` or `mailto:`, else `null`.
  - `wireBookingLinks(doc: Document, url: string): number`: sets `href` for every `[data-cta="book"]` and returns the count. A valid URL sets `target="_blank"` and `rel="noopener"`; otherwise `href="#book"` and the target is removed.
  - `wireContact(doc: Document, email: string): boolean`: unhides `[data-contact]` and fills `[data-contact-link]` when the email is valid (contains "@" and isn't "REPLACE_ME").
  - `renderProof(doc: Document, logos: Array<{name,src}>, testimonials: Array<{quote,name,role}>): boolean`: fills `#proof-logos` / `#proof-testimonials` using `textContent` / attributes only, and unhides `#proof` when anything rendered.
  - `initTabs(root: Element): void`: ARIA tabs (click plus Left/Right/Home/End).
  - `initMotion(doc: Document, win: Window): void`: reveals, pipeline lighting and gate typing. Under reduced motion, or without IntersectionObserver, everything is shown immediately.
  - `init(doc = document, win = window, cfg = config): void`: calls all of the above and sets `#year`.

- [ ] **Step 1: Write the failing tests** `tests/main.test.js`
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { safeUrl, wireBookingLinks, wireContact, renderProof, initTabs, initMotion, init } from "../main.js";

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, cannot find module `../main.js`.

- [ ] **Step 3: Create `main.js`**
```js
// ThoughtPilot landing page behaviour. Every function takes the document/window
// it works on so it can be tested in Node with jsdom.
import * as config from "./config.js";

const ALLOWED = /^(https?:|mailto:)/i;

export function safeUrl(url) {
  if (typeof url !== "string") return null;
  const u = url.trim();
  if (!u || u === "REPLACE_ME" || !ALLOWED.test(u)) return null;
  return u;
}

export function wireBookingLinks(doc, url) {
  const href = safeUrl(url);
  const links = doc.querySelectorAll('[data-cta="book"]');
  links.forEach((a) => {
    if (href) {
      a.setAttribute("href", href);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
    } else {
      a.setAttribute("href", "#book");
      a.removeAttribute("target");
      a.removeAttribute("rel");
    }
  });
  if (!href && typeof console !== "undefined") {
    console.warn("[ThoughtPilot] BOOKING_URL is not set in config.js; Book a call links scroll to #book.");
  }
  return links.length;
}

export function wireContact(doc, email) {
  const ok = typeof email === "string" && email.includes("@") && email.trim() !== "REPLACE_ME";
  if (!ok) return false;
  const addr = email.trim();
  doc.querySelectorAll("[data-contact-link]").forEach((a) => {
    a.setAttribute("href", `mailto:${addr}`);
    a.textContent = addr;
  });
  doc.querySelectorAll("[data-contact]").forEach((el) => { el.hidden = false; });
  return true;
}

export function renderProof(doc, logos = [], testimonials = []) {
  const section = doc.getElementById("proof");
  const logoList = doc.getElementById("proof-logos");
  const quoteList = doc.getElementById("proof-testimonials");
  if (!section || !logoList || !quoteList) return false;
  logoList.replaceChildren();
  quoteList.replaceChildren();

  for (const { name, src } of logos) {
    if (!name || !src) continue;
    const li = doc.createElement("li");
    const img = doc.createElement("img");
    img.setAttribute("src", src);
    img.setAttribute("alt", name);
    img.setAttribute("loading", "lazy");
    li.append(img);
    logoList.append(li);
  }
  for (const { quote, name, role } of testimonials) {
    if (!quote || !name) continue;
    const card = doc.createElement("figure");
    card.className = "card testimonial";
    const bq = doc.createElement("blockquote");
    bq.textContent = quote;
    const cap = doc.createElement("figcaption");
    const cite = doc.createElement("cite");
    cite.textContent = role ? `${name}, ${role}` : name;
    cap.append(cite);
    card.append(bq, cap);
    quoteList.append(card);
  }
  const shown = logoList.children.length > 0 || quoteList.children.length > 0;
  section.hidden = !shown;
  return shown;
}

export function initTabs(root) {
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const select = (i) => {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = root.ownerDocument.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(i));
    t.addEventListener("keydown", (e) => {
      const last = tabs.length - 1;
      const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select(next);
      tabs[next].focus();
    });
  });
  const start = Math.max(0, tabs.findIndex((t) => t.getAttribute("aria-selected") === "true"));
  select(start);
}

function showAll(doc) {
  doc.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-visible"));
  doc.querySelectorAll(".pipe-node").forEach((n) => n.classList.add("is-lit"));
}

function typeLines(card, win) {
  const lines = [...card.querySelectorAll("[data-gate-line]")];
  const texts = lines.map((l) => l.textContent);
  lines.forEach((l) => { l.textContent = ""; });
  let li = 0, ci = 0;
  const step = () => {
    if (li >= lines.length) return;
    lines[li].classList.add("is-typing");
    lines[li].textContent = texts[li].slice(0, ++ci);
    if (ci >= texts[li].length) { lines[li].classList.remove("is-typing"); li++; ci = 0; win.setTimeout(step, 180); }
    else win.setTimeout(step, 14);
  };
  step();
}

export function initMotion(doc, win) {
  const reduced = typeof win.matchMedia === "function" && win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || typeof win.IntersectionObserver !== "function") { showAll(doc); return; }

  const once = (els, onEnter, options) => {
    const io = new win.IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { onEnter(en.target); io.unobserve(en.target); } });
    }, options);
    els.forEach((el) => io.observe(el));
  };
  once([...doc.querySelectorAll("[data-reveal]")], (el) => el.classList.add("is-visible"), { threshold: 0.15 });
  const diagram = doc.querySelector(".pipeline-diagram");
  if (diagram) once([diagram], () => {
    doc.querySelectorAll(".pipe-node").forEach((n, i) => win.setTimeout(() => n.classList.add("is-lit"), 250 * i));
  }, { threshold: 0.4 });
  once([...doc.querySelectorAll(".gate-card")], (card) => typeLines(card, win), { threshold: 0.4 });
}

export function init(doc = document, win = window, cfg = config) {
  wireBookingLinks(doc, cfg.BOOKING_URL);
  wireContact(doc, cfg.CONTACT_EMAIL);
  renderProof(doc, cfg.LOGOS, cfg.TESTIMONIALS);
  initTabs(doc.querySelector(".tabs"));
  initMotion(doc, win);
  const year = doc.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
}

if (typeof window !== "undefined" && typeof document !== "undefined" && !globalThis.__TP_NO_AUTOINIT__) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init());
  else init();
}
```

Note for the test environment: Node has no global `window`, so the auto-init block never runs under `node --test`. Tests call each export explicitly.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all suites).

- [ ] **Step 5: Commit**
```bash
git add main.js tests/main.test.js
git commit -m "feat: booking wiring, proof rendering, tabs and motion with tests"
```

---

### Task 5: Brand assets (favicon, wordmark, OG image)

**Files:**
- Create: `assets/favicon.svg`, `assets/wordmark.svg`, `assets/og.html`, `assets/og-image.png`, `tests/assets.test.js`

**Interfaces:**
- Consumes: paths referenced by `index.html` (Task 2).
- Produces: the three referenced files; `og-image.png` is exactly 1200x630.

- [ ] **Step 1: Write the failing test** `tests/assets.test.js`
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

test("referenced assets exist", () => {
  for (const f of ["assets/favicon.svg", "assets/wordmark.svg", "assets/og-image.png"]) {
    assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), f);
  }
});

test("og image is 1200x630 PNG", () => {
  const buf = readFileSync(new URL("../assets/og-image.png", import.meta.url));
  assert.equal(buf.toString("ascii", 1, 4), "PNG");
  assert.equal(buf.readUInt32BE(16), 1200);
  assert.equal(buf.readUInt32BE(20), 630);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL, assets missing.

- [ ] **Step 3: Create SVGs**

`assets/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1F4FFF"/><path d="M18 20h28v7H35.5v19h-7V27H18z" fill="#fff"/></svg>
```

`assets/wordmark.svg` (ink colour; CSS inverts it in dark mode):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 296 56" width="148" height="28"><rect x="0" y="6" width="44" height="44" rx="10" fill="#1F4FFF"/><path d="M11 17h22v5.5h-8.2V39h-5.6V22.5H11z" fill="#fff"/><text x="56" y="39" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-weight="600" fill="#141414">ThoughtPilot</text></svg>
```

- [ ] **Step 4: Create `assets/og.html` and render the PNG with headless Chrome**

`assets/og.html`:
```html
<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:1200px;height:630px;background:#F7F5F0;font-family:Georgia,serif;color:#141414}
.wrap{padding:80px 88px;box-sizing:border-box;height:100%;display:flex;flex-direction:column;justify-content:space-between}
.eyebrow{font:500 26px Consolas,monospace;color:#1F4FFF}
h1{font-size:76px;line-height:1.08;margin:0;font-weight:600}
.gate{font:400 26px Consolas,monospace;color:#1E7A46;background:#fff;border:1px solid #E3DFD6;border-radius:16px;padding:18px 24px;display:inline-block}
</style></head><body><div class="wrap">
<div class="eyebrow">ThoughtPilot Content Agent</div>
<h1>Your voice. Your proof.<br>Zero AI slop.</h1>
<div class="gate">PASS [voice] · PASS [source] · PASS [critics]</div>
</div></body></html>
```

Run:
```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=1200,630 --screenshot="$(pwd -W)/assets/og-image.png" "file:///$(pwd -W)/assets/og.html"
```
Expected: `assets/og-image.png` written.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS. If the PNG width or height differs, re-run with `--force-device-scale-factor=1`.

- [ ] **Step 6: Commit**
```bash
git add assets tests/assets.test.js
git commit -m "feat: favicon, wordmark and 1200x630 share image"
```

---

### Task 6: README, validation and end-to-end verification

**Files:**
- Create: `README.md`
- Uses: `npm run validate`, `npm run copy`, headless Chrome, `npx lighthouse`

**Interfaces:**
- Consumes: the whole site.
- Produces: a verified, documented site and recorded Lighthouse scores.

- [ ] **Step 1: Create `README.md`**
````markdown
# ThoughtPilot Content Agent: landing page

One static page. No framework, no build step.

## Edit
- **Copy:** `index.html`. Keep the house rules: no em dashes, no "it's not X, it's Y", no client names or numbers, sample posts labelled "Illustrative example". Check with `npm run copy`.
- **Booking link:** set `BOOKING_URL` in `config.js` (must start with `https://`). Until then, every "Book a call" button scrolls to the booking section.
- **Contact email:** set `CONTACT_EMAIL` in `config.js`.
- **Logos / testimonials:** add entries to `LOGOS` / `TESTIMONIALS` in `config.js` only after the client approves. The section stays hidden while both lists are empty.

## Preview locally
```bash
npm install
npm run serve        # http://localhost:4173
```
(Opening `index.html` directly from disk will not run `main.js`, because browsers block ES modules on `file://`.)

## Test
```bash
npm test             # unit + structure + copy rules
npm run validate     # HTML validation
npm run copy         # copy-rule scan
```

## Deploy (Vercel)
Import the repo in Vercel, framework preset "Other", no build command, output directory `.`. Add the custom domain in Vercel when ready.
````

- [ ] **Step 2: Validate HTML and copy**

Run: `npm run validate && npm run copy`
Expected: html-validate (the local stand-in for the W3C validator in spec §7) reports no errors; `PASS index.html`, `PASS README.md`.
If html-validate flags a rule, fix the markup rather than disabling the rule. The exception is `no-inline-style`/`prefer-native-element` noise on SVG, which may be configured off in `.htmlvalidate.json` with a comment explaining why.

- [ ] **Step 3: Serve and take layout screenshots**

Run the server in the background: `npm run serve`. Then:
```bash
mkdir -p shots
C="/c/Program Files/Google/Chrome/Application/chrome.exe"
"$C" --headless=new --hide-scrollbars --window-size=375,5200 --screenshot="$(pwd -W)/shots/mobile-light.png" http://localhost:4173/
"$C" --headless=new --hide-scrollbars --window-size=1440,4200 --screenshot="$(pwd -W)/shots/desktop-light.png" http://localhost:4173/
"$C" --headless=new --hide-scrollbars --blink-settings=preferredColorScheme=0 --window-size=1440,4200 --screenshot="$(pwd -W)/shots/desktop-dark.png" http://localhost:4173/
```
Expected: open each PNG with the Read tool and confirm:
- no overflowing elements;
- the hero gate card is readable;
- the pipeline is visible on desktop and the list is shown on mobile;
- the dark theme uses the dark tokens.

- [ ] **Step 4: Horizontal-scroll check at 360px**

Run:
```bash
mkdir -p .lighthouse
npx --yes lighthouse http://localhost:4173/ --quiet --chrome-flags="--headless=new" --screenEmulation.mobile --screenEmulation.width=360 --screenEmulation.height=800 --screenEmulation.deviceScaleFactor=2 --only-audits=content-width --output=json --output-path=.lighthouse/width.json
node -e "const r=require('./.lighthouse/width.json');console.log('content-width',r.audits['content-width'].score)"
```
Expected: `content-width 1` (no element wider than the 360px viewport).

- [ ] **Step 5: Lighthouse (mobile)**

Run:
```bash
npx --yes lighthouse http://localhost:4173/ --quiet --chrome-flags="--headless=new" --output=json --output-path=.lighthouse/mobile.json && node -e "const c=require('./.lighthouse/mobile.json').categories;for(const k in c)console.log(k,Math.round(c[k].score*100))"
```
Expected: performance, accessibility, best-practices and seo all ≥95. If one is lower, fix what the audit names (contrast, tap targets, meta) and re-run.

- [ ] **Step 6: No-JS check**

Run:
```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --blink-settings=scriptEnabled=false --hide-scrollbars --window-size=375,5200 --screenshot="$(pwd -W)/shots/mobile-nojs.png" http://localhost:4173/
```
Expected: the screenshot shows all sections with full opacity (the reveal styles never applied), and the tab panels are all visible stacked.

- [ ] **Step 7: Full test run and commit**

Run: `npm test`
Expected: all PASS.
```bash
git add README.md
[ -f .htmlvalidate.json ] && git add .htmlvalidate.json
git commit -m "docs: README; verified validation, layout, lighthouse and no-JS fallback"
```
Record the four Lighthouse scores in the commit message body.

---

### Task 7: Private preview and handoff

**Files:** none new.

- [ ] **Step 1: Publish a private Artifact preview**

Use the Artifact tool:
- `file_path`: `index.html`
- `files`: `styles.css`, `main.js`, `config.js`, `assets/favicon.svg`, `assets/wordmark.svg`, `assets/og-image.png`
- `icon`: `rocket`
- `description`: "Landing page for ThoughtPilot's content agent (preview, booking link not yet set)."

Expected: a private claude.ai link. Open it, then confirm the tabs work and the "Book a call" buttons scroll to #book.

- [ ] **Step 2: Hand off**

Report to the owner:
- the preview link;
- the test, validation and Lighthouse results;
- the values still needed before going public: `BOOKING_URL`, `CONTACT_EMAIL`, the domain, and approved proof.

Creating the public frontend repo on GitHub and deploying to Vercel happen only after the owner approves the preview (spec §6).
