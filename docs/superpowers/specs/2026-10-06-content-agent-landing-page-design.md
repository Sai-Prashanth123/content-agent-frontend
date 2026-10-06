# ThoughtPilot Content Agent: Landing Page Design

- **Date:** 2026-10-06
- **Status:** approved in conversation, awaiting written-spec review
- **Repo:** `content-agent-site` (new, separate from the private content-agent repo)

> **Design system v2 (2026-10-06, owner-approved).** §3 is superseded by the Thought Pilot Console design system:
> - **Theme:** white only, no dark mode.
> - **Ground and panels:** toned `--canvas` #e6e4ee with three radial washes; frosted glass panels (`--paper`, `blur(20px) saturate(150%)`, hairline plus rim).
> - **Type:** monospace throughout (system mono stack, no web fonts).
> - **Colour:** shades only. `--brand` #b9a8ff is a fill and `--brand-deep` #5b3fd6 is used for small type and marks. Red and amber are reserved for failure and warning.
> - **Shape:** radius 0 everywhere.
> - **Signature elements:** the segmented meter for the pipeline and the shared-hairline lattice for the six reasons.
> - **External requests:** the "Google Fonts only" rule in §4 is replaced by no external requests at all.

> **v3: paid-ad conversion page (2026-10-06, owner-approved).** The page was rebuilt for paid traffic from LinkedIn, Meta, Google Search and X.
> - **Offer:** a free voice audit (3 drafts in your voice in 20 minutes).
> - **Hero:** a live "agent at work" console.
> - **New sections:** counters and a format marquee, a side-by-side generic-AI vs agent comparison, a scroll-driven five-step pipeline, results (hidden until approved), format mockups, the audit offer, and an expanded FAQ.
> - **Conversion plumbing:** an in-page Calendly/Cal.com booking modal with UTM passthrough and a booking conversion; Meta, LinkedIn, Google and X pixels behind a consent banner; a privacy page; a sticky mobile CTA.
> - **Unchanged:** the Console design system and house copy rules.
> - **Deviation from plan:** the drag slider was replaced by side-by-side drafts with marked differences, because clipped text read badly.


**Outcome.** A single public landing page that sells ThoughtPilot's done-for-you content service by showing what the content agent does and why it beats a human ghostwriter working with a ChatGPT tab.

**Audience.** B2B founders and executives who want to post on LinkedIn, X and YouTube without sounding like AI and without spending their own time writing.

**Primary action.** Book a call.

**Success criteria.**
- A visitor understands within ~30 seconds why the system is different: voice cloned from their own data, every number sourced, drafts must survive a critic panel.
- Every "Book a call" button works from one configurable URL.
- The page makes no claim the content-agent repo does not support, names no client, and quotes no client number.

**Decisions taken in conversation**
| Topic | Decision |
|---|---|
| Purpose | Sell the service (not internal, not SaaS) |
| Brand | ThoughtPilot |
| Focus | The content agent only (studio-wide services are out of scope) |
| Pages | One page |
| CTA | Book a call; booking URL is a placeholder until supplied |
| Build | Static HTML + CSS + small vanilla JS, no framework, no build step |
| Location | New separate repo, never inside the client-data repo |
| Visual direction | "Editorial lab" |
| Proof | No client names, logos, numbers or real posts until approved; empty proof slots stay hidden |

## 2. Page structure

Sections in order. Every section has an `id` for anchor links. Copy below is draft direction, not final wording; final copy must satisfy §5.

1. **Header (sticky).** "ThoughtPilot" wordmark on the left, "Book a call" button on the right. It stays visible on mobile.
2. **Hero.**
   - H1 (draft): "Your voice. Your proof. Zero AI slop."
   - Subhead (draft): "ThoughtPilot's content agent writes LinkedIn, X and YouTube content that sounds like you, cites every number, and has to get past a panel of critics before you ever see it."
   - Primary CTA "Book a call". Secondary "See how it works" scrolls to §2.4.
   - Right side on desktop (stacked below on mobile): a small mono "gate printout" card as the signature visual (see §3).
3. **The problem.** Three short cards:
   - "Ghostwriters don't know your story."
   - "AI posts all sound the same."
   - "One invented number costs you credibility."
