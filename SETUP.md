# Designpowers in Antigravity — local setup & VERIFY

Copy-paste setup to run the Designpowers studio **inside Google Antigravity**, plus
a VERIFY step that proves Antigravity sees the truth-layer tools **before** you're
on stage. Reliability is the goal: same result every time.

> **Status of this slice:** ships the reference agent — the **accessibility
> critic** — as an Antigravity plugin. The other nine agents follow after the
> checkpoint. The end-to-end studio demo (return-flow) is a later PR.

---

## 0. Prerequisites

| Tool | Version used to build this | Your machine |
|------|----------------------------|--------------|
| **Antigravity** | _(confirm — paste your version)_ | `Antigravity → About` |
| **Node.js** | v22.x (tested on v22.22) | `node --version` |
| **Python** | 3.11 (only for the *secondary* ADK runner; NOT needed for Antigravity) | `python3 --version` |
| **git** | any | `git --version` |

Antigravity itself only needs **Node** (the truth-layer MCP server is Node). Python
is only for the secondary `runners/gemini/` ADK surface and is not part of the
Antigravity path.

> ⚠️ **Fill in the Antigravity version above before the workshop.** The exact
> menu/click path for "Manage MCP Servers" can differ slightly by version; this
> runbook is written against the plugin auto-discovery mechanism, which is stable.

---

## 1. Get the repo

```bash
git clone https://github.com/Owl-Listener/designpowers-mcp.git
cd designpowers-mcp
```

---

## 2. Run the automated setup (recommended)

One script does everything: installs the truth-layer's Node deps, injects this
repo's absolute path into the plugin's MCP config, asks whether to install the
plugin locally or globally, and runs the validation + a live MCP handshake so you
see green **before** opening Antigravity. Portable across macOS (bash 3.2) and Linux.

> **One prerequisite: Node.js** (v18+, tested on 22). The truth-layer is a small
> local Node server, so Node must be installed. If you don't have it, grab the LTS
> installer from [nodejs.org](https://nodejs.org) (~2 min) — `setup.sh` detects a
> missing/old Node and prints exact, OS-specific install steps, so you can run it
> first to check.

```bash
bash scripts/setup.sh
```

Expect it to finish with **"All green"** and the measured handshake
(`2.19:1, FAIL AA`). Then skip to step 4 (VERIFY) / step 3 (load the plugin).

<details>
<summary><b>Manual setup (if you'd rather do it by hand)</b></summary>

```bash
# install the WCAG truth-layer (a Node MCP server)
cd mcp-tools/accessibility && npm install && npm test && cd ../..

# fill the absolute repo path into the plugin's MCP config
# (Antigravity launches the server from an unspecified cwd, so the path must be absolute)
ROOT="$(pwd)"
sed -i.bak "s|<DESIGNPOWERS_ROOT>|$ROOT|g" .agents/plugins/designpowers/mcp_config.json
cat .agents/plugins/designpowers/mcp_config.json   # confirm the path is now absolute
```

`sed -i.bak` works on both macOS (BSD sed) and Linux (GNU sed).
</details>

macOS/Linux: the above works as-is. (On Windows, set the path by hand — use forward
slashes, e.g. `C:/Users/you/designpowers-mcp/mcp-tools/accessibility/server.js`.)

The result should look like:

```json
{
  "mcpServers": {
    "designpowers-accessibility": {
      "command": "node",
      "args": ["/absolute/path/to/designpowers-mcp/mcp-tools/accessibility/server.js"]
    }
  }
}
```

---

## 3. Make Antigravity load the plugin

The plugin lives at `.agents/plugins/designpowers/`. Antigravity auto-discovers
plugins in two places — pick one:

- **Workspace (recommended for the demo):** open the `designpowers-mcp` repo as
  your Antigravity workspace. The plugin is found automatically at
  `.agents/plugins/designpowers/`.
- **Global (use across workspaces):** copy the folder out:
  ```bash
  mkdir -p ~/.gemini/config/plugins
  cp -R .agents/plugins/designpowers ~/.gemini/config/plugins/
  ```
  (If you go global, make sure step 2's absolute path still points at where the
  repo's `mcp-tools/` actually lives.)

Antigravity auto-reloads MCP config — no restart needed. If in doubt, reopen the
workspace.

---

## 3.5 Pre-allow the truth-layer tools (so the demo never pauses)

By default Antigravity treats **MCP tool calls as `Ask`** — the first time the
accessibility critic calls `check_contrast`, the editor will pause and prompt you
for approval. That's fine day-to-day, but on stage you want it to *just run*.

Pre-approve the Designpowers truth-layer once, in **Agent Settings → Customizations
→ Permissions**, by adding to the **Allow** list:

```
mcp(designpowers-accessibility/*)
```

This auto-approves both `check_contrast` and `check_palette` (and any future tool
on that server) without prompting. Leave everything else at its default (`Ask`) —
this grants only the read-only WCAG tools, nothing else.

> If you'd rather approve interactively the first time, you can: when the prompt
> card appears, click **Allow**. But for a repeatable workshop, the pre-allow above
> removes the one mid-demo interruption.

---

## 4. VERIFY (do this before the demo)

**A. Quick, outside Antigravity** — the raw MCP handshake Antigravity performs:

```bash
# from the repo root
node mcp-tools/accessibility/verify-mcp.mjs node mcp-tools/accessibility/server.js
```

Expect:

```
  ✓ initialize — server speaks MCP over stdio
  ✓ tools/list — advertises: check_contrast, check_palette
  ✓ tools/call check_contrast — MEASURED 2.19:1, passAA=false (FAIL AA, as expected)
VERIFY OK — Antigravity will see these tools and get this measured evidence.
```

**B. Inside Antigravity** — prove the agent surface sees the tools. In the
Antigravity agent panel, run the workflow:

```
/verify-accessibility-tools
```

It lists the available MCP tools, confirms `check_contrast` + `check_palette` are
present, calls `check_contrast` on the canonical pair, and reports
**`2.19:1, FAIL AA`**. If the tools are missing, it tells you to recheck the
`<DESIGNPOWERS_ROOT>` path — it will **not** fall back to guessing.

---

## 5. Run the reference agent

In Antigravity, ask the accessibility critic to review a pair or a palette, e.g.:

> "Use the accessibility-critic skill to check the Save button: label #9aa0a6 on
> background #e8eaed."

You should get a **measured** verdict (2.19:1, FAIL AA), a named affected group,
and a specific fix — with the ratio coming from the tool, not an estimate.

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| Tools not listed in Antigravity | The `<DESIGNPOWERS_ROOT>` placeholder wasn't replaced, or points at the wrong path. Re-run step 2; confirm the path in `mcp_config.json` exists. |
| `node: command not found` when the server starts | Node isn't on Antigravity's PATH. Install Node 22 and reopen Antigravity. |
| Agent estimates a ratio instead of calling the tool | The mandate rule wasn't loaded — confirm the plugin was discovered (workspace `.agents/plugins/` or global `~/.gemini/config/plugins/`). |
| `npm test` fails | Ensure Node 22; run `npm install` in `mcp-tools/accessibility` first. |
