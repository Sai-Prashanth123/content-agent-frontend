# ThoughtPilot Content Agent: landing page

One static page. No framework, no build step.

## Edit
- **Copy:** `index.html`. Keep the house rules: no em dashes, no "not X but Y" antithesis, no client names or numbers, sample posts labelled "Illustrative example". Check with `npm run copy`.
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

## Before going live (checklist)
1. **Booking.** In `config.js`, set `BOOKING_URL` to your Calendly or Cal.com event link (https). "Book" buttons then open the scheduler inside the page, and utm_* tags from the ad are passed through.
2. **Pixels.** In `config.js` `PIXELS`, add the IDs you use: Meta Pixel ID; LinkedIn partner ID plus the conversion ID for "booked call"; GA4/Google tag ID plus the Google Ads `send_to` for "booked call"; X pixel ID plus the X event ID. An empty ID loads nothing. Pixels load only after the visitor accepts the cookie banner.
3. **Results.** Add only owner-approved, anonymised results to `RESULTS` (never a client name). The Results section stays hidden while it is empty.
4. **Privacy page.** Have `privacy.html` reviewed for your business and jurisdiction, and set `CONTACT_EMAIL`.
5. **Domain.** Replace `https://REPLACE_ME/` in the canonical link, make `og:image` absolute (`https://<domain>/assets/og-image.png`) and add `<meta property="og:url" content="https://<domain>/">`.
6. **Verify.** `npm test`, `npm run validate`, `npm run copy`, then with `npm run serve` running: `npm run layout` and `npm run behavior`. Run Lighthouse on the deployed URL.
