// End-to-end MCP smoke test: launches server.js over stdio via a real MCP
// client, lists tools, and calls them — proving the server actually speaks the
// protocol, not just that the file parses. Run: node server.test.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import assert from "node:assert";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (n) => { pass++; console.log("  ✓ " + n); };
const no = (n, e) => { fail++; console.log("  ✗ " + n + " — " + e.message); };

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [join(here, "server.js")],
});
const client = new Client({ name: "test", version: "0.0.0" });

console.log("MCP server e2e tests");
try {
  await client.connect(transport);
  ok("server connects over stdio");

  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  try {
    assert.deepEqual(names, [
      "check_contrast", "check_motion_safety", "check_palette",
      "check_reading_level", "check_touch_targets",
    ]);
    ok("advertises all 5 truth tools");
  } catch (e) { no("advertises expected tools", e); }

  // check_contrast on a known failing pair
  try {
    const res = await client.callTool({
      name: "check_contrast",
      arguments: { foreground: "#9aa0a6", background: "#e8eaed", label: "Save button" },
    });
    const sc = res.structuredContent;
    assert.ok(Math.abs(sc.ratio - 2.19) < 0.03, `ratio ${sc.ratio}`);
    assert.equal(sc.passAA, false);
    assert.match(res.content[0].text, /FAIL/);
    ok("check_contrast returns measured ratio + FAIL for low-contrast pair");
  } catch (e) { no("check_contrast works", e); }

  // check_contrast on a known passing pair
  try {
    const res = await client.callTool({
      name: "check_contrast",
      arguments: { foreground: "#000000", background: "#ffffff" },
    });
    assert.equal(res.structuredContent.ratio, 21);
    assert.equal(res.structuredContent.passAAA, true);
    ok("check_contrast: black on white = 21, AAA");
  } catch (e) { no("check_contrast passing pair", e); }

  // check_palette batch
  try {
    const res = await client.callTool({
      name: "check_palette",
      arguments: { pairs: [
        { foreground: "#000", background: "#fff", label: "body" },
        { foreground: "#9aa0a6", background: "#e8eaed", label: "save" },
      ] },
    });
    assert.equal(res.structuredContent.summary.total, 2);
    assert.equal(res.structuredContent.summary.failAA, 1);
    ok("check_palette summarises a multi-pair check");
  } catch (e) { no("check_palette works", e); }

  // check_reading_level — plain copy meets grade 6
  try {
    const res = await client.callTool({
      name: "check_reading_level",
      arguments: { text: "Saved to your reading list.", label: "toast" },
    });
    assert.equal(res.structuredContent.meetsTarget, true);
    assert.ok(res.structuredContent.fleschKincaidGrade <= 6);
    ok("check_reading_level measures grade of interface copy");
  } catch (e) { no("check_reading_level works", e); }

  // check_touch_targets — a 20px control fails AA
  try {
    const res = await client.callTool({
      name: "check_touch_targets",
      arguments: { targets: [
        { width: 48, height: 48, label: "primary" },
        { width: 20, height: 20, label: "close" },
      ] },
    });
    assert.equal(res.structuredContent.summary.total, 2);
    assert.equal(res.structuredContent.summary.failAA, 1);
    ok("check_touch_targets catches an undersized control");
  } catch (e) { no("check_touch_targets works", e); }

  // check_motion_safety — a non-essential animation with no reduced-motion fallback is unsafe
  try {
    const res = await client.callTool({
      name: "check_motion_safety",
      arguments: { animations: [
        { label: "parallax", durationSeconds: 0.5, reducedMotionFallback: false },
      ] },
    });
    assert.equal(res.structuredContent.summary.unsafe, 1);
    assert.match(res.content[0].text, /2\.3\.3/);
    ok("check_motion_safety flags a missing reduced-motion fallback");
  } catch (e) { no("check_motion_safety works", e); }
} catch (e) {
  no("server connection", e);
} finally {
  await client.close().catch(() => {});
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
