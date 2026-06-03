#!/usr/bin/env bash
# Validates the Designpowers Antigravity plugin against the shared core.
#
# Proves (deterministically, no Antigravity needed) that the plugin is internally
# consistent — the structural half of "works flawlessly in Antigravity." The other
# half (the host actually loading it) is the on-machine VERIFY in SETUP.md.
#
# Checks:
#   1. plugin.json + mcp_config.json + the mandate rule exist
#   2. every registry agent has a contract.md and a persona .md in the core
#   3. every registry agent has a plugin Skill whose SKILL.md `name` matches its folder
#   4. every plugin Skill maps to a real registry agent (no orphan Skills)
#   5. Skills that declare `tools:` only declare tools the MCP server advertises
#   6. mcp_config.json references the real server file
#   7. the orchestration + verify workflows exist
# Pure bash + node (for JSON); no extra deps. Exits non-zero on any problem.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN="$ROOT/.agents/plugins/designpowers"
REG="$ROOT/core/registry.json"
fail=0
note() { echo "  $*"; }
ok()   { echo "  ✓ $*"; }
bad()  { echo "  ✗ $*"; fail=1; }

echo "Designpowers Antigravity plugin check"
[ -f "$REG" ] || { echo "ERROR: registry not found at $REG" >&2; exit 2; }

# Helper: read JSON via node
jq_node() { node -e "const d=require('$1');$2"; }

# Note: macOS ships bash 3.2, which has no `mapfile`/`readarray` (bash 4.0+). We
# populate arrays with a portable `while read` loop reading from a process
# substitution (which keeps the loop in the current shell, so the array persists).

WORKFLOWS="$ROOT/.agents/workflows"

echo ""; echo "[1] Plugin marker + wiring files (Skills/Rules/MCP/Hooks only — per Antigravity plugin spec):"
for f in "plugin.json" "mcp_config.json" "rules/designpowers-mandate.md" "hooks.json" "hooks/welcome-gate.mjs"; do
  if [ -f "$PLUGIN/$f" ]; then ok "$f"; else bad "missing $PLUGIN/$f"; fi
done
# hooks.json must be valid JSON and reference the welcome script
if node -e "JSON.parse(require('fs').readFileSync('$PLUGIN/hooks.json','utf8'))" 2>/dev/null; then
  grep -q "welcome-gate.mjs" "$PLUGIN/hooks.json" && ok "hooks.json valid + references welcome-gate.mjs" \
    || bad "hooks.json doesn't reference welcome-gate.mjs"
else bad "hooks.json is not valid JSON"; fi

echo ""; echo "[2] Workflows live at .agents/workflows/ (NOT in the plugin — workflows aren't a plugin component):"
for f in "design.md" "verify-accessibility-tools.md"; do
  if [ -f "$WORKFLOWS/$f" ]; then ok ".agents/workflows/$f"; else bad "missing .agents/workflows/$f"; fi
done
if [ -d "$PLUGIN/workflows" ]; then bad "workflows/ found inside the plugin — Antigravity won't discover these; move to .agents/workflows/"; else ok "no stray workflows/ inside the plugin"; fi

# Tools the MCP server advertises (from the registry)
SERVER_TOOLS=()
while IFS= read -r line; do [ -n "$line" ] && SERVER_TOOLS+=("$line"); done \
  < <(jq_node "$REG" "console.log((d.mcp_servers['designpowers-accessibility'].tools||[]).join('\n'))")

echo ""; echo "[3] Registry agents -> core contract + persona + plugin Skill:"
AGENTS=()
while IFS= read -r line; do [ -n "$line" ] && AGENTS+=("$line"); done \
  < <(jq_node "$REG" "console.log(Object.keys(d.agents).join('\n'))")
echo "  (${#AGENTS[@]} agents in registry)"
for a in "${AGENTS[@]}"; do
  contract=$(jq_node "$REG" "console.log(d.agents['$a'].contract)")
  persona=$(jq_node "$REG" "console.log(d.agents['$a'].persona)")
  [ -f "$ROOT/$contract" ] || bad "$a: contract missing ($contract)"
  [ -f "$ROOT/$persona" ]  || bad "$a: persona missing ($persona)"
  skill="$PLUGIN/skills/$a/SKILL.md"
  if [ -f "$skill" ]; then
    # name in frontmatter must equal the folder name
    nm=$(grep -m1 '^name:' "$skill" | sed 's/^name: *//' | tr -d ' \r')
    [ "$nm" = "$a" ] && ok "$a: contract+persona+SKILL.md (name ok)" \
                      || bad "$a: SKILL.md name '$nm' != folder '$a'"
  else
    bad "$a: plugin Skill missing ($skill)"
  fi
