#!/usr/bin/env node
// Designpowers welcome gate — a PreInvocation hook.
//
// WHY: the Designpowers welcome/router (skills/using-designpowers) MUST run before
// any design work, every session. v1 enforced this with a Claude Code SessionStart
// hook. Antigravity's equivalent is a PreInvocation hook that can deterministically
// INJECT a step before the model is called — so the welcome isn't left to the
// model's discretion (a rule alone only *steers*; this *fires*).
//
// CONTRACT (per Antigravity hooks docs):
//   stdin  : JSON with { invocationNum, initialNumSteps, conversationId,
//            transcriptPath, workspacePaths, artifactDirectoryPath }
//   stdout : JSON { injectSteps: [ { ephemeralMessage } ] }  (empty to do nothing)
//
// BEHAVIOUR: fire exactly once per conversation — on the FIRST model invocation —
// then stay silent. We detect "first" two ways for robustness:
//   1. invocationNum <= 1 (the doc's sequence number), AND
//   2. a per-conversation marker file we drop after firing (so we never double-fire
//      even if invocationNum semantics differ across versions).
// Fail OPEN: any error -> emit no injection (never block the user over a hook bug).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const NOTHING = () => { process.stdout.write(JSON.stringify({ injectSteps: [] })); process.exit(0); };

let input = "";
try {
  input = readFileSync(0, "utf8"); // stdin
} catch {
  NOTHING();
}

// No real input -> do nothing (never inject on an empty/absent payload).
if (!input || !input.trim()) NOTHING();

let payload = {};
try { payload = JSON.parse(input); } catch { NOTHING(); }

// Require a real conversation id; without one we can't dedupe, so stay silent.
if (!payload.conversationId) NOTHING();

const invocationNum = Number(payload.invocationNum ?? 0);
const convoId = String(payload.conversationId || "").replace(/[^a-zA-Z0-9_-]/g, "") || "unknown";

// Per-conversation marker so we fire once and only once.
let markerDir, marker;
try {
  markerDir = join(tmpdir(), "designpowers-welcome");
  mkdirSync(markerDir, { recursive: true });
  marker = join(markerDir, `${convoId}.fired`);
} catch {
  marker = null;
}

const alreadyFired = marker && existsSync(marker);
// Treat invocationNum 0/1 as "first". If the field is absent (0) we still gate on
// the marker, so we won't spam on later turns.
const isFirst = invocationNum <= 1;

if (alreadyFired || !isFirst) NOTHING();

const welcome = [
  "DESIGNPOWERS — run the welcome/router before anything else.",
  "Before responding to this message, read and follow",
  "`skills/using-designpowers/SKILL.md` (the `using-designpowers` skill):",
  "show the welcome (the bird), check for a returning user's taste profile at",
  "~/.designpowers/taste-profile.md, then route Build vs Review. Use the native",
  "ask_question tool for the walkthrough and Build/Review choices. Do NOT invoke",
  "any other Designpowers skill or agent until the welcome sequence has completed.",
  "Then maintain design-state.md across the pipeline. (Designpowers welcome gate)",
].join(" ");

try {
  if (marker) writeFileSync(marker, new Date().toISOString());
} catch { /* non-fatal */ }

process.stdout.write(JSON.stringify({ injectSteps: [{ ephemeralMessage: welcome }] }));
process.exit(0);
