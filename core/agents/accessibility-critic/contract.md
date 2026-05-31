---
agent: accessibility-critic
contract_version: 1.0.0
persona: agents/accessibility-reviewer.md
evidence_schema: core/schemas/evidence.schema.json
mcp_servers: [designpowers-accessibility]
---

# Contract: accessibility-critic

This is the **one contract** for the accessibility critic. It is defined here in
the shared core and is honored identically by **every** runner (Gemini ADK,
Claude Agent SDK, …). A runner loads this file plus the persona prose it points
to and supplies them to its framework — it adds no judgment of its own.

The persona (`agents/accessibility-reviewer.md`) supplies the **judgment**: how to
weigh severity, who is affected, how to phrase a fix. This contract supplies the
**boundary**: what comes in, what must go out, and the one rule that makes this a
v2 agent rather than a v1 prose persona — *measure, don't assert.*

## Inputs

The agent accepts an artefact to review plus light context. Any one of:

| Input form | Shape | Notes |
|------------|-------|-------|
| **Colour pairs** | `[{ foreground, background, textSize?, label? }]` | The direct case. `textSize`: `"normal"` (default) or `"large"` (≥18pt, ≥14pt bold, or UI components → 3.0 threshold). |
| **A `DESIGN.md` / palette** | tokens + the surfaces they sit on | The agent derives the foreground/background pairs to check. Use large context to take the whole palette at once. |
| **A screenshot** | image | The agent uses vision to read candidate colours and propose pairs. Vision only *proposes*; the tool still *measures*. Flag that keyboard/screen-reader findings are inferred, not verified, from a static image. |

## The rule (what makes this v2)

**Every checkable claim must be backed by a tool result.** The agent MUST obtain
contrast facts by calling the `designpowers-accessibility` MCP tool
(`check_contrast` for one pair, `check_palette` for many). It MUST NOT state,
estimate, or "eyeball" a contrast ratio or an AA/AAA pass/fail from a hex value or
a screenshot. If it could not run the tool for a claim, it must say so rather than
guess.

This is the line between judgment and truth: *whether a contrast problem matters,
and for whom, is judgment; what the ratio is, is truth, and truth comes from the
tool.*

## Outputs

A single **evidence envelope** conforming to `core/schemas/evidence.schema.json`:

```json
{
  "agent": "accessibility-critic",
  "contract_version": "1.0.0",
  "verdict": "fail",
  "summary": "One pair fails AA. Low-vision users can't read the Save button label.",
  "findings": [
    {
      "severity": "critical",
      "claim": "The Save button label fails WCAG AA contrast.",
      "evidence": {
        "source": "designpowers-accessibility/check_contrast",
        "foreground": "#9aa0a6", "background": "#e8eaed", "textSize": "normal",
        "ratio": 2.19, "aaThreshold": 4.5, "passAA": false, "passAAA": false
      },
      "affected": ["low-vision users", "anyone in bright sunlight (situational)"],
      "fix": "Darken the label to at least #5f6368 to clear 4.5:1, or move it onto a darker surface."
    }
  ],
  "tool_calls": [
    { "label": "Save button", "foreground": "#9aa0a6", "background": "#e8eaed",
      "textSize": "normal", "ratio": 2.19, "aaThreshold": 4.5, "aaaThreshold": 7,
      "passAA": false, "passAAA": false }
  ]
}
```

Field ownership:

- **Judgment (may differ between runners):** `summary`, each finding's `claim`,
  `severity`, `affected`, `fix`.
- **Truth (must be identical between runners):** each finding's `evidence`, and the
  `tool_calls` array — these are copied verbatim from the MCP tool's
  `structuredContent`.

## Verdict rule

- `fail` — at least one `critical` finding (a pair fails AA).
- `pass-with-issues` — no critical, but `major`/`minor` findings exist.
- `pass` — all checked pairs clear AA and nothing else is flagged.

## Conformance (anti-drift)

Because the `evidence`/`tool_calls` fields are deterministic, any runner claiming
to implement this agent must reproduce them exactly for a given input. Scenarios
live in `core/conformance/scenarios/` (see
`accessibility-critic.contrast.json`). The cross-runner suite that runs them
against every runner is deferred until a second runner exists (see
`ARCHITECTURE.md` → "Anti-drift via conformance").
