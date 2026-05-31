# Conformance scenarios (anti-drift)

> **The full cross-runner suite is intentionally not built yet.** There is only
> one runner today (Gemini ADK), so there is nothing to compare it against. This
> directory holds the *format* and the *first scenario* so the shape is fixed; the
> harness that runs every scenario against every runner lands with the second
> runner (Claude Agent SDK). See `ARCHITECTURE.md` → "Anti-drift via conformance".

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
