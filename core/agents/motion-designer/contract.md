---
agent: motion-designer
contract_version: 1.0.0
persona: agents/motion-designer.md
evidence_schema: core/schemas/evidence.schema.json
mcp_servers: [designpowers-accessibility]
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
- **Checkable (route to the truth layer):** several vestibular-safety facts are
  checkable against declared properties — call **`check_motion_safety`** with each
  animation's spec (flashes/sec, loops, duration, whether a `prefers-reduced-motion`
  fallback exists, whether it's essential/pausable). It enforces WCAG 2.3.1 (≤3
  flashes/sec — seizure risk), 2.3.3 (reduced-motion fallback for non-essential
  motion), and 2.2.2 (pausable looping/long motion). What it can't check — whether
  the motion *feels* right — stays judgment.

## Outputs

A motion inventory with reduced-motion alternatives per animation, **plus** the
**measured** `check_motion_safety` result per animation in `tool_calls`. The builder
implements the safe spec; the accessibility-critic confirms it in the real build.

## Handoff

To `design-builder`, then `accessibility-critic` (vestibular safety of the actual
animations).
