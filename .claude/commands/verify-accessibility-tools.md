---
description: Confirm the Designpowers WCAG truth-layer is wired and returns measured evidence before relying on it.
---

# Verify accessibility tools

Confirm that the `designpowers-accessibility` MCP server is connected before any
agent relies on it. Do the following and report results plainly:

1. List your currently available MCP tools. Confirm that **`check_contrast`** and
   **`check_palette`** are present (from the `designpowers-accessibility` server
   wired in `.mcp.json`).
   - If they are missing: the MCP server is not connected. Tell the user to check
     that `.mcp.json` is approved (Claude Code prompts to enable project MCP
     servers on first use) and that `npm install` was run in
     `mcp-tools/accessibility/`. Do NOT proceed to estimate contrast.

2. Call `check_contrast` with `{ "foreground": "#9aa0a6", "background": "#e8eaed", "label": "Save button" }`.
   - Confirm the measured ratio is **2.19:1** and **`passAA` is false**.

3. Report: "VERIFY OK — Claude sees the Designpowers truth-layer and returns
   measured evidence (Save button = 2.19:1, FAIL AA)." — or the specific failure.

A green result here means every truth-tool-using agent (accessibility-reviewer,
design-lead, design-builder, design-scout, design-critic) will get real
measurements, not guesses.
