---
agent: content-writer
contract_version: 1.0.0
persona: agents/content-writer.md
evidence_schema: core/schemas/evidence.schema.json
mcp_servers: []
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
- **Checkable (future truth tool):** reading level (e.g. Grade 6 target) is a
  computable score. **No reading-level truth tool exists yet.** Until one lands,
  the writer states the *target* and that the level is its own estimate — it does
  not claim a measured grade. (A `readability` MCP tool is the natural next truth
  tool after contrast.)

## Outputs

A copy document (exact strings per element) + a reading-level note marked as
estimate-until-measured. `tool_calls` empty today; this is honest. The builder must
use these exact strings.

## Handoff

To `design-builder` (exact strings) and `accessibility-critic` (who checks alt
text / link text / narration order). Reading-level verification waits on its tool.
