---
trigger: always_on
description: "Where specs live and when to read/update them (spec-driven development)"
---

# Spec Workspace Standard

1. **Location.** Every specification lives under `docs/specs/<ID>-<slug>/` (`spec.md` + `tasks.md`) and is registered in `docs/specs/INDEX.md`.
2. **Before non-trivial work.** Read `docs/specs/INDEX.md` and any related spec before exploring or coding, and follow the `spec-driven-development` skill.
3. **IDs.** Format `<FAMILY>-<NNN>` (3 uppercase letters). Families: `GAM` (game engine and rules: dealing, betting, pots, tournaments), `UXP` (client experience and layouts), `BOT` (AI bot service), `OPS` (deploy, infrastructure, observability). Add the row to the index; never reuse a number.
   - When a later spec replaces part of an earlier one, say so in the index `Notes` column and in the header of the older spec instead of rewriting it.
4. **Levels.** Level S (bugfix/tweak in one package, no change to chip accounting, hand evaluation or the WebSocket message contract) may live in the PR/commit body. Levels M/L require `spec.md`. Any change to chip accounting, pots, hand ranking, turn/timeout rules or WebSocket message shapes is Level M or L.
5. **Approval gate.** Do not build Level M/L work before the human approves the spec.
6. **Keep it current.** When a change lands, update the spec status, its `tasks.md` checkboxes, `docs/specs/INDEX.md` and `progress.md` with the evidence (test/build commands).
