# Designpowers

This is the Designpowers design workflow system.

## Mandatory: Welcome Sequence First

**Before doing anything else in a new session**, you MUST run the welcome sequence defined in `skills/using-designpowers/SKILL.md`. This is non-negotiable.

1. Invoke the `using-designpowers` skill using the Skill tool **before** responding to any user message
2. The skill will show the bird welcome screen and handle onboarding
3. Do NOT skip the welcome, do NOT jump straight into design work, do NOT answer questions before the welcome runs

The welcome sequence checks for a returning user (taste profile at `~/.designpowers/taste-profile.md`) and shows the appropriate welcome screen with the bird. First-time users get offered a guided walkthrough. This must happen before any design work begins.

**Specifically: do NOT invoke design-discovery, design-strategy, design-memory, design-state, design-taste, or any other Designpowers skill until the welcome sequence has completed.** The bird must appear. The user must see the greeting and the walkthrough offer. Only then can the pipeline begin. If any skill is invoked before the welcome, stop and run the welcome first.

## Skills

All design skills live in `skills/`. The entry point is `skills/using-designpowers/SKILL.md` which orchestrates the entire workflow. Never bypass it.

## Agents

Design agents live in `agents/`. They are invoked by the workflow — do not call them directly without going through the skill orchestration.

## v2: measure, don't assert (the truth layer)

Designpowers v2 adds a **truth layer**: some claims have a checkable answer, and
those must be **measured by a tool**, not asserted in prose. This is the line
between "looks accessible" (v1) and "2.19:1, FAIL AA" (v2).

- Colour contrast and WCAG AA/AAA pass/fail are **checkable** → obtain them from the
  `designpowers-accessibility` MCP server (`check_contrast` for one pair,
  `check_palette` for many). This server is wired in `.mcp.json`. Never estimate a
  contrast ratio from a hex value or a screenshot.
- Taste, craft, severity, who-is-affected, and the recommended fix are **judgment**
  → these stay prose, in the agent's own voice.
- Each agent's input/output boundary and the measure-don't-assert rule are defined
  once in the shared core at `core/agents/<id>/contract.md`, with the evidence shape
  in `core/schemas/evidence.schema.json`. When an agent reviews or produces colour,
  it follows its contract and returns the measured evidence verbatim. The agents
  whose contracts call the truth tools are: accessibility-reviewer (the reference),
  design-lead, design-builder, design-scout, and design-critic.

If `check_contrast` / `check_palette` are not available, say so and stop — do not
guess. An accessibility reviewer that estimates ratios is the exact failure v2
exists to prevent. Verify the tools are wired with the `/verify-accessibility-tools`
command before relying on them.

## Surfaces (same core, do not cross the streams)

This repo ships Designpowers through several surfaces over **one shared core**
(`agents/`, `skills/`, `core/`, `mcp-tools/`). This file (`CLAUDE.md`), `.mcp.json`,
`.claude/`, and `.claude-plugin/` are the **Claude Code** surface. The Antigravity
surface lives under `.agents/`; the Gemini ADK runner under `runners/`. Keep
surface-specific wiring in its own namespace — never put design judgment in a
surface; it belongs in the core. See `ARCHITECTURE.md`.
