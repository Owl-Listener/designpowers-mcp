---
name: design-state
description: >-
  Use when any Designpowers agent starts work or completes work — maintains the shared design state file that all agents read from and write to. Invoke to initialise, read, or update the living design state document
---

# design-state (Designpowers process skill — pointer)

This is a **thin pointer**, not the skill itself. The skill content is the single
source of truth in the shared core and is reused unchanged by every Designpowers
surface (Antigravity, Claude, Gemini).

**Read and follow `skills/design-state/SKILL.md` in this repository, and do exactly
what it says.** Open the file — do not work from memory — so you stay in sync with
the core as it evolves. If that file references other skills, follow those through
their pointers the same way.