4. **How it works.** A five-step pipeline as inline SVG with labels:
   1. **Learn:** your posts, videos and website are collected.
   2. **Codify:** a measured voiceprint plus "law" files (identity, voice, receipts, quality bar, content plan).
   3. **Write:** drafts are built only from your real receipts and frameworks.
   4. **Challenge:** linters plus independent critics (Voice, Hook, Substance) and an Editor-in-Chief.
   5. **Ship and learn:** you approve; your edits are recorded and retrain the voice.

   The steps light up in sequence as the section scrolls into view.
5. **Six differentiators.** A 3x2 grid on desktop, one column on mobile. Each card has a title, two lines of text and a small mono "evidence" line.
   1. **Voice cloned from your data.** Evidence: sentence rhythm, vocabulary and register measured from your own posts.
   2. **No receipt, no ship.** Evidence: every number in a draft must trace to a source, or it is removed.
   3. **Adversarial critic panel.** Evidence: separate critics try to break each draft; one veto sends it back.
   4. **Anti-AI-slop linters.** Evidence: banned constructions such as em dashes and "it's not X, it's Y" are caught automatically.
   5. **Never repeats itself.** Evidence: a 45-day cooldown on hooks, topics and post structure.
   6. **Watches your peers.** Evidence: tracks the accounts you compete with for formats and topics that are working.
6. **What you get.** Four tabs on desktop, an accordion on mobile:
   - LinkedIn: posts, carousels, infographic briefs.
   - X: tweets, threads, articles.
   - YouTube: long-form and Shorts scripts.
   - Visuals: infographics and article covers.

   Each tab has a short description and one sample snippet labelled "Illustrative example".
7. **Inside a draft.** An annotated mock of one illustrative LinkedIn post beside its gate report in mono, with lines that type in on scroll:
   ```
   PASS [freshness]   source data current
   PASS [voice]       voice match 100/100
   PASS [source]      4 claim(s) verified
   PASS [cooldown]    no repeat in 45 days
   PASS [critics]     voice · hook · substance
   ```
   Callouts point from post lines to the gate that checked them. The post is fictional, generic B2B copy, and is labelled illustrative.
8. **Your first two weeks.** A four-step timeline: kickoff call → knowledge base built from your content → first drafts for review → weekly rhythm. No promised post counts or result numbers.
9. **Proof (hidden by default).** A logo row and testimonial cards rendered from `config.js` arrays. Nothing renders when the arrays are empty, so the page shows no placeholder text in public.
10. **FAQ.** Accessible disclosure widgets:
    - Will it sound like AI?
    - Who approves each post?
    - Do you publish for me?
    - What data do you use?
    - Is my data kept private?
    - What platforms do you cover?

    Answers describe the real process and promise nothing the service does not do. Anything that depends on a commercial term, such as cadence or pricing, says "agreed on the call".
11. **Final CTA band.** One line plus "Book a call".
12. **Footer.** Wordmark, year, contact email placeholder from `config.js`.

## 3. Visual design ("Editorial lab")

**Tokens** (CSS custom properties on `:root`, redefined for dark mode):

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#F7F5F0` (paper) | `#111214` |
| `--surface` | `#FFFFFF` | `#1A1C1F` |
| `--ink` | `#141414` | `#EDEBE6` |
| `--muted` | `#5B5B57` | `#A3A19B` |
| `--line` | `#E3DFD6` | `#2A2C30` |
| `--accent` | `#1F4FFF` (signal blue) | `#6E8BFF` |
| `--pass` | `#1E7A46` | `#4CC38A` |
| `--fail` | `#B42318` | `#F97066` |

**Dark mode.**
- Follows `prefers-color-scheme` unless `:root[data-theme]` is set.
- `body` always has an explicit background.

**Type.**
- **Display:** Fraunces (serif) for H1/H2, giving the page its sense of authorship.
- **Body:** Inter.
- **Mono:** JetBrains Mono, used for gate printouts and evidence lines.
- All three load from Google Fonts with `display=swap`.
- **Scale:** fluid via `clamp()`. H1 is about 40px on mobile and about 64px on desktop.

**Layout.**
- Container max width 1,120px.
- 16px side gutter on mobile; no horizontal scroll at 360px.

**Signature visual.** Mono gate printouts with green `PASS` chips. They appear in the hero card, the differentiator evidence lines and "Inside a draft".

**Motion.**
- Restrained: fade/translate reveals, the pipeline steps lighting up in sequence, gate lines typing in.
- All motion is disabled under `prefers-reduced-motion: reduce`.

## 4. Technical design

