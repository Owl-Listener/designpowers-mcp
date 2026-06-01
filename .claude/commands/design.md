---
description: Run the full Designpowers inclusive-design studio — director-driven pipeline from welcome through ship, with checkable claims measured by the truth layer.
---

# Design (run the Designpowers studio)

Run the full Designpowers inclusive-design pipeline, director-driven. This command
is the orchestrator: it sequences the design agents, surfaces handoffs to the user,
and enforces the v2 invariant (measure, don't assert) via the truth layer. It holds
no design judgment itself — each agent loads that from the shared core.

## Before anything: the welcome + router

Read and follow `skills/using-designpowers/SKILL.md` — show the welcome (the bird),
check for a returning user (`~/.designpowers/taste-profile.md`), and route Build vs
Review. Do **not** skip it. (In Claude Code this also fires via the SessionStart
hook; honor it here too.) The pipeline below is the Build lane; for "review
something that already exists," follow the Review lane (`skills/design-review/SKILL.md`).

## Modes

Start in **Direct** mode: after each agent hands off, show the handoff babble and
**pause** for the user to approve / correct / redirect / skip. The user is the
creative director and overrides everything. Switch to **Auto** on "go auto" (still
narrate; still pause on the safeguards below).

## The pipeline (Build lane)

Dispatch each agent with the **Task tool**, targeting the matching subagent in
`agents/`. Each agent must read its contract `core/agents/<id>/contract.md` and,
where the contract says so, **call the truth tools** (`check_contrast` /
`check_palette` from the `designpowers-accessibility` MCP server). Keep
`design-state.md` current throughout (see `skills/design-state/SKILL.md`).

1. **design-strategist** — principles, flows, IA, journey map, persona-to-goal.
2. **design-scout** — competitive/inclusion research (measures contrast when
   auditing competitors).
3. **inspiration-scout** — references matched to brief + taste.
4. **design-lead** — visual decisions; **measures its colour choices** (truth tool).
5. **motion-designer** — motion + reduced-motion commitments.
6. **content-writer** — exact strings; reading-level target.
7. **design-builder** — builds; **measures the contrast of its own rendered output**.
   → **Screenshot checkpoint:** show the user the built result before reviewers.
8. **Parallel review** — dispatch the three reviewers **simultaneously** (multiple
   Task calls in one turn, each running concurrently):
   - **accessibility-reviewer** — MEASURES contrast (the truth verdict).
   - **design-critic** — craft/brief/plan (judgment).
   - **heuristic-evaluator** — Nielsen's 10 + cognitive walkthrough (judgment).
9. **Reconcile** — apply the Reconciliation Protocol from
   `skills/using-designpowers/SKILL.md`: classify Aligned / Complementary /
   Conflicting; resolve by its priority order (**accessibility wins over
   aesthetics**, usability over style, brief over opinion, personas break ties,
   else escalate to the user).
10. **Fix round** — `design-builder` applies the prioritised fixes and
    **re-measures**. Re-run only the relevant reviewers on the fixes.
11. **synthetic-user-testing**, then **verification-before-shipping** — evidence,
    not "I think it works."
12. **Team presentation** — each participating agent speaks; surface disagreements;
    the user decides what ships.

## Auto-mode safeguards (always pause, even in Auto)

- accessibility-reviewer finds a **critical** (a pair fails AA).
- design-critic recommends **rethink**.
- heuristic-evaluator finds a critical H3/H1.
- synthetic testing shows a persona can't complete the primary task.
- reconciliation can't resolve a conflict.

## The invariant, enforced here

At every step where a claim is checkable contrast, the responsible agent MUST have
called the truth tool. If `check_contrast` / `check_palette` aren't available, run
`/verify-accessibility-tools` and fix the wiring before proceeding — never let an
agent estimate a ratio.
