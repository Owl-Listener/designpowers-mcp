# Designpowers — Antigravity plugin

This directory is the **Antigravity plugin** form of Designpowers — the *primary*
v2 distribution surface (Skills + the MCP truth-layer, orchestrated by
Antigravity). It is a **thin adapter**: it holds no design judgment, only the
wiring that points Antigravity at the shared core in the repository.

See `../../../ARCHITECTURE.md` for the full picture and the three surfaces.

## What's here (Antigravity plugin layout)

```
designpowers/
├── plugin.json        # marker — identifies this dir as a plugin
├── mcp_config.json    # wires the WCAG truth-layer MCP server (truth)
├── rules/
│   └── designpowers-mandate.md   # always-on: "measure, don't assert" + core pointers
├── skills/
│   └── accessibility-critic/
│       └── SKILL.md   # the reference agent (loads persona+contract from core/)
└── workflows/
    └── verify-accessibility-tools.md   # /verify the tools are wired before the demo
```

Each Designpowers agent is a Skill under `skills/`; each Skill loads its persona
(`agents/<name>.md`) and contract (`core/agents/<id>/contract.md`) from the shared
core at runtime. The current slice ships **one** agent — the accessibility critic
— as the canonical pattern. The other nine follow after the checkpoint.

## Install

Antigravity auto-discovers plugins in either location:

- **Workspace:** this lives at `.agents/plugins/designpowers/` in the repo, so it
  loads whenever you open this repo as your Antigravity workspace.
- **Global:** copy the `designpowers/` folder into `~/.gemini/config/plugins/` to
  use it across workspaces.

One required edit: set the absolute `<DESIGNPOWERS_ROOT>` path in
`mcp_config.json`. `SETUP.md` (repo root) has the copy-paste one-liner and the
VERIFY step.
