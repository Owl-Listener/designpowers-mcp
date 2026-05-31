# `runners/claude/` — Claude Agent SDK runner (planned, NOT built yet)

This is a **placeholder**. The Claude Agent SDK runner is the *second* native
adapter and is intentionally not built in the current slice — see
`../../ARCHITECTURE.md` ("Why Gemini ADK is the reference build").

When it is built, it will follow the exact same thin-adapter contract as
`runners/gemini/`:

1. **Load** the same agent definitions from the shared `core/` (registry →
   contract + persona). No persona prose or judgment is re-authored here.
2. **Wire** the same `mcp-tools/` truth-layer servers (already MCP, so portable —
   the WCAG server runs unchanged).
3. **Run** the agent on the Claude Agent SDK.

Building it unlocks the **anti-drift conformance suite**: the same scenarios in
`core/conformance/` run against both runners, asserting identical *evidence* out
for identical input. Until a second runner exists there is nothing to compare, so
the suite waits (see `core/conformance/README.md`).

**Do not add design logic here.** If a runner ever needs judgment, that judgment
belongs in the core.
