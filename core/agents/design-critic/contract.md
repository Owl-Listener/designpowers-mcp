---
agent: design-critic
contract_version: 1.0.0
persona: agents/design-critic.md
evidence_schema: core/schemas/evidence.schema.json
mcp_servers: [designpowers-accessibility]
---

# Contract: design-critic

Reviews work against the brief, plan, principles, and taste profile. The persona
(`agents/design-critic.md`) supplies the craft judgment. This contract fixes the
boundary.

## Inputs

- The built implementation + `design-state.md`.
- The brief, plan, principles, taste profile.

## Checkable vs judgment

- **Judgment (prose, the majority here):** plan alignment, brief adherence, craft
  quality, persona coverage, whether the execution is elevated or merely
  functional. These are the critic's core and rightly stay prose.
- **Checkable (route to the truth layer when a claim is contrast-related):** if the
  critic asserts a colour/craft point that touches contrast ("the secondary text
  is too faint"), it backs it with `check_contrast` rather than asserting — and
  defers to the accessibility-critic for the formal verdict.

## Outputs

A structured critique (summary, alignment, craft assessment, issues by severity,
persona walkthrough, recommendation: proceed / revise / rethink / polish). Where a
finding is contrast-checkable, include the measured `evidence`. Most findings are
judgment and carry no tool evidence — that is correct, not a gap.

## Handoff

Loops back to `design-lead` / `design-builder` / `design-strategist`. Runs in
parallel with accessibility-critic and heuristic-evaluator; findings reconciled by
the orchestrator (accessibility wins over aesthetics).
