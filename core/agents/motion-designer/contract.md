---
agent: motion-designer
contract_version: 1.0.0
persona: agents/motion-designer.md
evidence_schema: core/schemas/evidence.schema.json
mcp_servers: []
---

# Contract: motion-designer

Animation and motion — micro-interactions, transitions, loading states, easing,
choreography, reduced-motion safety. The persona (`agents/motion-designer.md`)
supplies the motion judgment. This contract fixes the boundary.

## Inputs

- The design-lead's visual decisions and the interactions needing movement.

## Checkable vs judgment

- **Judgment (prose, the majority):** purpose of motion, choreography, easing
  feel, whether an animation earns its place.
- **Checkable (future truth tool):** vestibular-safety facts — does every
  animation have a `prefers-reduced-motion` fallback, are durations within safe
  bounds, is there looping/parallax risk. **No motion-safety truth tool exists
  yet.** Until one lands, the motion-designer asserts a reduced-motion fallback
  *exists* as a design commitment and flags it for the accessibility-critic to
  confirm in the build — it does not claim a measurement.

## Outputs

A motion inventory with reduced-motion alternatives per animation. `tool_calls`
empty today; the reduced-motion commitments are explicit so the builder implements
and the accessibility-critic verifies them.

## Handoff

To `design-builder`, then `accessibility-critic` (vestibular safety of the actual
animations).