done

echo ""; echo "[4] Plugin Skills are either a registry agent OR a process-skill pointer:"
for d in "$PLUGIN"/skills/*/; do
  s=$(basename "$d")
  if printf '%s\n' "${AGENTS[@]}" | grep -qx "$s"; then
    ok "$s (agent skill)"
  elif [ -d "$ROOT/skills/$s" ]; then
    ok "$s (pointer -> skills/$s)"
  else
    bad "orphan Skill: $s (neither a registry agent nor a core process skill)"
  fi
done

echo ""; echo "[5] Skill tool declarations are real server tools:"
for d in "$PLUGIN"/skills/*/; do
  s=$(basename "$d"); skill="$d/SKILL.md"
  # tools are listed as '  - toolname' under a 'tools:' key in frontmatter
  declared=()
  while IFS= read -r line; do [ -n "$line" ] && declared+=("$line"); done \
    < <(awk '/^tools:/{f=1;next} f&&/^[a-zA-Z]/{f=0} f&&/^ *- /{gsub(/^ *- */,"");print}' "$skill")
  for t in "${declared[@]:-}"; do
    [ -z "$t" ] && continue
    if printf '%s\n' "${SERVER_TOOLS[@]}" | grep -qx "$t"; then
      ok "$s declares $t"
    else
      bad "$s declares unknown tool '$t' (server has: ${SERVER_TOOLS[*]})"
    fi
  done
done

echo ""; echo "[6] mcp_config.json points at a real server file:"
# accept the placeholder OR an absolute path; the suffix must be our server.js
argpath=$(jq_node "$PLUGIN/mcp_config.json" "console.log(d.mcpServers['designpowers-accessibility'].args[0])")
case "$argpath" in
  *mcp-tools/accessibility/server.js)
    if [ -f "$ROOT/mcp-tools/accessibility/server.js" ]; then
      ok "server.js exists; config arg = $argpath"
      [[ "$argpath" == *"<DESIGNPOWERS_ROOT>"* ]] && note "(placeholder still present — SETUP.md step 2 fills it)"
    else bad "server.js not found at repo path"; fi ;;
  *) bad "unexpected server arg: $argpath" ;;
esac

echo ""; echo "[7] Every core process skill has a discoverable pointer, and pointers are in sync:"
missing=0
for d in "$ROOT"/skills/*/; do
  s=$(basename "$d")
  [ -f "$ROOT/skills/$s/SKILL.md" ] || continue
  # agent skills are hand-authored, not pointers — skip those names
  [ -f "$PLUGIN/skills/$s/.agent-skill" ] && continue
  if [ -f "$PLUGIN/skills/$s/SKILL.md" ]; then :; else bad "no pointer skill for core skills/$s"; missing=1; fi
done
[ "$missing" -eq 0 ] && ok "all core process skills have a pointer"
if node "$ROOT/scripts/gen-antigravity-pointer-skills.mjs" --check >/tmp/ptr.out 2>&1; then
  ok "pointers in sync with the core ($(grep -oE 'all [0-9]+' /tmp/ptr.out | head -1) skills)"
else
  bad "pointer skills are OUT OF SYNC — run: node scripts/gen-antigravity-pointer-skills.mjs"
  sed 's/^/      /' /tmp/ptr.out
fi

echo ""; echo "[8] Welcome/router + design-state wired into the always-on rule:"
RULE="$PLUGIN/rules/designpowers-mandate.md"
grep -q "using-designpowers" "$RULE" && ok "router (using-designpowers) referenced in mandate" || bad "mandate doesn't enforce the welcome/router"
grep -q "design-state.md" "$RULE" && ok "design-state lifecycle referenced in mandate" || bad "mandate doesn't maintain design-state.md"

echo ""
if [ "$fail" -ne 0 ]; then echo "FAIL — plugin/core inconsistencies found (see above)."; exit 1; fi
nptr=$(find "$PLUGIN"/skills -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
echo "OK — Designpowers Antigravity plugin consistent with the core (${#AGENTS[@]} agents + process pointers = $nptr discoverable skills)."
