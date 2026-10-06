// Scroll-driven "How it works": a sticky visual panel whose active stage follows
// the reader's scroll progress through the section. No scroll-jacking: the page
// scrolls normally, we only read the position.

export function stageIndexFor(progress, n) {
  if (!(progress > 0)) return 0;
  return Math.min(n - 1, Math.floor(progress * n));
}

export function setStage(root, i) {
  root.querySelectorAll("[data-pipe-step]").forEach((el, j) => {
    el.classList.toggle("is-active", j === i);
    el.classList.toggle("is-done", j < i);
  });
  root.querySelectorAll("[data-pipe-visual]").forEach((el, j) => el.classList.toggle("is-active", j === i));
  root.style.setProperty("--pipe-progress", String((i + 1) / root.querySelectorAll("[data-pipe-step]").length));
}

export function initScrollPipeline(root, win) {
  if (!root) return;
  const steps = root.querySelectorAll("[data-pipe-step]");
  if (!steps.length) return;
  // Stage changes follow scroll under reduced motion too; only transitions are off (CSS).
  setStage(root, 0);
  let queued = false;
  const update = () => {
    queued = false;
    const r = root.getBoundingClientRect();
    const span = Math.max(1, r.height - win.innerHeight * 0.6);
    const progress = (win.innerHeight * 0.4 - r.top) / span;
    setStage(root, stageIndexFor(progress, steps.length));
  };
  win.addEventListener("scroll", () => { if (!queued) { queued = true; win.requestAnimationFrame(update); } }, { passive: true });
  update();
}
