# Pipeline run — end-to-end proof

A reproducible worked example proving the Designpowers studio runs end to end: a
real brief goes through the full pipeline, the studio **measures its own built
output**, catches a **real** WCAG AA failure, fixes it on **measured** evidence,
and re-measures green.

## Run it

```bash
bash examples/pipeline-run/run.sh
```

Expected: v1 `Undo` button measured at **2.29:1 (FAIL AA)** → fix → v2 at
**6.31:1 (PASS AA)**. Exit 0.

## What's here

| File | What it is |
|------|-----------|
| `brief.md` | The tiny brief (a save-confirmation toast). |
| `design-state.md` | The **whole pipeline**, phase by phase — each tagged `[judgment]` (model performing a skill) or `[truth]` (measured). |
| `build/toast.v1.html` | design-builder's first build — contains a real, plausible contrast fail. |
| `build/toast.v2.html` | The fix round — one colour token darkened, chosen by *measuring*. |
| `measure-build.mjs` | Reads the **actual** colours out of a build and runs them through the **real** truth-layer (`mcp-tools/accessibility/wcag.js`). Nothing hardcoded. |
| `run.sh` | One-command end-to-end run. |

## Honesty note

This proves the **deterministic** spine: orchestration order, and the
build → measure → catch → fix → re-measure seam, with real numbers. The
**judgment** phases (strategy, copy, craft critique) are a model performing the
skills — recorded in `design-state.md`, shown rather than asserted as "proven,"
because they aren't deterministic code. That split *is* the v2 thesis: prose for
judgment, real tools for truth.

> Change a hex in `build/toast.v1.html` and re-run — the verdict changes. The
> measurement is real, not a transcript.
