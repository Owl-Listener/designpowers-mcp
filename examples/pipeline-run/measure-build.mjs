#!/usr/bin/env node
// Pipeline proof — the load-bearing seam: the studio measures its OWN built output.
//
// This is what makes the worked example a proof rather than a narration. It:
//   1. reads an actual build file (toast.vN.html),
//   2. extracts the REAL colour custom-properties from its CSS,
//   3. derives the text/surface pairs on the screen,
//   4. runs them through the REAL truth-layer logic (mcp-tools/accessibility/wcag.js
//      — the same code the check_palette MCP tool calls),
//   5. prints the measured verdict and exits non-zero if anything fails AA.
//
// Nothing here is hardcoded: change a hex in the HTML and the verdict changes.
//
// Usage: node measure-build.mjs build/toast.v1.html
//        node measure-build.mjs build/toast.v2.html --expect-pass

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { evaluatePairs } from "../../mcp-tools/accessibility/wcag.js";

const here = dirname(fileURLToPath(import.meta.url));
const file = process.argv[2];
const expectPass = process.argv.includes("--expect-pass");
if (!file) { console.error("usage: node measure-build.mjs <build.html> [--expect-pass]"); process.exit(2); }

const html = readFileSync(resolve(here, file), "utf8");

// Pull `--name: #hex;` custom properties straight out of the build's CSS.
const vars = {};
for (const m of html.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)) vars[m[1]] = m[2];

// The pairs that actually appear on the screen (text colour on its surface).
const pairs = [
  { label: "toast message", foreground: vars["toast-title"], background: vars["toast-surface"], textSize: "normal" },
  { label: "Undo button",   foreground: vars["toast-undo"],  background: vars["toast-surface"], textSize: "normal" },
];

console.log(`Measuring ${file} — colours read from the build:`);
for (const p of pairs) console.log(`  ${p.label.padEnd(14)} ${p.foreground} on ${p.background}`);

const { results, summary } = evaluatePairs(pairs);
console.log("\nMeasured evidence (from mcp-tools/accessibility — the truth layer):");
for (const r of results) {
  const v = r.passAAA ? "PASS AAA" : r.passAA ? "PASS AA" : "FAIL AA";
  console.log(`  ${r.label.padEnd(14)} ${String(r.ratio).padStart(5)}:1  (AA needs ${r.aaThreshold})  → ${v}`);
}
console.log(`\nVerdict: ${summary.verdict}`);

const failed = summary.failAA > 0;
if (expectPass && failed) { console.error("EXPECTED ALL PASS, but a pair fails AA."); process.exit(1); }
if (!expectPass && !failed) { console.error("EXPECTED a failure to demonstrate the catch, but all passed."); process.exit(1); }
process.exit(0);
