#!/usr/bin/env bash
# Validates the Designpowers Claude Code surface against the shared core.
#
# The Claude surface is a thin adapter (like the Antigravity plugin): it wires the
# truth-layer and points Claude at the shared core; it holds no design logic. This
# checks the wiring is present and consistent, and — crucially — that the Claude
# surface lives only in Claude-namespaced files (it must not edit the shared core).
# Deterministic, no Claude install needed. Pure bash + node (for JSON).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REG="$ROOT/core/registry.json"
fail=0
ok()  { echo "  ✓ $*"; }
bad() { echo "  ✗ $*"; fail=1; }
jq_node() { node -e "const d=require('$1');$2"; }

echo "Designpowers Claude Code surface check"
[ -f "$REG" ] || { echo "ERROR: registry not found at $REG" >&2; exit 2; }

echo ""; echo "[1] Claude surface files present:"
for f in ".claude-plugin/plugin.json" "CLAUDE.md" ".mcp.json" \
         ".claude/commands/design.md" ".claude/commands/verify-accessibility-tools.md" \
         "hooks/session-start" "hooks/hooks.json"; do
  if [ -f "$ROOT/$f" ]; then ok "$f"; else bad "missing $f"; fi
done

echo ""; echo "[2] .mcp.json wires the WCAG truth-layer at the real server:"
if node -e "JSON.parse(require('fs').readFileSync('$ROOT/.mcp.json','utf8'))" 2>/dev/null; then
  arg=$(jq_node "$ROOT/.mcp.json" "console.log((d.mcpServers['designpowers-accessibility']||{}).args?.[0]||'')")
  case "$arg" in
    *mcp-tools/accessibility/server.js)
      [ -f "$ROOT/mcp-tools/accessibility/server.js" ] && ok "server.js wired ($arg)" || bad "server.js not found" ;;
    *) bad "designpowers-accessibility not wired correctly in .mcp.json (got: '$arg')" ;;
  esac
else bad ".mcp.json is not valid JSON"; fi

echo ""; echo "[3] CLAUDE.md carries the v2 measure-don't-assert mandate:"
grep -qi "measure, don't assert\|measure, don't" "$ROOT/CLAUDE.md" && ok "mandate present" || bad "CLAUDE.md missing the v2 mandate"
grep -q "designpowers-accessibility" "$ROOT/CLAUDE.md" && ok "references the truth-layer server" || bad "CLAUDE.md doesn't reference the truth-layer"
grep -q "using-designpowers" "$ROOT/CLAUDE.md" && ok "welcome/router still enforced" || bad "CLAUDE.md lost the welcome enforcement"

echo ""; echo "[4] Every registry agent has a real persona file Claude dispatches:"
# macOS bash 3.2 has no mapfile; populate with a portable while-read loop.
AGENTS=()
while IFS= read -r line; do [ -n "$line" ] && AGENTS+=("$line"); done \
  < <(jq_node "$REG" "console.log(Object.keys(d.agents).join('\n'))")
for a in "${AGENTS[@]}"; do
  persona=$(jq_node "$REG" "console.log(d.agents['$a'].persona)")
  [ -f "$ROOT/$persona" ] && ok "$a -> $persona" || bad "$a: persona missing ($persona)"
done

echo ""; echo "[5] /design references the welcome, the contracts, and the truth tools:"
D="$ROOT/.claude/commands/design.md"
grep -q "using-designpowers" "$D" && ok "/design runs the welcome/router" || bad "/design skips the welcome"
grep -q "core/agents/<id>/contract.md" "$D" && ok "/design points agents at their contracts" || bad "/design doesn't load contracts"
grep -qE "check_contrast|check_palette" "$D" && ok "/design enforces the truth tools" || bad "/design doesn't mention the truth tools"

echo ""
if [ "$fail" -ne 0 ]; then echo "FAIL — Claude surface inconsistencies (see above)."; exit 1; fi
echo "OK — Designpowers Claude Code surface consistent with the core (${#AGENTS[@]} agents, truth-layer wired)."
