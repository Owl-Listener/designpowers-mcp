# `core/` — the v2 formalization overlay

This directory is the **v2 overlay** on the Designpowers shared core. The core
itself — the prose personas (`agents/`), the pipeline (`skills/`), and the truth
layer (`mcp-tools/`) — lives at the repository root and is **unchanged**. `core/`
adds the machine-readable contracts that let multiple runners perform the same
agents without drifting.

> **Single source of truth.** Everything here is loaded by runners; runners hold
> no design logic of their own. See `../ARCHITECTURE.md` for the full picture.

## Contents

| Path | What it is |
|------|------------|
| `registry.json` | The manifest a runner reads: agents, their contract/persona/schema, and the MCP servers each needs. The entry point. |
| `agents/<id>/contract.md` | An agent's **one contract** — inputs, the measure-don't-assert rule, and the output evidence envelope. Points back to the root persona for judgment. |
| `schemas/evidence.schema.json` | The evidence envelope every agent returns. Splits *judgment* fields (may vary by runner) from *truth* fields (must be identical). |
| `conformance/` | Anti-drift scenarios (input → expected evidence) and the note on the deferred cross-runner suite. |

## How a runner uses this

1. Read `registry.json`.
2. For the target agent, read its `contract.md` and the `persona` it references
   (e.g. `agents/accessibility-reviewer.md`) — these become the model's
   instruction.
3. Wire the agent's `mcp_servers` (e.g. `designpowers-accessibility`) into the
   framework as tools.
4. Run. The agent calls the tools for truth and returns the evidence envelope.

The reference implementation is `runners/gemini/`.
