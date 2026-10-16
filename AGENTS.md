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
YAYPOKER (yaypoker.com) — real-time multiplayer Texas Hold'em. Three independent npm packages (no root `package.json`, no workspaces, plain JavaScript — no TypeScript):

| Package | Stack | Role |
|---|---|---|
| `webSocket/` | Node 20 · CommonJS · Express 5 · `ws` · zod · Vitest | **Authoritative game server**: rooms/tournaments (`torneo.js`, `match.js`, `match/actions.js`, `match/lobby.js`), dealer, hand evaluation (`pokerCore.js`, `winnerCore.js`), side pots (`potDistributor.js`), odds (`pokerOdds.js`), certificates, contact mailer. All state is in memory — no database. |
| `client/` | Vue 3 · Vite 8 · Pinia · Tailwind 4 · vue-i18n · Vitest/jsdom | SPA; state in `src/store/pokerStore.js`, socket in `src/use/useSockets.js`, WebRTC voice in `src/use/useVoice.js`. Prerendered `/`, `/privacy`, `/terms`. |
| `bot/` | Node · Express · Gemini / DeepSeek / Ollama | LLM bot service: `POST /spawn` joins a room as a normal socket player. |

Prod: Docker Compose (`docker-compose-prod.yml`) behind Caddy (`Caddyfile`) on one VPS; client on :443, WebSocket + HTTP API on :8888.

## Commands (verified 2026-10-15)
Run inside each package (`cd webSocket|client|bot`). Use npm (lockfiles are `package-lock.json`); never pnpm.

| Task | Command |
|---|---|
| Install | `npm ci` |
| Tests (single run) | `npx vitest run` — `npm test` starts watch mode |
| One test | `npx vitest run -t "name"` (webSocket: `npm run test:name -- "name"`) |
| Lint (check only) | `npx eslint .` — `npm run lint` **auto-fixes**; bot has no ESLint config |
| Client build | `npx vite build` (prerender uses Puppeteer/Chromium) |
| Whole stack | `docker compose up -d --build` → http://localhost:5174 |
| CI (local-first) | `node ../harnes/scripts/harness.mjs ship check` — stages in `.harness.json`; needs Node ≥ 22 |

Baseline: webSocket 26 files / 152 tests (~65 s), client 15 tests, bot 9 tests; lint 0 errors.

## Skills that apply here
websocket-realtime (server + `useSockets.js`) · vue-frontend · testing-strategy · security-privacy · ux-invariants · observability · api-contracts (WS message shapes, zod) · release-deploy · cost-zero · spec-driven-development · code-review · context-economy. Use money-ledger thinking for **chip conservation**.
Not applicable: nestjs-backend, prisma-database, database-migrations, php-backend, go-backend, flutter-mobile.

## Domain invariants
- **Server is authoritative.** Hand ranking, pots, side pots, blinds, turn order, timeouts and odds are computed in `webSocket/`; the client and bots only render and send intents. Validate every inbound WS message (zod) and check it is the sender's turn.
- **Chips are conserved.** Sum of stacks + pots is constant within a tournament; all-in/side-pot/uncalled-bet changes need a test like `tests/allin_conservation.test.js`.
- **Hidden information stays hidden.** Never broadcast another player's pocket cards or the deck before showdown; secret room codes and certificate codes are not logged.
- **Timers come from `webSocket/constants.js` `TIMEOUTS`** (short values when `NODE_ENV=test`); don't hardcode delays.
- **Bots are ordinary players**: no privileged server paths for bot sockets.
- **UI element IDs** follow `[descriptive-name]-[TemplateSuffix]` (`-TemplateLarge|Medium|Small|XSmall`, `-Home`, … or bound `templateSuffix`) — see `client/GEMINI.md`. Layouts must work at 360 px (`TemplateXSmall`).
- Logging: `webSocket/logger.js` and `bot/logger.js` (winston/osolog); use them instead of `console.log` (a few legacy calls remain in `dealer.js`); never log emails from `/api/contact`.

## Secrets & deploy
- `.env`, `client/.env`, `webSocket/.env` (and `bot/.env` if present) and `DEPLOYMENT.md` are gitignored and contain credentials — do not read or print them; use the `.env.example` files.
- Deploy is manual (tarball + scp + compose rebuild on the VPS) and only with explicit human OK. Smoke: `https://yaypoker.com:8888/health`.

## Definition of done
`ship check` green (or, per touched package: lint + `vitest run` before and after) · game-rule changes come with a test in `webSocket/tests/` · client changes keep IDs convention and 360 px layout · no new dependency without OK · evidence in the PR.
