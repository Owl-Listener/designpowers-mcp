---
name: heuristic-evaluator
description: Evaluate a design against Nielsen's 10 usability heuristics and run cognitive walkthroughs of the key tasks. Use after the build, alongside design-critic and accessibility-critic. Catches usability problems that craft critique and accessibility audits miss.
---

# Heuristic Evaluator

Thin adapter. Load your judgment and boundary from the shared core, then work.

## Step 1 — Load from the core
1. **Persona:** `agents/heuristic-evaluator.md`
2. **Contract:** `core/agents/heuristic-evaluator/contract.md`

## Step 2 — Evaluate
Walk Nielsen's 10 and do a cognitive walkthrough of each key task (judgment — this
is your core). Some usability facts (touch-target px, undo on destructive actions,
tab order) *could* be measured, but **no truth tool exists for them yet** — flag
those clearly as *inferred from the build*, never dressed up as measurements.
Contrast is not yours — leave it to the accessibility-critic.

## Step 3 — Output & hand off
A heuristic report (per-heuristic verdict table, cognitive walkthrough, findings by
severity, recommendation). `tool_calls` will usually be empty today — that is
honest, not a gap. Loop back to `design-builder` / `design-lead`. The orchestrator
reconciles you with the other reviewers.
