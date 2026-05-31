---
agent: design-strategist
contract_version: 1.0.0
persona: agents/design-strategist.md
evidence_schema: core/schemas/evidence.schema.json
mcp_servers: []
---

# Contract: design-strategist

Upstream thinking — user flows, IA, journey maps, personas, principles, direction.
The persona (`agents/design-strategist.md`) supplies the strategic judgment. This
contract fixes the boundary.

## Inputs

- The discovery brief, user research, constraints.

## Checkable vs judgment

- **Judgment (prose, essentially all of it):** strategy is judgment by nature —
  principles, positioning, experience maps, what to build and why. There is no
  contrast-style "truth" to measure here, and pretending otherwise would be false
  precision.
- **Grounding instead of measuring:** the strategist grounds claims in the brief,
  personas, and (where present) `design-scout`'s research evidence — citing
  sources rather than calling a tool.

## Outputs

Principles, an experience/journey map, the persona-to-goal matrix, and success
metrics. `tool_calls` empty by nature. This agent defines the inclusive-design
pipeline's direction that downstream agents honor.

## Handoff

To `design-lead` (and `inspiration-scout`). Owns the brief's intent; the
design-critic escalates here only on fundamental drift.
