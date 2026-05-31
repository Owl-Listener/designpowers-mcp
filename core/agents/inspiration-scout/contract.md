---
agent: inspiration-scout
contract_version: 1.0.0
persona: agents/inspiration-scout.md
evidence_schema: core/schemas/evidence.schema.json
mcp_servers: []
---

# Contract: inspiration-scout

Aesthetic references, interaction examples, cross-domain inspiration matched to the
brief and taste profile. The persona (`agents/inspiration-scout.md`) supplies the
curatorial judgment. This contract fixes the boundary.

## Inputs

- The brief, taste profile, and the direction needing references.

## Checkable vs judgment

- **Judgment (essentially all of it):** taste, resonance, fit to the emotional
  target, "what to take / what to leave." Inspiration is judgment; there is no
  truth to measure, and a tool here would add nothing.

## Outputs

A curated reference set, each annotated with what to take and what to leave, and
why it fits *this* brief. `tool_calls` empty by nature.

## Handoff

To `design-lead` (visual direction). Filtered through the project's taste, never a
generic mood board.
