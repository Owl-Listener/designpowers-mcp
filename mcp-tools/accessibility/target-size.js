// Pure touch-target size logic — deterministic, zero-dependency, unit-testable.
//
// WCAG 2.5.8 (Target Size, Minimum, AA) requires interactive targets to be at
// least 24×24 CSS px, with exceptions (spacing, inline, essential). WCAG 2.5.5
// (Target Size, Enhanced, AAA) requires 44×44. This is exact geometry — the
// measured truth, not a judgment, given the rendered width/height of a control.

const AA_MIN = 24;   // WCAG 2.5.8
const AAA_MIN = 44;  // WCAG 2.5.5

/**
 * Evaluate one interactive target's size (in CSS px) against WCAG target-size.
 * `width`/`height` are the rendered dimensions of the clickable/tappable area.
 */
export function evaluateTarget({ width, height, label = "" }) {
  const w = Number(width), h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 0 || h < 0) {
    throw new Error(`invalid target size for "${label || "target"}": ${width}×${height}`);
  }
  const smallest = Math.min(w, h);
  return {
    label,
    width: w,
    height: h,
    smallestSide: smallest,
    aaMin: AA_MIN,
    aaaMin: AAA_MIN,
    passAA: w >= AA_MIN && h >= AA_MIN,
    passAAA: w >= AAA_MIN && h >= AAA_MIN,
  };
}

/** Evaluate many targets; returns results plus a summary. */
export function evaluateTargets(targets) {
  const results = targets.map(evaluateTarget);
  const failingAA = results.filter((r) => !r.passAA);
  return {
    results,
    summary: {
      total: results.length,
      passAA: results.filter((r) => r.passAA).length,
      failAA: failingAA.length,
      passAAA: results.filter((r) => r.passAAA).length,
      verdict: failingAA.length === 0
        ? "all targets meet WCAG AA (24px)"
        : `${failingAA.length} target(s) below WCAG AA (24px)`,
    },
  };
}
