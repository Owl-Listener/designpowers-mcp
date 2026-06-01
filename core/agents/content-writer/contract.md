---
agent: content-writer
contract_version: 1.0.0
persona: agents/content-writer.md
evidence_schema: core/schemas/evidence.schema.json
mcp_servers: [designpowers-accessibility]
---

# Contract: content-writer

Interface copy, labels, errors, empty states, alt text — plain language with
cognitive accessibility built in. The persona (`agents/content-writer.md`) supplies
the writing judgment. This contract fixes the boundary.

## Inputs

- The brief, personas, voice/tone direction, and the screens needing copy.

## Checkable vs judgment

- **Judgment (prose, the majority):** clarity, warmth, tone, whether a label
  reduces cognitive load, plain-language phrasing.
- **Checkable (route to the truth layer):** reading level (e.g. Grade 6 target) is
  a computable score. Call **`check_reading_level`** on the copy rather than
  guessing "this feels grade 6." It returns a reproducible *standard estimate*
  (Flesch–Kincaid; exact word/sentence counts, standard syllable heuristic) — so
  state the measured grade and that it is a standard estimate, not exact the way
  contrast is. Honest precision, not false precision.

## Outputs

A copy document (exact strings per element) + the **measured** reading level from
`check_reading_level` in `tool_calls` (grade + meets-target). The builder must use
these exact strings.

## Handoff

To `design-builder` (exact strings) and `accessibility-critic` (who checks alt
text / link text / narration order). Reading-level verification waits on its tool.
