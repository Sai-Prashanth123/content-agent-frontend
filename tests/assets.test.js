import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

test("referenced assets exist", () => {
  for (const f of ["assets/favicon.svg", "assets/wordmark.svg", "assets/og-image.png"]) {
    assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), f);
  }
});

test("og image is 1200x630 PNG", () => {
  const buf = readFileSync(new URL("../assets/og-image.png", import.meta.url));
  assert.equal(buf.toString("ascii", 1, 4), "PNG");
  assert.equal(buf.readUInt32BE(16), 1200);
  assert.equal(buf.readUInt32BE(20), 630);
});
