// Pure-logic tests for motion-safety.js. Run: node motion-safety.test.mjs
import assert from "node:assert";
import { evaluateAnimation, evaluateAnimations } from "./motion-safety.js";

let pass = 0, fail = 0;
const ok = (n) => { pass++; console.log("  ✓ " + n); };
const no = (n, e) => { fail++; console.log("  ✗ " + n + " — " + e.message); };
const t = (n, fn) => { try { fn(); ok(n); } catch (e) { no(n, e); } };

console.log("motion-safety pure-logic tests");

t("a short non-essential animation WITH a reduced-motion fallback is safe", () => {
  const r = evaluateAnimation({ label: "fade-in", durationSeconds: 0.3, reducedMotionFallback: true });
  assert.equal(r.safe, true);
  assert.equal(r.severity, "none");
});

t("non-essential motion WITHOUT a reduced-motion fallback is a major issue (2.3.3)", () => {
  const r = evaluateAnimation({ label: "parallax", durationSeconds: 0.5, reducedMotionFallback: false });
  assert.equal(r.safe, false);
  assert.ok(r.issues.some((i) => i.criterion.startsWith("2.3.3")));
});

t("more than 3 flashes/sec is CRITICAL (2.3.1, no exception)", () => {
  const r = evaluateAnimation({ label: "alert", flashesPerSecond: 4, essential: true, reducedMotionFallback: true });
  assert.equal(r.severity, "critical");
  assert.ok(r.issues.some((i) => i.criterion.startsWith("2.3.1")));
});

t("an indefinite loop that can't be paused fails 2.2.2", () => {
  const r = evaluateAnimation({ label: "spinner", loops: true, reducedMotionFallback: true, pausable: false });
  assert.equal(r.safe, false);
  assert.ok(r.issues.some((i) => i.criterion.startsWith("2.2.2")));
});

t("a long loop that IS pausable and has a fallback is safe", () => {
  const r = evaluateAnimation({ label: "carousel", loops: true, durationSeconds: 30, pausable: true, reducedMotionFallback: true });
  assert.equal(r.safe, true);
});

t("essential motion is exempt from the reduced-motion fallback rule", () => {
  const r = evaluateAnimation({ label: "loading-progress", durationSeconds: 2, essential: true, reducedMotionFallback: false });
  assert.equal(r.safe, true);
});

t("batch summary flags critical flash separately", () => {
  const { summary } = evaluateAnimations([
    { label: "ok", durationSeconds: 0.3, reducedMotionFallback: true },
    { label: "seizure", flashesPerSecond: 10, essential: true, reducedMotionFallback: true },
  ]);
  assert.equal(summary.total, 2);
  assert.equal(summary.unsafe, 1);
  assert.equal(summary.critical, 1);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
