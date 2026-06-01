# design-state.md — Save-for-later toast (worked pipeline run)

The shared state for one end-to-end run of the Designpowers studio, proving the
pipeline runs. Each phase is tagged **[judgment]** (a model performing the skill —
shown, in the agent's voice) or **[truth]** (measured by the WCAG MCP tool —
reproducible via `run.sh`). The studio is *mostly* judgment; that's by design. The
one place it must not bluff — contrast — is measured.

## Handoff chain

### 1. using-designpowers → welcome + route  [process]
First design message → welcome shown, Build lane (new component, not a review).

### 2. design-strategist  [judgment]
> Principle: *confirmation should reassure, not interrupt.* The key task is a
> reassurance moment, so the toast must be glanceable and non-modal, with an escape
> hatch (Undo) for the mis-tap. Persona that drives the bar: a low-vision commuter
> reading in sunlight — legibility is the make-or-break, not decoration.

**→ design-lead:** "Calm, not loud. Mint success surface, dark title, a quiet Undo."

### 3. design-lead  [judgment] + [truth on its colours]
> A mint-tinted surface (`#e8f3ee`), dark-green title (`#1f3d2f`), and a *muted*
> green Undo (`#8aa79a`) so it recedes. The recede instinct is taste — but the
> contract says measure colour choices, so I checked: title 10.46:1 (great), Undo
> **2.29:1 — I'm flagging my own choice as a risk into build.**

**→ content-writer / design-builder.**

### 4. content-writer  [judgment]
> Strings: "Saved to your reading list" (confirms *what* happened, not just
> "Saved"), action "Undo". Grade-level target ~5; verified-by-tool pending a
> readability truth tool (honest: estimate for now).

### 5. design-builder  [judgment → produces real output]
Built `build/toast.v1.html` with the design-lead's tokens, incl. the suspect
`--toast-undo: #8aa79a`. Role=`status`, `aria-live="polite"`. Output is real code,
so it can be **measured**, not described.

### 6. Screenshot checkpoint  [process]
Built component shown to the user before reviewers.

### 7–8. Parallel review — accessibility-critic  [TRUTH] ⚑
Measured the *actual* colours in `toast.v1.html` via `check_palette`:

| pair | measured | AA (4.5) | verdict |
|------|---------:|:--------:|---------|
| toast message (`#1f3d2f` on `#e8f3ee`) | 10.46:1 | ✓ | PASS AAA |
| Undo button (`#8aa79a` on `#e8f3ee`)   |  2.29:1 | ✗ | **FAIL AA** |

> **Critical.** "Undo" is unreadable for low-vision users and anyone in bright
> sunlight — exactly the strategist's make-or-break persona. Affected: low-vision,
> situational glare. Fix: darken `--toast-undo` to clear 4.5:1.

(design-critic [judgment]: copy + craft good, no objection. heuristic-evaluator
[judgment]: `status`/`aria-live` correct; Undo gives the H3 escape hatch.)

### 9. Reconcile  [process]
Critic's **measured** FAIL outranks the "recede" aesthetic — *accessibility wins
over aesthetics*. One critical → fix round.

### 10. Fix round — design-builder  [judgment + TRUTH]
Did **not** eyeball the fix. Measured candidate greens on `#e8f3ee`; picked
`#3f5e51` (6.31:1, comfortable margin). Built `build/toast.v2.html`. Re-measured:

| pair | measured | verdict |
|------|---------:|---------|
| Undo button (`#3f5e51` on `#e8f3ee`) | 6.31:1 | **PASS AA** (AAA) |

### 11. verification-before-shipping  [TRUTH]
Evidence, not assertion: `bash run.sh` reproduces v1 FAIL (2.29:1) → v2 PASS
(6.31:1) from the actual build files. Exit 0.

### 12. Team presentation  [judgment]
> **design-lead:** "My muted-Undo instinct was wrong by the numbers; the darker
> green still reads as quiet and now it's legible." **strategist:** "Make-or-break
> persona is served." No open tensions. Ship v2.

## Outcome

Pipeline ran welcome → strategy → design → content → build → measured review →
reconcile → fix → verify → present. The judgment phases are shown in-voice; the
contrast claims are **measured and reproducible**. The studio caught a real fail in
its *own* output and fixed it on evidence — which is the whole point of v2.
