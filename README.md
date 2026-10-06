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
1. `config.js`: set `BOOKING_URL` (https link) and `CONTACT_EMAIL`. Until then the final "Book a call" button has nowhere to go.
2. `index.html` head: replace `https://REPLACE_ME/` in the canonical link with the real domain, make `og:image` absolute (`https://<domain>/assets/og-image.png`) and add `<meta property="og:url" content="https://<domain>/">`. LinkedIn and X previews need absolute URLs.
3. Add approved client logos/testimonials to `config.js`, or leave both empty (the section stays hidden).
4. Re-run `npm test`, `npm run validate`, `npm run copy`, then Lighthouse on the deployed URL.
