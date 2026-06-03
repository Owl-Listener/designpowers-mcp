#!/usr/bin/env bash
# Designpowers — one-command local setup.
#
# Removes the manual steps from SETUP.md: it determines the repo path automatically,
# injects it into the Antigravity plugin's mcp_config.json, installs the WCAG truth-
# layer's Node deps, optionally installs the plugin globally, and runs the validation
# + live MCP handshake so you see green before opening Antigravity.
#
# Portable: macOS bash 3.2 and Linux. No bash 4 features. Run:  bash scripts/setup.sh
set -uo pipefail

# --- locate the repo root (this script lives in scripts/) ---
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN="$ROOT/.agents/plugins/designpowers"
MCP_CONFIG="$PLUGIN/mcp_config.json"
GLOBAL_PLUGINS="$HOME/.gemini/config/plugins"

say()  { printf '%s\n' "$*"; }
step() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
err()  { printf '  \033[31m✗\033[0m %s\n' "$*" >&2; }

say "Designpowers setup"
say "Repo: $ROOT"

# --- print OS-tailored Node install guidance (we do NOT auto-install a runtime:
#     it needs admin rights, varies by OS, and silently mutating someone's machine
#     from a setup script is the wrong default). Instead we make the unblock easy. ---
node_install_help() {
  say ""
  say "  Designpowers needs Node.js (it runs the WCAG truth-layer — a small local"
  say "  server). It's a one-time, ~2-minute install. Pick whichever fits:"
  say ""
  case "$(uname -s)" in
    Darwin)
      say "  macOS:"
      say "    • Easiest — download the installer (.pkg) from  https://nodejs.org  (get the LTS)."
      say "    • Or with Homebrew, if you have it:   brew install node"
      ;;
    Linux)
      say "  Linux:"
      say "    • Download from  https://nodejs.org  (LTS), or use your package manager:"
      say "        Debian/Ubuntu:  sudo apt-get install -y nodejs npm"
      say "        Fedora:         sudo dnf install -y nodejs"
      say "    • Or nvm (no admin needed):  https://github.com/nvm-sh/nvm"
      ;;
    *)
      say "  Download the LTS installer from  https://nodejs.org  for your system."
      ;;
  esac
  say ""
  say "  After installing, open a NEW terminal (so PATH refreshes) and re-run:"
  say "      bash scripts/setup.sh"
  say ""
  say "  Verify it's there with:   node --version    (expect v18 or newer)"
}

# --- 1. prerequisites ---
step "Checking prerequisites"
if ! command -v node >/dev/null 2>&1; then
  err "Node.js isn't installed (or isn't on your PATH)."
  node_install_help
  exit 1
fi
# Node present but ancient? warn — the MCP SDK needs a modern runtime.
node_major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "${node_major:-0}" -lt 18 ] 2>/dev/null; then
  err "Found node $(node --version), but Designpowers needs Node 18+ (tested on 22)."
  node_install_help
  exit 1
fi
ok "node $(node --version)"
if ! command -v npm >/dev/null 2>&1; then
  err "npm not found on PATH (it normally ships with Node)."
  node_install_help
  exit 1
fi
ok "npm $(npm --version)"

# --- 2. install the WCAG truth-layer (Node MCP server) ---
step "Installing the WCAG truth-layer dependencies"
if ( cd "$ROOT/mcp-tools/accessibility" && npm install >/tmp/dp-npm.log 2>&1 ); then
  ok "mcp-tools/accessibility deps installed"
else
  err "npm install failed — see /tmp/dp-npm.log"; exit 1
fi

# --- 3. inject the absolute repo path into the plugin's mcp_config.json ---
step "Wiring the MCP server path"
# The plugin ships a <DESIGNPOWERS_ROOT> placeholder; Antigravity needs an absolute
# path (it launches the server from an unspecified cwd). We rewrite the file with
# node so it works identically on macOS and Linux (no sed -i portability traps).
node - "$MCP_CONFIG" "$ROOT" <<'NODE'
const fs = require("fs");
const [file, root] = process.argv.slice(2);
let raw = fs.readFileSync(file, "utf8");
const cfg = JSON.parse(raw);
const srv = cfg.mcpServers["designpowers-accessibility"];
srv.args = srv.args.map((a) =>
  a.replace("<DESIGNPOWERS_ROOT>", root)
);
// idempotent: if it was already an absolute path to this repo, leave it; otherwise
// normalise any prior absolute path to the current repo location.
srv.args = srv.args.map((a) =>
  a.replace(/^.*\/mcp-tools\/accessibility\/server\.js$/, root + "/mcp-tools/accessibility/server.js")
);
fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n");
console.log("  wired -> " + srv.args[0]);
NODE
ok "mcp_config.json points at this repo"

# --- 4. global or local? ---
step "Install scope"
say "  Designpowers can run:"
say "    [l] LOCALLY  — only when you open THIS repo as your Antigravity workspace (default)"
say "    [g] GLOBALLY — available in every workspace (copied to $GLOBAL_PLUGINS)"
printf "  Choose [l/g] (default l): "
if [ -t 0 ]; then read -r scope; else scope=""; fi
case "${scope:-l}" in
  g|G)
    mkdir -p "$GLOBAL_PLUGINS"
    rm -rf "$GLOBAL_PLUGINS/designpowers"
    cp -R "$PLUGIN" "$GLOBAL_PLUGINS/designpowers"
    ok "Installed globally to $GLOBAL_PLUGINS/designpowers"
    say "  (The global copy's mcp_config.json points at this repo's truth-layer at $ROOT.)"
    ;;
  *)
    ok "Local install — open $ROOT as your Antigravity workspace"
    ;;
esac

# --- 5. validate + live handshake (proof, not assertion) ---
step "Validating (plugin consistency + live MCP handshake)"
fail=0
if bash "$ROOT/scripts/check-antigravity-plugin.sh" >/tmp/dp-validate.log 2>&1; then
  ok "plugin consistent with the core ($(grep -oE '[0-9]+ discoverable skills' /tmp/dp-validate.log | tail -1))"
else
  err "plugin validation FAILED — see /tmp/dp-validate.log"; fail=1
fi
if node "$ROOT/mcp-tools/accessibility/verify-mcp.mjs" node "$ROOT/mcp-tools/accessibility/server.js" >/tmp/dp-handshake.log 2>&1; then
  ok "MCP handshake OK — tools answer with measured evidence (2.19:1, FAIL AA)"
else
  err "MCP handshake FAILED — see /tmp/dp-handshake.log"; fail=1
fi

step "Done"
if [ "$fail" -eq 0 ]; then
  printf '  \033[32mAll green.\033[0m Next:\n'
  say "    1. Open $ROOT in Antigravity (or use the global install)."
  say "    2. In the agent panel, pre-allow the tools: add  mcp(designpowers-accessibility/*)  to the Allow list."
  say "    3. Run  /verify-accessibility-tools  — expect 2.19:1, FAIL AA."
  say "    4. Run  /design  to start the design team."
else
  say "  Some checks failed above — fix those before opening Antigravity. The logs in /tmp/dp-*.log have details."
  exit 1
fi
