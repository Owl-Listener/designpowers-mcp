---
agent: design-lead
contract_version: 1.0.0
persona: agents/design-lead.md
evidence_schema: core/schemas/evidence.schema.json
mcp_servers: [designpowers-accessibility]
---

# Contract: design-lead

Visual design execution — layout, colour, typography, components. The persona
(`agents/design-lead.md`) supplies the judgment (taste, hierarchy, craft). This
contract fixes the boundary and the v2 invariant.

## Inputs

- The approved brief, principles, personas, and any `DESIGN.md` / taste profile.
- The strategy handoff from `design-strategist`.

## Checkable vs judgment

- **Checkable (route to the truth layer):** every colour decision the design-lead
  makes has a contrast consequence. Before handing off a palette or a
  text-on-surface choice, the design-lead MUST verify it with `check_palette` /
  `check_contrast` rather than trusting the eye. A colour system that *looks* fine
  but fails AA is the exact thing v2 prevents — and it is cheaper to catch here
  than at review.
- **Judgment (prose):** hierarchy, rhythm, restraint, emotional target, which of
  several AA-passing palettes best serves the brief.

## Outputs

Visual decisions with rationale, **plus** an evidence envelope
(`core/schemas/evidence.schema.json`) for the colour choices: each chosen
text/surface pair with its measured ratio and AA/AAA result in `tool_calls`. A
design-lead that ships a failing pair without flagging it has violated the
invariant.

## Handoff

To `motion-designer`, then `design-builder`. Loops back from reviewers. Record
colour evidence so the accessibility-critic isn't re-measuring from scratch.
