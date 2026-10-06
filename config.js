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

// Ad pixels. Leave an ID empty and that pixel never loads. Pixels load only
// after the visitor accepts the cookie banner (CONSENT_REQUIRED).
export const PIXELS = {
  meta: "",                 // Meta Pixel ID
  linkedin: "",             // LinkedIn Insight Tag partner ID
  linkedinConversionId: "", // LinkedIn conversion ID for "booked call"
  google: "",               // GA4 measurement ID (G-...) or Google tag ID
  googleAdsSendTo: "",      // Google Ads conversion "AW-.../label" for "booked call"
  x: "",                    // X (Twitter) pixel ID
  xEventId: "",             // X conversion event ID for "booked call"
};
export const CONSENT_REQUIRED = true;

// Owner-approved anonymised results only. The Results section stays hidden
// while this list is empty. Never put a client name here.
// Example: { who: "SaaS operator on X", metric: "median views per post", before: "124", after: "615", window: "first 10 weeks" }
export const RESULTS = [];
