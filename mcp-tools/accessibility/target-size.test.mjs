// Pure-logic tests for target-size.js. Run: node target-size.test.mjs
import assert from "node:assert";
import { evaluateTarget, evaluateTargets } from "./target-size.js";

let pass = 0, fail = 0;
const ok = (n) => { pass++; console.log("  ✓ " + n); };
const no = (n, e) => { fail++; console.log("  ✗ " + n + " — " + e.message); };
const t = (n, fn) => { try { fn(); ok(n); } catch (e) { no(n, e); } };

console.log("target-size pure-logic tests");

t("44×44 passes AA and AAA", () => {
  const r = evaluateTarget({ width: 44, height: 44, label: "fab" });
  assert.equal(r.passAA, true);
  assert.equal(r.passAAA, true);
});

t("24×24 passes AA but not AAA (boundary)", () => {
  const r = evaluateTarget({ width: 24, height: 24 });
  assert.equal(r.passAA, true);
  assert.equal(r.passAAA, false);
});

t("23px fails AA (just under)", () => {
  const r = evaluateTarget({ width: 23, height: 40 });
  assert.equal(r.passAA, false);
  assert.equal(r.smallestSide, 23);
});

t("a 20×20 icon button fails AA", () => {
  const r = evaluateTarget({ width: 20, height: 20, label: "close" });
  assert.equal(r.passAA, false);
});

t("batch summary counts failures", () => {
  const { summary } = evaluateTargets([
    { width: 48, height: 48, label: "primary" },
    { width: 18, height: 18, label: "close" },
    { width: 24, height: 24, label: "chip" },
  ]);
  assert.equal(summary.total, 3);
  assert.equal(summary.failAA, 1);
  assert.equal(summary.passAA, 2);
});

t("invalid size throws", () => {
  assert.throws(() => evaluateTarget({ width: "x", height: 10 }));
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
