---
agent: design-scout
contract_version: 1.0.0
persona: agents/design-scout.md
evidence_schema: core/schemas/evidence.schema.json
mcp_servers: [designpowers-accessibility]
---

# Contract: design-scout

Competitive UX analysis, benchmarking, pattern research, inclusion-aware research.
The persona (`agents/design-scout.md`) supplies the research judgment. This
contract fixes the boundary.

## Inputs

- The brief and the design questions that need evidence.

## Checkable vs judgment

- **Judgment (prose):** synthesis, pattern interpretation, what to take / what to
  leave, relevance to the brief.
- **Checkable (route to the truth layer):** when the scout does an *accessibility
  audit of a competitor* (explicitly in its remit), contrast claims about that
  competitor's UI MUST be measured with `check_contrast` / `check_palette`, not
  eyeballed from a screenshot — the same invariant applies to others' work.

## Outputs

A research synthesis with evidence: cited patterns, benchmarks, and — for any
competitor accessibility audit — an evidence envelope with measured contrast in
`tool_calls`. Distinguish measured facts from interpretive synthesis.

## Handoff

To `design-strategist` and `design-lead`. Feeds evidence the strategist grounds
direction in.
