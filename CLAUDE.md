# CLAUDE.md

This repository is governed by **`AGENTS.md`** — read it first and follow it.

Key pointers:

- **Specs & documentation:** specifications live in `docs/specs/<ID>-<slug>/` and are registered in
  `docs/specs/INDEX.md`. Read the index before starting any non-trivial feature and follow the
  `spec-driven-development` skill.
- **Rules:** project rules are in `.agents/rules/` (e.g. `game-engine.md`, `ui-standards.md`).
- **Skills:** specialized workflows are in `.agents/skills/`.
- **Context economy:** read `CODEMAP.md` before exploring; update `progress.md` before ending a session.

Do not duplicate rules here — `AGENTS.md` and `.agents/` are the source of truth.

## Model delegation (Claude Code only)

Before starting a task, assess its complexity and delegate mechanical work to the
`simple-tasks` subagent (Haiku, `.claude/agents/simple-tasks.md`) to save cost and context.

**Delegate to `simple-tasks`:**
- Searching code, locating files/functions, reading and summarizing files
- Renames, formatting, typo/import fixes, small well-defined edits in 1–2 files
- Basic unit tests, docstrings, running tests/lint/build and reporting results
- **Git:** `status`, `diff`, `log`, staging, writing commit messages and committing (when the user asked for a commit)
- **Markdown upkeep:** updating `progress.md`, `TODO.md`, `CODEMAP.md`, registering entries in
  `docs/specs/INDEX.md`, fixing formatting/links, and turning decisions already made into written docs

**Keep in the main model:**
- Writing or changing spec content (requirements, design, decisions) under `docs/specs/`
- Game-engine logic: betting, all-in, side pots, hand ranking, timers, reconnects
- Architecture, technical decisions, non-obvious debugging, multi-file refactors
- Anything ambiguous or that requires reasoning across the whole project
- **Git operations that are hard to undo:** `push`, `rebase`, `reset --hard`,
  force operations, branch deletion, resolving merge conflicts — confirm with the user first

Rules:
- When a task mixes both, plan it yourself and delegate the mechanical parts.
- If the subagent fails or the result is weak, take the task back.
- Briefly review what the subagent returns before accepting it.
