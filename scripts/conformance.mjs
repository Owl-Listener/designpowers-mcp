#!/usr/bin/env node
// Cross-surface conformance suite — the anti-drift guarantee.
//
// THESIS: judgment may vary between surfaces; TRUTH may not. Designpowers runs over
// several surfaces (Antigravity plugin, Claude Code, the Gemini ADK runner), each a
// thin adapter that wires the SAME truth-layer MCP server. This suite proves the
// measured evidence is IDENTICAL no matter which surface's wiring launched the tool.
//
// For each conformance scenario (discovered from core/registry.json):
//   1. launch the truth-layer server the way EACH surface's config launches it
//      (resolving each surface's own command/args), over real MCP/stdio,
//   2. call the scenario's tool with the scenario's input,
//   3. assert the structuredContent satisfies the scenario's expected_evidence, AND
//   4. assert every surface produced byte-identical evidence (the anti-drift check).
//
// Deterministic — no LLM, no API key. Run: node scripts/conformance.mjs

import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, isAbsolute } from "node:path";
import assert from "node:assert";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(readFileSync(join(ROOT, "core/registry.json"), "utf8"));

// --- The surfaces under test: how each one wires the truth-layer server. ---
// Each surface is identified by its own config file; we read the command/args from
// it exactly as the host would, then resolve paths against ROOT. The Antigravity
// config uses a <DESIGNPOWERS_ROOT> placeholder (filled at install time) — we
// resolve it to ROOT here so we test the real launch.
function loadSurface(name, configPath, serverKey) {
  const cfg = JSON.parse(readFileSync(join(ROOT, configPath), "utf8"));
  const spec = cfg.mcpServers[serverKey];
  if (!spec) throw new Error(`${name}: no '${serverKey}' in ${configPath}`);
  const args = spec.args.map((a) =>
    a.replace("<DESIGNPOWERS_ROOT>", ROOT)
  ).map((a) => (a.endsWith(".js") && !isAbsolute(a) ? resolve(ROOT, a) : a));
  return { name, command: spec.command, args };
}

// Registry surface uses `mcp_servers` (snake) not `mcpServers`; wrap it so loadSurface works.
const registrySurface = {
  name: "registry",
  command: registry.mcp_servers["designpowers-accessibility"].command,
  args: registry.mcp_servers["designpowers-accessibility"].args.map((a) => resolve(ROOT, a)),
};

const SURFACES = [
  loadSurface("antigravity", ".agents/plugins/designpowers/mcp_config.json", "designpowers-accessibility"),
  loadSurface("claude", ".mcp.json", "designpowers-accessibility"),
  registrySurface,
];

// --- Minimal raw MCP stdio client (no SDK dep): initialize → tools/call. ---
async function callTool(surface, toolName, args) {
  return new Promise((resolveP, rejectP) => {
    const child = spawn(surface.command, surface.args, { stdio: ["pipe", "pipe", "pipe"] });
    let buf = "";
    const pending = new Map();
    let id = 1;
    const send = (method, params) => {
      const myId = id++;
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: myId, method, params }) + "\n");
      return new Promise((res, rej) => {
        pending.set(myId, { res, rej });
        setTimeout(() => pending.has(myId) && (pending.delete(myId), rej(new Error(`timeout ${method}`))), 15000);
      });
    };
    child.stdout.on("data", (c) => {
      buf += c;
      let nl;
      while ((nl = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
        if (!line) continue;
        let m; try { m = JSON.parse(line); } catch { continue; }
        if (m.id && pending.has(m.id)) {
          const { res, rej } = pending.get(m.id); pending.delete(m.id);
          m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
        }
      }
    });
    child.on("error", rejectP);
    (async () => {
      try {
        await send("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "conformance", version: "0" } });
        child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }) + "\n");
        const result = await send("tools/call", { name: toolName, arguments: args });
        resolveP(result.structuredContent);
      } catch (e) { rejectP(e); } finally { child.kill(); }
    })();
  });
}

// --- Pull a value out of evidence by scenario assertion (label + path). ---
function valueAt(evidence, a) {
  if (a.label !== undefined) {
    const row = (evidence.results || []).find((r) => r.label === a.label);
    if (!row) throw new Error(`no result labelled '${a.label}'`);
    return row[a.path];
  }
  // summary-level or flat (single-result) evidence
  if (evidence.summary && a.path in evidence.summary) return evidence.summary[a.path];
  return evidence[a.path];
}

function collectScenarios() {
  const paths = new Set();
  for (const agent of Object.values(registry.agents))
    for (const p of agent.conformance || []) paths.add(p);
  return [...paths].map((p) => ({ path: p, ...JSON.parse(readFileSync(join(ROOT, p), "utf8")) }));
}

let pass = 0, fail = 0;
const ok = (s) => { pass++; console.log("  ✓ " + s); };
const no = (s, e) => { fail++; console.log("  ✗ " + s + " — " + e.message); };

console.log(`Conformance suite — ${SURFACES.length} surfaces: ${SURFACES.map((s) => s.name).join(", ")}\n`);

const scenarios = collectScenarios();
for (const sc of scenarios) {
  console.log(`Scenario: ${sc.scenario}  (tool: ${sc.tool})`);
  const tool = sc.tool;
  const input = sc.input;

  // Run the scenario on every surface.
  const evidenceBySurface = {};
  let runFailed = false;
  for (const surface of SURFACES) {
    try {
      evidenceBySurface[surface.name] = await callTool(surface, tool, input);
    } catch (e) { no(`${sc.scenario} runs on ${surface.name}`, e); runFailed = true; }
  }
  if (runFailed) continue;

  // (a) Each surface satisfies the scenario's expected evidence.
  for (const surface of SURFACES) {
    const ev = evidenceBySurface[surface.name];
    try {
      for (const a of sc.expected_evidence.assertions || []) {
        assert.deepStrictEqual(valueAt(ev, a), a.equals,
          `${a.label ? a.label + "." : ""}${a.path} = ${JSON.stringify(valueAt(ev, a))}, expected ${JSON.stringify(a.equals)}`);
      }
      if (sc.expected_evidence.summary) {
        const s = sc.expected_evidence.summary;
        assert.deepStrictEqual(ev.summary[s.path], s.equals, `summary.${s.path}`);
      }
      ok(`${surface.name}: evidence matches expected`);
    } catch (e) { no(`${surface.name}: expected evidence`, e); }
  }

  // (b) ANTI-DRIFT: every surface produced byte-identical evidence.
  const names = Object.keys(evidenceBySurface);
  const baseline = JSON.stringify(evidenceBySurface[names[0]]);
  let drifted = false;
  for (const n of names.slice(1)) {
    if (JSON.stringify(evidenceBySurface[n]) !== baseline) {
      no(`anti-drift: ${n} evidence differs from ${names[0]}`, new Error("evidence not identical across surfaces"));
      drifted = true;
    }
  }
  if (!drifted) ok(`anti-drift: identical evidence across ${names.length} surfaces`);
  console.log("");
}

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
