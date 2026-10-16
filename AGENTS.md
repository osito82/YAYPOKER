# YAYPOKER — Core Project Guidelines & Context

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

## 🧩 Harness adaptation for this repository

The block above is a **generic template imported from an external harness** (`../harnes`). It is rewritten by `harness sync`, so never edit it here. This section is owned by this repository and **wins over the block and over any skill** whenever they disagree; `.agents/rules/` wins over both.

**What this project actually is** (use this instead of whatever stack a skill assumes):

- Three independent npm packages — `webSocket/`, `client/`, `bot/` — with no root `package.json`, no workspaces, no Turborepo. npm, not pnpm. Plain JavaScript, no TypeScript.
- `webSocket/`: Node 20 · CommonJS · Express 5 · `ws` (not Socket.io) · zod. **Authoritative poker engine**; all state in memory — no database, no Prisma, no migrations.
- `client/`: Vue 3 + Vite 8 + Pinia + Tailwind 4 + vue-i18n SPA, prerendered `/`, `/privacy`, `/terms` — not Nuxt, not Vuetify.
- `bot/`: Express service that spawns LLM players (Gemini, DeepSeek, Ollama) via `POST /spawn`.
- No user accounts or auth: players join rooms by code.
- Vitest everywhere (jsdom on the client) — no Playwright.
- Production: one VPS with Docker Compose + Caddy, deployed by hand; git remote `origin` = GitHub.

**Skills** (`.agents/skills/`, local-only: the folder is git-ignored and re-copied by `harness sync`, so never edit skills in place):

| Use | Skills |
|---|---|
| Apply as written | `websocket-realtime` · `testing-strategy` · `security-privacy` · `code-review` · `context-economy` |
| Apply the method, ignore the stack details (written for other products: NestJS, Nuxt, pnpm, Firebase, Cloud Run, Playwright) | `spec-driven-development` · `vue-frontend` · `api-contracts` (WS message shapes) · `observability` · `ux-invariants` · `money-ledger` (chip conservation only) · `release-deploy` (local pipeline only) · `cost-zero` · `repo-audit` |
| Not applicable here — do not load | `nestjs-backend` · `prisma-database` · `database-migrations` · `php-backend` · `go-backend` · `flutter-mobile` · `harness-evolution` |

**Local conventions that replace harness defaults:**

- **Specs:** `docs/specs/<ID>-<slug>/` + the 5-column `docs/specs/INDEX.md` (`spec-workspace.md`). Do not run the skill's `new-spec.mjs` scaffold. One session log: root `progress.md`.
- **Code map:** regenerate with `node .agents/skills/context-economy/scripts/codemap.mjs --root . --out CODEMAP.md`. The "kiuvy-harness" name in its header is expected.
- **Pipeline:** `node ../harnes/scripts/harness.mjs ship check` (needs Node ≥ 22) runs lint + `vitest run` for each package and a client build (stages in `.harness.json`). `ship build` builds the prod images; `ship deploy` is manual (`secrets-and-deploy.md`); `ship smoke` hits the prod health endpoint.
- **Logging:** `webSocket/logger.js` / `bot/logger.js` (winston + `osolog`), see `code-standards.md` §3.
- **Deploy:** project skill `yaypoker-deploy` (`.claude/skills/yaypoker-deploy/SKILL.md`) — the only supported way to update production; it replaces the tarball steps in the local `DEPLOYMENT.md`.

---

## ✅ Pending work

`TODO.md` (repo root) is the index of agreed pending work and known gaps. Read it before choosing what to do next; remove an item when it is done and add any gap you find.

## 📌 Project Overview

