# Verify accessibility tools

Confirm that Antigravity has loaded the Designpowers truth-layer before relying on
it (run this before the demo, on stage if needed).

Do the following and report results plainly:

1. List your currently available MCP tools. Confirm that **`check_contrast`** and
   **`check_palette`** are present (from the `designpowers-accessibility` server).
   - If they are missing: the MCP server is not wired. Tell the user to check
     `SETUP.md` (the `<DESIGNPOWERS_ROOT>` path in `mcp_config.json`) and that the
     plugin was discovered. Do NOT proceed to estimate contrast.

2. Call `check_contrast` with `{ "foreground": "#9aa0a6", "background": "#e8eaed", "label": "Save button" }`.
   - Confirm the measured ratio is **2.19:1** and **`passAA` is false**.

3. Report: "VERIFY OK — Antigravity sees the Designpowers truth-layer and returns
   measured evidence (Save button = 2.19:1, FAIL AA)." — or the specific failure.

This is the same handshake the host performs; a green result here means the
accessibility-critic Skill will get real measurements, not guesses.
