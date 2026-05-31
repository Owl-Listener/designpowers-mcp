#!/usr/bin/env node
// Generate Antigravity "pointer" Skills for every Designpowers process skill.
//
// WHY: Antigravity only auto-discovers Skills under a plugin's skills/ dir. The
// 31 process skills are the SINGLE SOURCE OF TRUTH at repo-root skills/ (reused
// unchanged by every surface — Antigravity, Claude, Gemini). Rather than DUPLICATE
// that content into the plugin (which would break the fat-core/thin-adapter rule
// and the v1 Claude/Gemini packaging that loads from root), we generate a thin
// POINTER skill per process skill: same name + description (so Antigravity
// discovers and activates it), a body that says "read and follow the core file."
//
// This script is the source of truth for the pointers; it is committed and the
// consistency check verifies the generated files are in sync. Run:
//   node scripts/gen-antigravity-pointer-skills.mjs            # write
//   node scripts/gen-antigravity-pointer-skills.mjs --check    # verify in sync (CI)

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "skills");
const OUT = join(ROOT, ".agents", "plugins", "designpowers", "skills");
const checkOnly = process.argv.includes("--check");

// Agent skills already authored by hand (not process-skill pointers). Skip these
// names if a process skill ever collides (none do today) — agent skills win.
const AGENT_SKILLS = new Set(readdirSync(OUT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .filter((d) => existsSync(join(OUT, d.name, ".agent-skill")))
  .map((d) => d.name));

// Parse the YAML frontmatter block, capturing `name` and the (possibly multi-line)
// `description`. We re-emit description as a block scalar so any quotes/colons in
// the text are safe regardless of how the source formatted it.
function parseFrontmatter(md, file) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error(`no frontmatter in ${file}`);
  const fm = m[1];
  const nameM = fm.match(/^name:\s*(.+)$/m);
  if (!nameM) throw new Error(`no name in ${file}`);
  const name = nameM[1].trim();

  // description: from its line until the next top-level "key:" or end of block.
  const lines = fm.split("\n");
  let desc = null, capturing = false, buf = [];
  for (const line of lines) {
    if (!capturing) {
      const d = line.match(/^description:\s*(.*)$/);
      if (d) { capturing = true; if (d[1].trim()) buf.push(d[1].trim()); }
    } else {
      if (/^[A-Za-z0-9_-]+:\s/.test(line)) break;        // next top-level key
      if (line.trim() === "") { if (buf.length) break; else continue; }
      buf.push(line.trim());
    }
  }
  desc = buf.join(" ").replace(/\s+/g, " ").trim();
  if (!desc) throw new Error(`no description in ${file}`);
  return { name, description: desc };
}

function pointer(name, description) {
  return `---
name: ${name}
description: >-
  ${description}
---

# ${name} (Designpowers process skill — pointer)

This is a **thin pointer**, not the skill itself. The skill content is the single
source of truth in the shared core and is reused unchanged by every Designpowers
surface (Antigravity, Claude, Gemini).

**Read and follow \`skills/${name}/SKILL.md\` in this repository, and do exactly
what it says.** Open the file — do not work from memory — so you stay in sync with
the core as it evolves. If that file references other skills, follow those through
their pointers the same way.
`;
}

const srcDirs = readdirSync(SRC, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

let written = 0, drift = 0;
for (const name of srcDirs) {
  const srcFile = join(SRC, name, "SKILL.md");
  if (!existsSync(srcFile)) continue;
  if (AGENT_SKILLS.has(name)) continue; // never overwrite a hand-authored agent skill
  const { description } = parseFrontmatter(readFileSync(srcFile, "utf8"), srcFile);
  const content = pointer(name, description);
  const outFile = join(OUT, name, "SKILL.md");

  if (checkOnly) {
    const cur = existsSync(outFile) ? readFileSync(outFile, "utf8") : "";
    if (cur !== content) { console.error(`DRIFT: ${name} pointer is out of sync (run the generator)`); drift++; }
  } else {
    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, content);
    written++;
  }
}

if (checkOnly) {
  if (drift) { console.error(`\n${drift} pointer(s) out of sync.`); process.exit(1); }
  console.log(`OK — all ${srcDirs.length} process-skill pointers in sync.`);
} else {
  console.log(`Generated ${written} pointer skills into ${OUT}`);
}
