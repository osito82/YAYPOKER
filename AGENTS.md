# YAYPOKER — agent guide

<!-- oso-harness:begin v2.0.0 · managed block — edit it in harnes/core/managed-block.md, then run harness sync -->
## Oso Harness v2.0.0 · profile `node`

Shared rules, skills, and safety hooks for high-velocity software engineering. Compatible with AI agents (Antigravity, Cursor, Copilot, Gemini) via `.agents/skills/` and Claude Code via `oso@oso-harness`.

**Constitution — always applies:**
1. **Calculations & State:** server computes totals, balances, game mechanics and pricing; client only displays; critical state transitions are atomic, append-only, and idempotent.
2. **Privacy & Security:** never read, print or commit secrets (`.env*`, `*key*.json`, tokens, passwords); no PII in URLs or logs; query access strictly scoped by tenant/actor.
3. **Humans approve irreversible actions:** no deploy, production mutation, data deletion, migration edit, paid resource or new dependency without explicit OK; dry-run first.
4. **Users never get stuck:** creatable ⇒ editable and deletable/archivable; modals close with ✕/Esc/backdrop (except approval, destructive, dirty forms); no silent spinners; responsive at 360 px.
5. **Evidence over claims:** done = builds + relevant tests pass before and after + verified evidence; a fresh-context reviewer verifies the work.
6. **Small, reversible, specified:** spec first for non-trivial work; changes are small, additive, and modular.
7. **Frugal:** free tiers and scale-to-zero by default; spend context like money.
8. **Standards:** strict English in code, comments, models, and commits; structured logging (`osolog` / `Logger`); UUID v4 identifiers.

**Load the matching skill before working:** spec-driven-development · nestjs-backend · prisma-database · php-backend · websocket-realtime · vue-frontend · go-backend · flutter-mobile · api-contracts · database-migrations · testing-strategy · security-privacy · cost-zero · release-deploy · observability · context-economy · code-review · repo-audit · harness-evolution · money-ledger · ux-invariants

**Context economy:** read `CODEMAP.md` before exploring · grep, then read line ranges · never read lockfiles, generated code or build output · delegate wide searches to a subagent · run quiet, scoped commands · update `progress.md` before ending a session.

**Ship (local-first pipeline):** `node ../harnes/scripts/harness.mjs ship check` is the CI (evidence in `.tmp/pipeline/`) · `ship build` · `ship deploy --yes` only after explicit human OK on clean `origin/main` with green check + build for that SHA · `ship smoke` · `ship status`. Stages live in `.harness.json`.
<!-- oso-harness:end -->

## What this repo is
Node/TypeScript project in the Kiuvy workspace (describe its purpose in one paragraph — e.g. kiuvy-agent: the internal engineering agent "Hermes").

## Commands (fill in and verify)
| Task | Command |
|---|---|
| Install | `pnpm install --frozen-lockfile` |
| Tests | `pnpm test` |
| Lint / types | `pnpm lint` · `pnpm exec tsc --noEmit` |

## Conventions
Skills security-privacy (secrets, dependencies), testing-strategy, context-economy. An agent task is complete only when the affected project builds, relevant tests pass, regressions are considered, security is reviewed and evidence is reported.

## Definition of done
Tests and lint green before and after · no new dependency without OK · evidence in the PR.
