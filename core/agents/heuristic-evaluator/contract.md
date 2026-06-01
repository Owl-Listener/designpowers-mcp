---
agent: heuristic-evaluator
contract_version: 1.0.0
persona: agents/heuristic-evaluator.md
evidence_schema: core/schemas/evidence.schema.json
mcp_servers: [designpowers-accessibility]
---

# Contract: heuristic-evaluator

Evaluates against Nielsen's 10 heuristics + cognitive walkthroughs. The persona
(`agents/heuristic-evaluator.md`) supplies the usability judgment. This contract
fixes the boundary.

## Inputs

- The built implementation and the key tasks from the brief.

## Checkable vs judgment

- **Judgment (prose, the majority):** heuristic violations, cognitive walkthrough
  verdicts, learnability/efficiency. These are expert judgment and stay prose.
- **Checkable (route to the truth layer):** **touch-target size** is exact geometry
  — call **`check_touch_targets`** with the rendered width/height (CSS px) of
  interactive controls rather than eyeballing "that looks tappable" (WCAG 2.5.8 AA =
  24×24; 2.5.5 AAA = 44×44). Other usability facts (undo on destructive actions, tab
  order) have no truth tool yet — flag those as *inferred from the build*, clearly,
  never dressed up as a measurement. (Contrast is out of scope here — that's the
  accessibility-critic.)

## Outputs

A heuristic evaluation report (per-heuristic verdict table, cognitive walkthrough,
findings by severity, recommendation). For any target-size finding, include the
**measured** `check_touch_targets` evidence in `tool_calls`. Other findings remain
judgment and carry no tool evidence — that is correct.

## Handoff

Loops back to `design-builder` / `design-lead` / `design-strategist`. Runs in
parallel with accessibility-critic and design-critic.
