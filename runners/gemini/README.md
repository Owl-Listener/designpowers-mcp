# `runners/gemini/` — Designpowers Gemini runner (Google ADK)

The **reference** native adapter for Designpowers v2. It is *thin*: it loads agent
definitions from the shared `core/`, wires the `mcp-tools/` truth layer into Google
ADK, and runs. **No design logic lives here** — all judgment is in the core. See
`../../ARCHITECTURE.md`.

## What it does

```
core/registry.json ──► core.py  (load contract + persona + MCP server defs)
                          │
                          ├─► mcp.py    wraps each MCP server as an ADK MCPToolset (stdio → node)
                          └─► agent.py  LlmAgent(instruction = persona + contract, tools = [toolset])
```

The one agent built in this slice is the **accessibility critic**. Its persona
(judgment) is read from `agents/accessibility-reviewer.md` and its contract
(inputs / the measure-don't-assert rule / the evidence envelope) from
`core/agents/accessibility-critic/contract.md`. The runner concatenates them into
the model instruction — it does not author behaviour.

It **calls** the WCAG MCP tool for contrast facts rather than narrating them, and
returns the evidence envelope (`core/schemas/evidence.schema.json`). It uses a
vision-capable, large-context Gemini model so it can read colours off a screenshot
or ingest a whole `DESIGN.md` palette — but vision/context only *proposes* what to
check; the tool supplies the measured truth.

## Install

```bash
cd runners/gemini
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt          # google-adk + mcp + pytest

# the truth layer is Node:
cd ../../mcp-tools/accessibility && npm install
```

## Run

```bash
cd runners/gemini

# Show what's wired (no API key needed) — proves the adapter loaded the core:
python -m designpowers_gemini

# Live one-shot review (needs a Gemini API key):
GOOGLE_GENAI_USE_VERTEXAI=FALSE GOOGLE_API_KEY=... python -m designpowers_gemini --review

# Or via the ADK CLI (root_agent is exposed):
GOOGLE_API_KEY=... adk run designpowers_gemini
```

Model selection: defaults to `gemini-2.5-pro` (vision + large context, per the
agent's `model_hints` in the core registry). Override with `GEMINI_MODEL`.

## Test

```bash
cd runners/gemini
pytest -q
```

- `tests/test_evidence_path.py` — **the proof.** Deterministic, no LLM/key. Wires
  the MCP server like the runner does and asserts the conformance scenario's
  measured evidence (e.g. the Save button is `2.19:1`, FAIL AA). This is the seed
  of the cross-runner anti-drift suite.
- `tests/test_agent_wiring.py` — asserts the runner composed the agent from the
  core (persona + contract as instruction, MCP toolset wired) and added no design
  logic of its own.
