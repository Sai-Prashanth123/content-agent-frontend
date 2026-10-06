// ThoughtPilot landing page behaviour. Every function takes the document/window
// it works on so it can be tested in Node with jsdom.
import * as config from "./config.js";
import { initCounters } from "./counters.js";
import { initScrollPipeline } from "./scroll-pipeline.js";
import { initBooking } from "./booking.js";
import { createTracker, initConsentBanner } from "./tracking.js";

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

  for (const item of logos) {
    if (!item || typeof item !== "object") continue;
    const { name, src } = item;
    if (!name || !src) continue;
    const li = doc.createElement("li");
    const img = doc.createElement("img");
    img.setAttribute("src", src);
    img.setAttribute("alt", name);
    img.setAttribute("loading", "lazy");
    li.append(img);
    logoList.append(li);
  }
  for (const item of testimonials) {
    if (!item || typeof item !== "object") continue;
    const { quote, name, role } = item;
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
  // Lock the readout's height before emptying it, so typing never shifts the page.
  const pre = card.querySelector(".gate-lines");
  if (pre) pre.style.minHeight = `${pre.offsetHeight}px`;
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

export function renderResults(doc, results = []) {
  const section = doc.getElementById("results");
  const list = doc.getElementById("results-list");
  if (!section || !list) return false;
  list.replaceChildren();
  for (const item of results) {
    if (!item || typeof item !== "object" || !item.who || !item.after) continue;
    const card = doc.createElement("article");
    card.className = "result-card";
    const who = doc.createElement("p");
    who.className = "label";
    who.textContent = item.who;
    const nums = doc.createElement("p");
    nums.className = "result-nums";
    if (item.before) {
      const b = doc.createElement("span");
      b.className = "result-before";
      b.textContent = item.before;
      nums.append(b, doc.createTextNode(" → "));
    }
    const a = doc.createElement("b");
    a.textContent = item.after;
    nums.append(a);
    const metric = doc.createElement("p");
    metric.textContent = [item.metric, item.window].filter(Boolean).join(" · ");
    card.append(who, nums, metric);
    list.append(card);
  }
  section.hidden = list.children.length === 0;
  return !section.hidden;
}

function initStickyCta(doc, win) {
  const hero = doc.getElementById("hero");
  if (!hero || typeof win.IntersectionObserver !== "function") return;
  new win.IntersectionObserver(([e]) => doc.body.classList.toggle("past-hero", !e.isIntersecting), { threshold: 0 }).observe(hero);
}

export function init(doc = document, win = window, cfg = config) {
  // Each step is isolated: a bad config entry must never stop the page
  // from revealing its content (the inline failsafe in index.html relies on
  // __tpReady being set).
  doc.documentElement.classList.add("js");
  const steps = [
    () => initMotion(doc, win),
    () => wireBookingLinks(doc, cfg.BOOKING_URL),
    () => {
      const tracker = createTracker(doc, win, cfg);
      initConsentBanner(doc, tracker);
      initBooking(doc, win, cfg, tracker.track);
    },
    () => wireContact(doc, cfg.CONTACT_EMAIL),
    () => renderProof(doc, cfg.LOGOS, cfg.TESTIMONIALS),
    () => renderResults(doc, cfg.RESULTS),
    () => initTabs(doc.querySelector(".tabs")),
    () => initCounters(doc, win),
    () => initScrollPipeline(doc.querySelector("[data-scroll-pipeline]"), win),
    () => initStickyCta(doc, win),
    () => {
      const year = doc.getElementById("year");
      if (year) year.textContent = String(new Date().getFullYear());
    },
  ];
  for (const step of steps) {
    try { step(); } catch (err) { if (typeof console !== "undefined") console.error("[ThoughtPilot]", err); }
  }
  win.__tpReady = true;
}

if (typeof window !== "undefined" && typeof document !== "undefined" && !globalThis.__TP_NO_AUTOINIT__) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init());
  else init();
}
