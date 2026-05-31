---
agent: design-builder
contract_version: 1.0.0
persona: agents/design-builder.md
evidence_schema: core/schemas/evidence.schema.json
mcp_servers: [designpowers-accessibility]
---

# Contract: design-builder

Builds production-ready implementations from design specs. The persona
(`agents/design-builder.md`) supplies the engineering judgment. This contract
fixes the boundary and the v2 invariant.

## Inputs

- The design-lead's visual decisions (incl. the colour evidence they recorded).
- The motion-designer's specs and the content-writer's exact strings.
- The brief, plan, and any `DESIGN.md`.

## Checkable vs judgment

- **Checkable (route to the truth layer):** the builder is the first agent that
  produces *rendered output with real colours*. Before declaring a build done, it
  MUST run `check_palette` on the actual text/surface pairs it shipped — not the
  spec's intended colours, the ones that ended up in the code. This is "measure
  your own output," the seam the whole demo turns on.
- **Judgment (prose):** component structure, state handling, where to deviate from
  spec and why, performance trade-offs.

## Outputs

Working implementation + implementation notes, **plus** an evidence envelope for
the rendered colour pairs (`tool_calls` from `check_palette`). The builder must
note any content-writer strings it could not implement, and any spec colour it had
to change (with the new measured ratio).

## Handoff

To the parallel reviewers (accessibility-critic, design-critic,
heuristic-evaluator). Receives fix lists back. On a fix round, re-measure.
