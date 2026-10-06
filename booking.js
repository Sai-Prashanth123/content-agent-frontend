// In-page booking: "Book" buttons open a modal with the Calendly / Cal.com
// scheduler in an iframe, created on first open (nothing loads before that).
// UTM params from the ad click are forwarded, and a completed booking fires a
// conversion through the tracker.

const PROVIDERS = [/(^|\.)calendly\.com$/i, /(^|\.)cal\.com$/i];

function parse(url) {
  if (typeof url !== "string") return null;
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:") return null;
    if (!PROVIDERS.some((re) => re.test(u.hostname))) return null;
    return u;
  } catch {
    return null;
  }
}

export function bookingOrigin(url) {
  const u = parse(url);
  return u ? u.origin : null;
}

export function buildBookingUrl(base, search, embedDomain) {
  const u = parse(base);
  if (!u) return null;
  const params = new URLSearchParams(search || "");
  for (const [k, v] of params) if (k.toLowerCase().startsWith("utm_")) u.searchParams.set(k, v);
  if (/calendly\.com$/i.test(u.hostname)) {
    u.searchParams.set("embed_domain", embedDomain || "");
    u.searchParams.set("embed_type", "Inline");
    u.searchParams.set("hide_gdpr_banner", "1");
  } else {
    u.searchParams.set("embed", "true");
  }
  return u.toString();
}

export function isScheduledEvent(evt, origin) {
  if (!evt || !origin || evt.origin !== origin) return false;
  const d = evt.data;
  if (!d || typeof d !== "object") return false;
  if (d.event === "calendly.event_scheduled") return true;
  return d.originator === "CAL" && d.type === "bookingSuccessful";
}

export function initBooking(doc, win, cfg, track = () => {}) {
  const src = buildBookingUrl(cfg.BOOKING_URL, win.location.search, win.location.hostname);
  const modal = doc.getElementById("booking-modal");
  if (!src || !modal) return false; // links keep their #book fallback
  const origin = bookingOrigin(cfg.BOOKING_URL);
  const frameHost = modal.querySelector("[data-booking-frame]");
  const done = modal.querySelector("[data-booking-done]");
  let tracked = false;

  const open = (e) => {
    if (e) e.preventDefault();
    if (frameHost && !frameHost.querySelector("iframe")) {
      const f = doc.createElement("iframe");
      f.src = src;
      f.title = "Book your free voice audit";
      f.loading = "eager";
      frameHost.append(f);
    }
    if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
    track("open_booking");
  };
  const close = () => { if (typeof modal.close === "function") modal.close(); else modal.removeAttribute("open"); };

  doc.querySelectorAll('[data-cta="book"]').forEach((a) => a.addEventListener("click", open));
  modal.querySelectorAll("[data-booking-close]").forEach((b) => b.addEventListener("click", close));
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  win.addEventListener("message", (evt) => {
    if (!tracked && isScheduledEvent(evt, origin)) {
      tracked = true;
      track("schedule");
      if (done) done.hidden = false;
    }
  });
  return true;
}
