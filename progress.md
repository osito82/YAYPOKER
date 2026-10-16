# Progress Log

Recent sessions only.

## 2026-10-15 — Harness adapted to YAYPOKER (modeled on sociablesquad)

- `AGENTS.md`: repo-owned "Harness adaptation" section (real stack, skill applicability table,
  local conventions), overview, key files, verified commands and a numbered rules index.
- New `.agents/rules/`: `code-standards.md`, `game-engine.md`, `ui-standards.md`,
  `secrets-and-deploy.md`, `spec-workspace.md`, `rule-management.md`.
- `CLAUDE.md` (pointers + model delegation), `.claude/agents/simple-tasks.md` (Haiku subagent),
  `.github/copilot-instructions.md`, `docs/specs/INDEX.md` (families GAM/UXP/BOT/OPS), `TODO.md`.
- `.harness.json` pipeline: lint + `vitest run` per package + client build; compose build; manual
  deploy; health smoke.
- Evidence: webSocket 152 tests, client 15, bot 9 — all pass; eslint 0 errors; client build OK.
