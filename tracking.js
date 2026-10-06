// Ad pixels behind a consent banner. Nothing loads until the visitor accepts,
// and a pixel only loads when its ID is set in config.js.

const KEY = "tp-consent";

function store(win) {
  return {
    get() { try { return win.localStorage.getItem(KEY); } catch { return null; } },
    set(v) { try { win.localStorage.setItem(KEY, v); } catch { /* storage blocked: choice lasts this visit */ } },
  };
}

function addScript(doc, src) {
  const s = doc.createElement("script");
  s.async = true;
  s.src = src;
  doc.head.append(s);
}

export function createTracker(doc, win, cfg) {
  const ids = cfg.PIXELS || {};
  const required = cfg.CONSENT_REQUIRED !== false;
  const st = store(win);
  let memo = st.get();
  let loaded = false;
  const anyId = ["meta", "linkedin", "google", "x"].some((k) => ids[k]);

  const hasConsent = () => !required || memo === "granted";

  function load() {
    if (loaded || !hasConsent()) return;
    loaded = true;
    if (ids.meta) {
      if (!win.fbq) {
        const f = (win.fbq = function () { f.callMethod ? f.callMethod(...arguments) : f.queue.push(arguments); });
        f.push = f; f.loaded = true; f.version = "2.0"; f.queue = [];
      }
      addScript(doc, "https://connect.facebook.net/en_US/fbevents.js");
      win.fbq("init", ids.meta);
      win.fbq("track", "PageView");
    }
    if (ids.linkedin) {
      win._linkedin_partner_id = ids.linkedin;
      win._linkedin_data_partner_ids = win._linkedin_data_partner_ids || [];
      win._linkedin_data_partner_ids.push(ids.linkedin);
      if (!win.lintrk) { const l = (win.lintrk = function (a, b) { l._q.push([a, b]); }); l._q = []; }
      addScript(doc, "https://snap.licdn.com/li.lms-analytics/insight.min.js");
    }
    if (ids.google) {
      win.dataLayer = win.dataLayer || [];
      if (!win.gtag) win.gtag = function () { win.dataLayer.push(arguments); };
      addScript(doc, `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids.google)}`);
      win.gtag("js", new Date());
      win.gtag("config", ids.google);
    }
    if (ids.x) {
      if (!win.twq) { const t = (win.twq = function () { t.exe ? t.exe(...arguments) : t.queue.push(arguments); }); t.version = "1.1"; t.queue = []; }
      addScript(doc, "https://static.ads-twitter.com/uwt.js");
      win.twq("config", ids.x);
    }
  }

  function track(name) {
    if (!hasConsent() || !loaded) return;
    const schedule = name === "schedule";
    if (ids.meta && win.fbq) {
      if (schedule) { win.fbq("track", "Schedule"); win.fbq("track", "Lead"); } else win.fbq("trackCustom", name);
    }
    if (ids.google && win.gtag) {
      if (schedule && ids.googleAdsSendTo) win.gtag("event", "conversion", { send_to: ids.googleAdsSendTo });
      win.gtag("event", schedule ? "generate_lead" : name);
    }
    if (schedule && ids.linkedin && ids.linkedinConversionId && win.lintrk) win.lintrk("track", { conversion_id: Number(ids.linkedinConversionId) });
    if (schedule && ids.x && ids.xEventId && win.twq) win.twq("event", ids.xEventId, {});
  }

  const tracker = {
    hasConsent,
    decided: () => memo === "granted" || memo === "denied",
    needsBanner: () => required && anyId && !(memo === "granted" || memo === "denied"),
    accept() { memo = "granted"; st.set("granted"); load(); },
    decline() { memo = "denied"; st.set("denied"); },
    track,
  };
  if (anyId) load(); // loads only if consent was already granted (or not required)
  return tracker;
}

export function initConsentBanner(doc, tracker) {
  const banner = doc.getElementById("consent");
  if (!banner) return;
  if (!tracker.needsBanner()) { banner.hidden = true; return; }
  banner.hidden = false;
  banner.querySelector("[data-consent-accept]")?.addEventListener("click", () => { tracker.accept(); banner.hidden = true; });
  banner.querySelector("[data-consent-decline]")?.addEventListener("click", () => { tracker.decline(); banner.hidden = true; });
}