**Files**
```
content-agent-site/
├── index.html      # semantic sections, all copy
├── styles.css      # tokens, layout, components, dark mode, reduced motion
├── main.js         # reveals (IntersectionObserver), pipeline + typing animation, tabs, proof rendering, booking-link wiring
├── config.js       # BOOKING_URL, CONTACT_EMAIL, LOGOS[], TESTIMONIALS[]
├── assets/         # favicon.svg, wordmark.svg, og-image.png (1200x630)
├── README.md       # edit copy, set booking URL, add proof, deploy
└── docs/superpowers/specs/  # this spec
```

**Units and their contracts**
- **`config.js`.** Exports `BOOKING_URL` (default `"REPLACE_ME"`), `CONTACT_EMAIL` (default `"REPLACE_ME"`), `LOGOS` (array of `{name, src}`), `TESTIMONIALS` (array of `{quote, name, role}`). These are the only values a non-developer edits besides copy.
- **Booking wiring (`main.js`).** Every element with `data-cta="book"` gets `href = BOOKING_URL` and opens in a new tab. While the value is `REPLACE_ME`, the console logs a warning and the link points to `#book`, which scrolls to the final CTA band. The site never links to a dead URL.
- **Proof rendering (`main.js`).** Renders the §2.9 section only when `LOGOS.length || TESTIMONIALS.length`; otherwise the section keeps `hidden`.
- **Tabs (`main.js`).** ARIA tabs pattern on desktop (arrow-key navigation); `<details>` accordion fallback without JavaScript.
- **Animations (`main.js`).** Use IntersectionObserver, run once per element, and are skipped under reduced motion.
- **No other JavaScript, no trackers, no external requests** besides Google Fonts.

**Without JavaScript.** All content is readable and the CTAs fall back to `#book`.

**SEO and sharing.**
- `<title>`, meta description, canonical placeholder, Open Graph and Twitter card tags pointing at `og-image.png`.
- One H1, ordered H2/H3.

**Accessibility.**
- Semantic landmarks and a skip link.
- Visible focus states.
- Colour contrast at WCAG AA in both themes.
- The disclosure and tab patterns are keyboard operable.
- SVG diagrams have `role="img"` and an `aria-label`.

**Performance.**
- No images in the critical path; diagrams are inline SVG.
- Fonts preconnected.
- Target: Lighthouse 95+ on mobile for Performance, Accessibility, Best Practices and SEO.

## 5. Copy rules (enforced before launch)
1. Every capability claim maps to something in the content-agent repo (law files, voiceprint, source gate, critic panel, linters, 45-day cooldown, sentinel tracking, the four formats).
2. No client names, logos, handles, numbers, quotes or real posts. Sample content is fictional and labelled "Illustrative example".
3. No performance promises (followers, leads, revenue). Commercial terms are "agreed on the call".
4. House style: no em dashes, no "it's not X, it's Y" antithesis, no hype vocabulary (game-changer, unlock, supercharge, 10x).

## 6. Review and launch
1. Build locally.
2. Publish a private Artifact preview for review.
3. On approval, push to the public frontend repo (`Sai-Prashanth123/content-agent-frontend`).
4. Deploy to Vercel (static, no build command); share the preview URL.
5. Before go-live, the owner supplies `BOOKING_URL`, `CONTACT_EMAIL` and the domain (e.g. `thought-pilot.com` or a subdomain), plus approved proof if any.

## 7. Verification
- **HTML:** validates with the W3C validator (no errors); no console errors in Chromium.
- **Layout:** screenshots at 375px and 1,440px, light and dark; no horizontal scroll at 360px.
- **Lighthouse:** mobile run, each category ≥95 (record scores in the PR/commit message).
- **Links:** every `data-cta="book"` resolves to `BOOKING_URL` (scripted DOM check); `REPLACE_ME` fallback behaves as specified.
- **Copy:** grep for em dash (`—`), "it's not", "isn't about", hype list, and the content-agent client roster names; all must return nothing.
- **Behaviour:** reduced-motion check (no animation), no-JavaScript check (content readable, CTAs go to `#book`), keyboard pass through tabs and FAQ.

## 8. Out of scope
- Other pages, a blog, pricing, case studies.
- Studio-wide services beyond the content agent.
- CMS, analytics, contact forms, A/B tests.
- Real client proof until approved.
- Custom domain DNS changes, which the owner does.
