# Designpowers v2 Architecture

> **Status:** v2 in progress. **Primary surface = Google Antigravity** (Skills +
> the MCP truth-layer, orchestrated by Antigravity). All ten agents are built as
> an Antigravity **plugin** at `.agents/plugins/designpowers/`, each a thin Skill
> over the shared core. The **Google ADK runner** (`runners/gemini/`) is now a
> **secondary** standalone surface — kept, not expanded. See "Distribution
> surfaces" below.

## Distribution surfaces (which thing runs where)

Designpowers v2 ships the *same* shared core through more than one surface. The
core is the single source of truth; each surface is a thin adapter.

| Surface | Status | What it is | Runs inside Antigravity? |
|---------|--------|-----------|--------------------------|
| **Antigravity plugin** (`.agents/plugins/designpowers/`) | **PRIMARY** | The ten agents as **Skills** + 36 process-skill pointers, an always-on **rule** (the mandate), a **hook** (`hooks.json` → welcome gate), and `mcp_config.json` wiring the WCAG truth-layer. The `/design` + `/verify-accessibility-tools` **workflows** live at `.agents/workflows/` (workflows aren't a plugin component). | **Yes** — this is the point. |
| **MCP truth-layer** (`mcp-tools/`) | Durable asset | The WCAG contrast server. Reused **as-is** by every surface. | Yes (loaded via MCP). |
| **ADK runner** (`runners/gemini/`) | **SECONDARY** | A standalone Google ADK program. **Kept, frozen — do not expand.** | **No** — ADK apps run standalone; Antigravity won't execute them. |

> **Why the pivot.** ADK apps are standalone programs that *drive* agents from the
> outside — Antigravity won't execute them. The path that genuinely runs *inside*
> Antigravity is its own first-class extension surfaces: **Skills + rules +
> workflows + MCP**. So the primary surface moved there. The ADK runner stays as a
> non-Antigravity reference; the durable asset — the MCP truth-layer — is shared by
> both unchanged.

## The verified Antigravity mechanism

> **Verification note (be honest about this):** the official docs at
> `antigravity.google/docs/*` returned HTTP 403 to the build environment's fetcher,
> so the specifics below are corroborated across multiple independent secondary
> sources **and** the directory/format details the user pasted from the docs —
> *not* read directly from a single primary page in-session. Anything that can only
> be confirmed by the running host is marked **[confirm at checkpoint]** and is
> exactly what the on-machine VERIFY step in `SETUP.md` exists to prove.

How Antigravity expresses each thing we use:

- **Plugins** bundle extensions into one auto-discovered package: a `plugin.json`
  marker plus optional `skills/`, `rules/`, `mcp_config.json`, `hooks.json`.
  Discovered at workspace `.agents/plugins/` (or `_agents/plugins/`) and globally
  at `~/.gemini/config/plugins/`. Designpowers ships as exactly one such plugin.
- **Skills** are directories with a `SKILL.md`: YAML frontmatter `name` (must match
  the folder, lowercase-hyphen), `description` (drives when the agent activates),
  and optional `tools`. The agent loads a Skill only when relevant.
- **Rules** (`.agents/rules/` or a plugin's `rules/`) are Markdown treated as
  persistent system instructions — used here for the always-on mandate.
- **Workflows** (`.agents/workflows/`) are saved prompts triggered with `/` — used
  here for `/design` (orchestration) and `/verify-accessibility-tools`. Note:
  workflows are **not** a plugin component (a plugin bundles only Skills, Rules, MCP
  servers, and Hooks), so they live at the workspace `.agents/workflows/` level.
- **Hooks** (`hooks.json` in the plugin) run scripts at execution-loop events. The
  `PreInvocation` event can `injectSteps` before the model is called — used here to
  fire the welcome/router deterministically on a conversation's first invocation
  (the Antigravity equivalent of a SessionStart hook).
- **MCP** loads from `mcp_config.json` (`mcpServers` → `command`/`args`), shared
  across IDE/CLI, auto-reloaded. Our WCAG server drops in unchanged.
- **Agents / orchestration:** Antigravity's orchestrator **spawns subagents
  dynamically at runtime** via `invoke_subagent` / `define_subagent` tools — you do
  **not** statically define named sub-agents in a file. (Confirmed in the official
  hooks tool list.) This is the key mechanism finding, and it shapes the model
  below: the durable unit is the Skill; the `/design` workflow asks for parallel
  reviewers and the host spawns them.

### What this means for "10 agents"

Because there is no static per-agent definition file, the durable, version-
controlled unit each agent maps to is a **Skill**, not a "sub-agent." So:

- **Each of the ten agents = one Skill** (`.agents/plugins/designpowers/skills/<id>/SKILL.md`),
  a thin adapter that loads its persona (`agents/<id>.md`) + contract
  (`core/agents/<id>/contract.md`) from the shared core and declares the truth
  tools it may call.
- **Orchestration = the `/design` workflow**, which sequences the agents through
  the inclusive-design pipeline, director-driven (the user approves handoffs).
- **Runtime parallelism** (e.g. the three reviewers running at once) comes from
  Antigravity's dynamic subagents — the workflow asks for it; the host provides it.

This is "prose for judgment, real tools for truth" expressed natively in
Antigravity: judgment stays in the core personas; checkable claims (contrast) route
to the MCP truth-layer; the Skill is only the wiring.

## The thesis: prose for judgment, real tools for truth

Designpowers v1 is a "studio" of ten prose-persona agents — Markdown a model
*performs* (`agents/*.md`, orchestrated by `skills/`). That prose encodes
**judgment**: taste, craft, strategy, what-affects-whom. Judgment is the right
job for a persona, and it stays prose.

But some of what those personas assert has a **checkable answer**. "This is
accessible" is not a matter of taste when it comes to colour contrast — it is a
number with a pass/fail threshold. v1 *asserts* it. v2 *measures* it.

The proof already in the tree is `mcp-tools/accessibility/` — a WCAG 2.2 contrast
checker exposed as an MCP server. It does not say "looks fine"; it says
`2.19:1, FAIL AA`. That is the **truth layer**.

So v2 has two kinds of thing, and keeps them apart on purpose:

| | What it is | Where it lives | Form |
|---|---|---|---|
| **Judgment** | taste, craft, severity, who-is-affected, the fix | the prose personas + pipeline | Markdown (model-agnostic) |
| **Truth** | measured, checkable facts (contrast now, more later) | `mcp-tools/` | MCP servers (deterministic code) |

An agent's narrative is judgment; the facts it cites must come from a tool.

## Shape: fat shared core, thin native adapters

```
                         ┌───────────────────────────────────────────────┐
                         │                 SHARED CORE                     │
                         │            (single source of truth)             │
                         │                                                 │
                         │  knowledge / agent definitions / the pipeline   │
                         │    agents/*.md      (prose personas — judgment) │
                         │    skills/*         (the design process)        │
                         │    core/            (v2 formalization:          │
                         │       agents/<id>/contract.md  — the contract   │
                         │       schemas/evidence.schema.json              │
                         │       registry.json — what runners load         │
                         │       conformance/  — anti-drift scenarios)     │
                         │                                                 │
                         │  mcp-tools/         (the truth layer — already  │
                         │       accessibility/ (WCAG)   MCP, so portable) │
                         └───────────────────────────────────────────────┘
                                   ▲                         ▲
                  loads core, wires │                         │ loads the SAME core,
                  MCP, runs pipeline│                         │ wires the SAME MCP
                                   │                         │
                ┌──────────────────┴───────┐   ┌─────────────┴──────────────┐
                │   runners/gemini/         │   │   runners/claude/          │
                │   Google ADK   (BUILT)    │   │   Claude Agent SDK (LATER) │
                │   thin: load + wire + run │   │   thin: load + wire + run  │
                └───────────────────────────┘   └────────────────────────────┘
```

### SHARED CORE — the single source of truth

Everything that constitutes *what Designpowers knows and does* lives here, once:

- **Prose, personas, process** — `agents/` (the ten personas) and `skills/` (the
  pipeline). Unchanged from v1; this is the judgment layer.
- **`mcp-tools/`** — the truth layer. Already speaks the Model Context Protocol,
  so it is portable to any MCP-speaking runner with zero per-runner code.
- **`core/`** — the v2 formalization that turns "a persona a model performs" into
  "a contract a runner honors":
  - `core/registry.json` — the manifest a runner reads: which agents exist, where
    each agent's contract / persona / evidence schema live, and which MCP servers
    it needs. **A runner reads this instead of hard-coding anything.**
  - `core/agents/<id>/contract.md` — the agent's one contract (see below).
  - `core/schemas/evidence.schema.json` — the shape of the evidence envelope every
    agent returns.
  - `core/conformance/` — the anti-drift scenarios (see below).

> **Layout decision (recorded):** the v1 `agents/`, `skills/`, and `mcp-tools/`
> stay at the repo root and *are* the shared core in place — `core/` is an overlay
> that adds the v2 contracts/registry/schema/conformance without moving anything.
> This keeps the working v1 Claude plugin (`.claude-plugin/`, `CLAUDE.md`) and
> Gemini extension (`gemini-extension.json`, `GEMINI.md`) loading from root, so v2
> can be built incrementally without breaking what ships today.

### NATIVE ADAPTERS (runners) — thin, orchestration only

A runner is the glue between the core and one agent framework. It does exactly
three things:

1. **Load** agent definitions from the core (registry → contract + persona).
2. **Wire** the MCP servers the agent needs (the truth layer) into that framework.
3. **Run** the pipeline / agent in that framework's runtime.

Nothing else. A runner is the *only* place framework-specific code lives, and it
holds **no design logic of its own**.

- `runners/gemini/` → **Google ADK**. **Built first** (the reference build).
- `runners/claude/` → **Claude Agent SDK**. Planned second. **Not built yet.**

## The rules that must hold

### 1. Fat core, thin adapters — no design logic in a runner

If you are tempted to put judgment in `runners/` — a severity rule, a heuristic,
copy, a threshold — it belongs in the core. The litmus test: *delete a runner and
the design knowledge is untouched; delete the core and the runners know nothing.*

Concretely, in the Gemini runner the persona prose is **read from the core at
runtime** (`agents/accessibility-reviewer.md` + `core/agents/accessibility-critic/contract.md`)
and handed to the model as its instruction. The runner does not paraphrase or
embed it. The MCP server command comes from `core/registry.json`, not from runner
code.

### 2. One contract per agent — defined in the core, honored by every runner

Each agent has exactly **one contract** (`core/agents/<id>/contract.md`) that
fixes its inputs and outputs:

- **Inputs** — the artefact under review (colour pairs, a `DESIGN.md` palette, a
  screenshot) plus context (text sizes, labels, the task).
- **Behavioural rule** — *every checkable claim must be backed by a tool result.*
  The accessibility critic may never state a contrast ratio it did not get from
  the WCAG MCP tool.
- **Outputs** — the **evidence envelope** (`core/schemas/evidence.schema.json`):
  a verdict, findings (each with severity, who-is-affected, and a fix), and — the
  load-bearing part — the **verbatim tool evidence** behind every finding.

Both runners must accept the same inputs and emit the same envelope. The narrative
fields are judgment and may differ in wording between runners; the **evidence
fields are truth and must be identical**.

### 3. Anti-drift via conformance (planned — do **not** build the suite yet)

Two runners performing "the same" agent will drift unless something pins them
together. Because agents return **evidence**, we can check the part that must not
vary: feed both runners the same scenario input and assert the **evidence** out is
identical (the prose may differ; the measured facts may not).

- Scenarios live in `core/conformance/scenarios/` as input → expected-evidence
  pairs. One is included as the format-defining example
  (`accessibility-critic.contrast.json`).
- The plan: a shared conformance harness runs every scenario against **every**
  runner and asserts the evidence matches. The Gemini runner already ships a
  deterministic test that exercises this for the accessibility critic
  (`runners/gemini/tests/test_evidence_path.py`); it is the seed of the suite.
- **The full cross-runner suite is intentionally deferred** until the Claude
  runner exists — there is nothing to compare against yet. This section is the
  note that it is coming; the build happens when the second runner lands.

## Why Gemini ADK is the reference build

- **It forces model-agnosticism early.** Building the *second*-most-obvious runner
  (not Claude) first means the core cannot quietly accumulate Claude-isms. If the
  accessibility critic works on Gemini with the same core and the same MCP tool,
  the "model-agnostic by construction" claim is proven, not asserted.
- **ADK speaks MCP natively.** `MCPToolset` wires a stdio MCP server into an agent
  with no shim, so the truth layer plugs in directly — exactly the thin-adapter
  story.
- **The truth tool it needs already exists.** The WCAG MCP server is in the tree
  and tested, so the accessibility critic can be built end-to-end *today* —
  vertical slice over horizontal scaffolding.
- **It exploits Gemini's strengths.** Native vision lets the critic take a
  screenshot and propose candidate colour pairs; large context lets it ingest a
  whole `DESIGN.md` palette at once. In both cases vision/context only *proposes*
  what to check — the MCP tool still supplies the measured truth.

## Current slice (this PR)

One vertical slice, end to end:

- **Core overlay:** `core/registry.json`, `core/schemas/evidence.schema.json`,
  `core/agents/accessibility-critic/contract.md`, and a first conformance scenario.
- **Gemini runner:** `runners/gemini/` — a thin Google ADK adapter that loads the
  accessibility-critic contract + persona from the core, wires the WCAG MCP server,
  and runs the agent. It **calls** the tool for evidence; it does not narrate
  contrast.
- **Proof without a key:** the evidence path is verified deterministically (no LLM
  call needed). A live one-shot entrypoint is provided for when a Gemini API key
  is present.

Deliberately **not** in this slice: the other nine agents, the Claude runner, and
the full conformance suite. See the rules above for why each waits.