**YAYPOKER** ([yaypoker.com](https://yaypoker.com)) is a real-time multiplayer Texas Hold'em platform: private rooms and public tables identified by codes, tournaments with rising blinds, side pots, live odds, winner certificates, WebRTC voice chat and LLM-driven bots that fill empty seats.

## 📄 Specs & Documentation

Non-trivial work follows the `spec-driven-development` skill; specs live in `docs/specs/` and are listed in `docs/specs/INDEX.md` (families `GAM`, `UXP`, `BOT`, `OPS`). Workflow: audit → spec (Level S/M/L) → human OK → build → evidence; then update the spec, `tasks.md`, the index and `progress.md`. See `.agents/rules/spec-workspace.md`.

## 🛠️ Tech Stack & Architecture

| Package | Key files |
|---|---|
| `webSocket/` | `app.js` (HTTP routes + WS entry, zod schemas) · `torneo.js`, `match.js`, `match/{actions,lobby,comms}.js` (rooms, betting, lobby) · `dealer.js`, `deck.js` · `pokerCore.js`, `winnerCore.js` (hand ranking) · `potDistributor.js` (side pots) · `pokerOdds.js` (Monte Carlo) · `constants.js` (`TIMEOUTS`, `GAME_RULES`) · `mailer.js`, `winnerCertificate.js` |
| `client/` | `src/store/pokerStore.js` (game state) · `src/use/useSockets.js`, `useVoice.js` · `src/pages/` (`Game.vue`, `templates/`, `actionBarTemplates/`) · `src/components/` (`PokerTable`, `ActionBar`, `Chip`, overlays) · `src/locales/{en,es}.json` · `src/vutils.js` (runtime URLs) |
| `bot/` | `bot.js` (spawn API + LLM decision loop) · `logger.js` |

## Commands (verified 2026-10-15)

Run inside each package (`cd webSocket|client|bot`).

| Task | Command |
|---|---|
| Install | `npm ci` |
| Tests (single run) | `npx vitest run` — `npm test` starts watch mode |
| One test | `npx vitest run -t "name"` |
| Lint (check only) | `npx eslint .` — `npm run lint` **auto-fixes**; `bot/` has no ESLint config |
| Client build | `npx vite build` (prerender uses Puppeteer/Chromium) |
| Whole stack | `docker compose up -d --build` → http://localhost:5174 |
| CI (local-first) | `node ../harnes/scripts/harness.mjs ship check` |

Baseline: webSocket 26 files / 152 tests (~65 s), client 15 tests, bot 9 tests; lint 0 errors.

## 📋 Project Rules (index)

The full text of every rule lives in `.agents/rules/` — **that directory is the single source of truth**. This index only names each rule; do not restate details here. Numbers are stable (code comments and specs may cite "AGENTS.md Rule N"): never renumber, only append.

| # | Rule | Source of truth |
|---|---|---|
| 1 | Language: English code, docs and commits; on-screen text through vue-i18n (`en` + `es`) | `code-standards.md` §1 |
| 2 | Testing: Vitest, single-run commands, every game-rule change ships with a server test | `code-standards.md` §2 |
| 3 | Logging through `logger.js` (winston/osolog); no new raw `console.*`; nothing sensitive in logs | `code-standards.md` §3 |
| 4 | Lint check vs auto-fix, Prettier | `code-standards.md` §4 |
| 5 | Git: Conventional Commits, commit/push only on explicit request, `--no-ff` merges, keep branches | `code-standards.md` §5 |
| 6 | Server-authoritative engine and validated inbound messages | `game-engine.md` §1–2 |
| 7 | Chip conservation | `game-engine.md` §3 |
| 8 | Hidden information: cards never broadcast early, but kept in private server logs; secret codes never logged | `game-engine.md` §4 |
| 9 | Timers and rule constants from `constants.js`; bots are ordinary players; in-memory state | `game-engine.md` §5–7 |
| 10 | Element IDs `[descriptive-name]-[TemplateSuffix]` | `ui-standards.md` §1 |
| 11 | Responsive templates, 360 px, display-only client, modals, runtime URLs | `ui-standards.md` §2–6 |
| 12 | Secrets, production layout, manual deploy, smoke, cost | `secrets-and-deploy.md` |
| 13 | Specs: location, IDs, levels, approval gate | `spec-workspace.md` |
| 14 | Ask the user about rule updates after significant changes | `rule-management.md` |

## Definition of done

`ship check` green (or, per touched package, lint + `npx vitest run` before and after) · rules above respected · no new dependency without OK · `progress.md` updated · evidence in the PR/commit.
