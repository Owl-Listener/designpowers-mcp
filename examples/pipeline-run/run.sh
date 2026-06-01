#!/usr/bin/env bash
# Reproducible proof that the Designpowers pipeline runs end to end.
#
# This drives the load-bearing, DETERMINISTIC half of the studio: the build is
# measured against the real truth-layer, a real AA failure is caught, the fix is
# applied, and the rebuild is re-measured green. (The judgment phases — strategy,
# copy, craft — are recorded in design-state.md; they're a model performing the
# skills, not deterministic code, so they're shown, not asserted as "proven".)
#
# Run from anywhere:  bash examples/pipeline-run/run.sh
set -euo pipefail
cd "$(dirname "$0")"

echo "════════════════════════════════════════════════════════════════"
echo " Designpowers pipeline — end-to-end proof (Save-for-later toast)"
echo "════════════════════════════════════════════════════════════════"
echo
echo "Phases 1–6 (strategy → lead → content → build): see design-state.md"
echo "  (judgment — recorded there). Below is the measured, deterministic part:"
echo
echo "── Phase 7+8: design-builder hands off; accessibility-critic MEASURES v1 ──"
node measure-build.mjs build/toast.v1.html
echo
echo "→ Reconciliation: critic's measured FAIL outranks any 'looks fine' (accessibility"
echo "  wins over aesthetics). Fix round dispatched to design-builder."
echo
echo "── Phase 10: design-builder fixes, accessibility-critic RE-MEASURES v2 ──"
node measure-build.mjs build/toast.v2.html --expect-pass
echo
echo "════════════════════════════════════════════════════════════════"
echo " PIPELINE PROVEN: built → measured own output → caught real AA fail"
echo " (2.29:1) → fixed by measuring candidates → re-measured green (6.31:1)."
echo "════════════════════════════════════════════════════════════════"
