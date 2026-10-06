// Copy-rule scanner (spec section 5). Usage: node scripts/check-copy.mjs
// Client names are read from scripts/client-blocklist.local.txt (one per line,
// git-ignored) so the confidential roster is never published with the site.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const RULES = [
  [/—/, "em dash"],
  [/\bit'?s not [^.\n]{1,60}, it'?s\b/i, "it's not X, it's Y"],
  [/\bisn'?t about\b/i, "isn't about"],
  [/\b(game[- ]changer|supercharge|skyrocket|10x)\b/i, "hype word"],
  [/\bunlock(s|ing)?\b/i, "hype word: unlock"],
];

const BLOCKLIST = new URL("./client-blocklist.local.txt", import.meta.url);

export function loadBlocklist() {
  if (!existsSync(BLOCKLIST)) return [];
  return readFileSync(BLOCKLIST, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function findCopyViolations(text, names = loadBlocklist()) {
  const found = RULES.filter(([re]) => re.test(text)).map(([, label]) => label);
  if (names.length && new RegExp(`\\b(${names.map(escapeRe).join("|")})`, "i").test(text)) {
    found.push("client name");
  }
  return found;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const names = loadBlocklist();
  if (!names.length) console.log("NOTE: no scripts/client-blocklist.local.txt, client-name check skipped");
  let bad = 0;
  for (const f of ["index.html", "README.md"]) {
    const v = findCopyViolations(readFileSync(f, "utf8"), names);
    if (v.length) { bad++; console.log(`FAIL ${f}: ${v.join(", ")}`); } else console.log(`PASS ${f}`);
  }
  process.exit(bad ? 1 : 0);
}
