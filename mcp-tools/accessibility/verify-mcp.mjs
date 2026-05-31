#!/usr/bin/env node
// Raw MCP stdio handshake probe — NO ADK, NO SDK client beyond the protocol.
//
// This mimics exactly what Antigravity (or any MCP host) does when it loads a
// server from mcp_config.json: spawn `command args` over stdio, send the
// initialize / tools/list / tools/call JSON-RPC frames, and read the responses.
// If this prints the tools and a measured contrast result, Antigravity will see
// the same thing. Used by SETUP.md's VERIFY step.
//
// Usage: node verify-mcp.mjs "<command>" "<arg1>" "<arg2>" ...
//   e.g. node verify-mcp.mjs node mcp-tools/accessibility/server.js

import { spawn } from "node:child_process";

const [, , command, ...args] = process.argv;
if (!command) {
  console.error('Usage: node verify-mcp.mjs <command> [args...]');
  console.error('  e.g. node verify-mcp.mjs node mcp-tools/accessibility/server.js');
  process.exit(2);
}

const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });

let buf = "";
const pending = new Map();
let nextId = 1;

function send(method, params) {
  const id = nextId++;
  const frame = JSON.stringify({ jsonrpc: "2.0", id, method, params });
  child.stdin.write(frame + "\n");
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    setTimeout(() => {
      if (pending.has(id)) { pending.delete(id); reject(new Error(`timeout on ${method}`)); }
    }, 15000);
  });
}

function notify(method, params) {
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
}

child.stdout.on("data", (chunk) => {
  buf += chunk.toString();
  let nl;
  while ((nl = buf.indexOf("\n")) !== -1) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  }
});

child.stderr.on("data", () => {}); // server logs to stderr; ignore for the probe

const ok = (s) => console.log(`  ✓ ${s}`);
const fail = (s) => console.log(`  ✗ ${s}`);

try {
  console.log("MCP handshake probe (what Antigravity does):");

  await send("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "designpowers-verify", version: "0.0.0" },
  });
  ok("initialize — server speaks MCP over stdio");
  notify("notifications/initialized", {});

  const { tools } = await send("tools/list", {});
  const names = tools.map((t) => t.name).sort();
  ok(`tools/list — advertises: ${names.join(", ")}`);
  if (!names.includes("check_contrast") || !names.includes("check_palette")) {
    fail("expected check_contrast + check_palette");
    process.exitCode = 1;
  }

  const res = await send("tools/call", {
    name: "check_contrast",
    arguments: { foreground: "#9aa0a6", background: "#e8eaed", label: "Save button" },
  });
  const sc = res.structuredContent;
  const text = (res.content?.[0]?.text) || "";
  if (sc && Math.abs(sc.ratio - 2.19) < 0.03 && sc.passAA === false) {
    ok(`tools/call check_contrast — MEASURED ${sc.ratio}:1, passAA=${sc.passAA} (FAIL AA, as expected)`);
  } else {
    fail(`tools/call returned unexpected evidence: ${JSON.stringify(sc)}`);
    process.exitCode = 1;
  }
  console.log("\n  Server text response:\n    " + text.replace(/\n/g, "\n    "));
  console.log("\nVERIFY OK — Antigravity will see these tools and get this measured evidence.");
} catch (e) {
  fail("handshake failed: " + e.message);
  process.exitCode = 1;
} finally {
  child.kill();
}
