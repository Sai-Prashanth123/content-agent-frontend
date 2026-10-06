// Hero "agent at work" console. A pure state machine (testable) plus a small
// DOM renderer. Under reduced motion the finished frame is shown, no loop.

export const STAGES = ["idea", "pipeline", "critics", "post", "score", "done"];

export const IDEA = "Founders post tactics. Buyers remember the story behind them.";
const PIPELINE_STEPS = 5;
const CHECKS = 4;
const POST_LINES = 6;
const HOLD_TICKS = 24;

export function initialState() {
  return { stage: "idea", hold: 0, ideaChars: 0, pipelineLit: 0, checksPassed: 0, checksTotal: CHECKS, postLines: 0, postTotal: POST_LINES, score: 0 };
}

export function finalState() {
  return { stage: "done", hold: 0, ideaChars: IDEA.length, pipelineLit: PIPELINE_STEPS, checksPassed: CHECKS, checksTotal: CHECKS, postLines: POST_LINES, postTotal: POST_LINES, score: 100 };
}

export function step(s) {
  const n = { ...s };
  switch (s.stage) {
    case "idea":
      n.ideaChars = s.ideaChars + 1;
      if (n.ideaChars >= IDEA.length) n.stage = "pipeline";
      break;
    case "pipeline":
      n.pipelineLit = s.pipelineLit + 1;
      if (n.pipelineLit >= PIPELINE_STEPS) n.stage = "critics";
      break;
    case "critics":
      n.checksPassed = s.checksPassed + 1;
      if (n.checksPassed >= CHECKS) n.stage = "post";
      break;
    case "post":
      n.postLines = s.postLines + 1;
      if (n.postLines >= POST_LINES) n.stage = "score";
      break;
    case "score":
      n.score = Math.min(100, s.score + 10);
      if (n.score >= 100) n.stage = "done";
      break;
    default:
      n.hold = s.hold + 1;
      if (n.hold >= HOLD_TICKS) return initialState();
  }
  return n;
}

// Milliseconds to wait after a state, so typing is quick and stages breathe.
export function delayFor(s) {
  return { idea: 38, pipeline: 320, critics: 420, post: 260, score: 60, done: 140 }[s.stage] || 200;
}

export function render(root, s) {
  const q = (sel) => root.querySelectorAll(sel);
  const idea = root.querySelector("[data-cd-idea]");
  if (idea) idea.textContent = IDEA.slice(0, s.ideaChars);
  root.dataset.stage = s.stage;
  q("[data-cd-step]").forEach((el, i) => el.classList.toggle("is-lit", i < s.pipelineLit));
  q("[data-cd-check]").forEach((el, i) => {
    const pass = i < s.checksPassed;
    el.classList.toggle("is-pass", pass);
    const state = el.querySelector("[data-cd-state]");
    if (state) state.textContent = pass ? "PASS" : "....";
  });
  q("[data-cd-line]").forEach((el, i) => el.classList.toggle("is-shown", i < s.postLines));
  const bar = root.querySelector("[data-cd-score]");
  if (bar) bar.style.setProperty("--score", `${s.score}%`);
  const num = root.querySelector("[data-cd-score-num]");
  if (num) num.textContent = String(s.score);
}

export function initConsoleDemo(root, win) {
  if (!root) return;
  const reduced = typeof win.matchMedia === "function" && win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) { render(root, finalState()); return; }
  let s = initialState();
  let timer = null;
  let running = false;
  const tick = () => {
    render(root, s);
    const wait = delayFor(s);
    s = step(s);
    timer = win.setTimeout(tick, wait);
  };
  const start = () => { if (!running) { running = true; tick(); } };
  const stop = () => { running = false; win.clearTimeout(timer); };
  if (typeof win.IntersectionObserver === "function") {
    new win.IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())), { threshold: 0.2 }).observe(root);
  } else {
    start();
  }
}
