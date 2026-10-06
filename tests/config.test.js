import { test } from "node:test";
import assert from "node:assert/strict";
import * as cfg from "../config.js";

test("config exports owner-editable values with safe defaults", () => {
  assert.equal(cfg.BOOKING_URL, "REPLACE_ME");
  assert.equal(cfg.CONTACT_EMAIL, "REPLACE_ME");
  assert.deepEqual(cfg.LOGOS, []);
  assert.deepEqual(cfg.TESTIMONIALS, []);
});

test("new ad settings default to safe, empty values", () => {
  assert.equal(cfg.CONSENT_REQUIRED, true);
  assert.deepEqual(cfg.RESULTS, []);
  for (const v of Object.values(cfg.PIXELS)) assert.equal(v, "");
});
