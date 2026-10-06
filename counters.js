// Count-up numbers. The HTML already contains the final value (correct without
// JavaScript); this only animates from zero the first time it scrolls into view.

export function formatCount(n, decimals = 0, suffix = "") {
  const s = Number(n).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${s}${suffix}`;
}

export function initCounters(doc, win) {
  const els = [...doc.querySelectorAll("[data-count-to]")];
  if (!els.length) return;
  const reduced = typeof win.matchMedia === "function" && win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || typeof win.IntersectionObserver !== "function") return; // final values already in the HTML
  const run = (el) => {
    const to = Number(el.dataset.countTo);
    const dec = Number(el.dataset.decimals || 0);
    const suffix = el.dataset.suffix || "";
    const start = win.performance.now();
    const dur = 1100;
    const frame = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatCount(to * eased, dec, suffix);
      if (p < 1) win.requestAnimationFrame(frame);
    };
    win.requestAnimationFrame(frame);
  };
  const io = new win.IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
}
