# Conformance scenarios (anti-drift)

> **The cross-surface suite is BUILT** (`scripts/conformance.mjs`, CI:
> `check-conformance.yml`). It runs every scenario here against **every surface's**
> truth-layer wiring — the Antigravity plugin (`mcp_config.json`), the Claude Code
> surface (`.mcp.json`), and the registry-canonical wiring — over real MCP/stdio,
> and asserts the measured evidence is **byte-identical** across all of them. If a
> surface ever drifts, CI fails. (Verified to actually catch drift, not just pass.)
> See `ARCHITECTURE.md` → "Anti-drift via conformance".

## Scenarios

One per measured dimension (each pins the tool it names):

| Scenario | Tool | Agent |
|----------|------|-------|
| `accessibility-critic.contrast.json` | `check_palette` | accessibility-critic |
| `content-writer.reading-level.json` | `check_reading_level` | content-writer |
| `heuristic-evaluator.touch-target.json` | `check_touch_targets` | heuristic-evaluator |
| `motion-designer.motion-safety.json` | `check_motion_safety` | motion-designer |

Add a scenario: drop a JSON file here (with a `tool`, `input`, and
`expected_evidence`), and reference it from the agent's `conformance` array in
`core/registry.json`. The suite discovers it automatically.

## Why this exists

Two runners performing "the same" agent will drift apart unless something pins
them together. Designpowers' answer is built into the v2 thesis: agents return
**evidence**, and evidence is deterministic. So we pin the part that must not vary
— feed every runner the same input and assert the **evidence** out is identical.
The prose (summary, fix wording) is judgment and may differ; the measured facts
may not.

## Scenario format

Each scenario is input → expected evidence:

```json
{
  "scenario": "accessibility-critic/contrast-low",
  "agent": "accessibility-critic",
  "input": { "pairs": [ ... ] },
  "expected_evidence": {
    "tool": "check_palette",
    "assertions": [
      { "label": "Save button", "path": "ratio", "equals": 2.19 },
      { "label": "Save button", "path": "passAA", "equals": false }
    ]
  }
}
```

- `input` — exactly what the agent receives.
- `expected_evidence.assertions` — facts that MUST appear in the agent's
  `tool_calls` (the truth fields of the evidence envelope), regardless of runner.
  `label` selects which tool result to check; `path`/`equals` assert one field.

## What the suite will do (when built)

For every scenario × every runner:

1. Run the agent (or, deterministically, its tool path) on `input`.
2. Pull the `tool_calls` / `evidence` from the resulting envelope.
3. Assert every `expected_evidence` assertion holds.
4. A runner whose evidence diverges has drifted — fail the build.

The Gemini runner already exercises this for the accessibility critic in
`runners/gemini/tests/test_evidence_path.py`, which reads this scenario and
asserts the measured evidence. That test is the seed the shared harness grows
from.
