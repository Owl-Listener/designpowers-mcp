// Pure motion-safety logic — deterministic, zero-dependency, unit-testable.
//
// Checks declared motion properties against the WCAG criteria that protect
// motion-sensitive and vestibular-disorder users:
//   - 2.3.1 Three Flashes (no more than 3 flashes/second)
//   - 2.3.3 Animation from Interactions (AAA): motion-triggered animation can be
//     disabled unless essential — i.e. honour prefers-reduced-motion
//   - 2.2.2 Pause, Stop, Hide: looping/auto-playing motion >5s must be pausable
//
// This is not "does it FEEL safe" (that's judgment, the motion-designer's job).
// It's "do the DECLARED properties satisfy the thresholds" — a checkable fact,
// given an animation's spec. The animation declares: duration, whether it loops,
// flashes per second, whether a reduced-motion fallback exists, and whether the
// motion is essential.

const FLASH_LIMIT = 3;            // 2.3.1: max flashes per second
const PAUSABLE_THRESHOLD_S = 5;   // 2.2.2: looping/auto motion beyond this must pause

/**
 * Evaluate one animation's declared properties.
 *  - durationSeconds (number): for looping/auto-playing motion, how long it runs.
 *      Use Infinity for "indefinite loop".
 *  - loops (bool): does it repeat / auto-play continuously?
 *  - flashesPerSecond (number): peak flash rate (0 if it doesn't flash).
 *  - reducedMotionFallback (bool): is there a prefers-reduced-motion alternative?
 *  - essential (bool): is the motion essential to the information/activity?
 *  - pausable (bool): can the user pause/stop/hide it?
 */
export function evaluateAnimation({
  label = "",
  durationSeconds = 0,
  loops = false,
  flashesPerSecond = 0,
  reducedMotionFallback = false,
  essential = false,
  pausable = false,
}) {
  const issues = [];

  // 2.3.1 — hard fail, no exception: more than 3 flashes/sec is a seizure risk.
  if (Number(flashesPerSecond) > FLASH_LIMIT) {
    issues.push({
      criterion: "2.3.1 Three Flashes",
      severity: "critical",
      detail: `${flashesPerSecond} flashes/sec exceeds the ${FLASH_LIMIT}/sec limit (seizure risk).`,
    });
  }

  // 2.3.3 — non-essential motion must have a reduced-motion fallback.
  if (!essential && !reducedMotionFallback) {
    issues.push({
      criterion: "2.3.3 Animation from Interactions",
      severity: "major",
      detail: "Non-essential motion has no prefers-reduced-motion fallback (vestibular risk).",
    });
  }

  // 2.2.2 — looping / long auto motion must be pausable.
  const longRunning = loops || Number(durationSeconds) > PAUSABLE_THRESHOLD_S;
  if (longRunning && !pausable) {
    issues.push({
      criterion: "2.2.2 Pause, Stop, Hide",
      severity: "major",
      detail: `Looping/long (${loops ? "indefinite" : durationSeconds + "s"}) motion is not pausable.`,
    });
  }

  const worst = issues.reduce(
    (acc, i) => (i.severity === "critical" ? "critical" : acc === "critical" ? "critical" : i.severity),
    "none"
  );

  return {
    label,
    durationSeconds,
    loops: !!loops,
    flashesPerSecond: Number(flashesPerSecond) || 0,
    reducedMotionFallback: !!reducedMotionFallback,
    essential: !!essential,
    pausable: !!pausable,
    issues,
    safe: issues.length === 0,
    severity: issues.length === 0 ? "none" : worst,
  };
}

/** Evaluate many animations; returns results plus a summary. */
export function evaluateAnimations(animations) {
  const results = animations.map(evaluateAnimation);
  const unsafe = results.filter((r) => !r.safe);
  const critical = results.filter((r) => r.severity === "critical");
  return {
    results,
    summary: {
      total: results.length,
      safe: results.filter((r) => r.safe).length,
      unsafe: unsafe.length,
      critical: critical.length,
      verdict: unsafe.length === 0
        ? "all animations pass the motion-safety checks"
        : `${unsafe.length} animation(s) have motion-safety issues` +
          (critical.length ? ` (${critical.length} CRITICAL — flash/seizure)` : ""),
    },
  };
}
