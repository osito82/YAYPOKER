# Progress Log

Recent sessions only.

## 2026-10-16 — Fixes from the production logs (branch `fix/log-findings`)

Found in `webSocket-2026-10-09.log` / `-10-16.log` and the bot logs on the VPS:
- Blinds went up after the first hand (`handCount % 10` with handCount 0) → `Match.handsPlayed()`.
- Min raise was BB − SB after the blinds (raise to 30 over BB 20 accepted) → last raise reset to
  the big blind when blinds complete.
- Blind levels 13/25, 17/32 → big blind is exactly 2× the rounded small blind (13/26, 17/34).
- Every Gemini call failed with 404 (`gemini-2.0-flash` shut down), bots always used the fallback →
  `gemini-3.5-flash-lite` (bot default, both compose files, npm script).
- Double click sent a second bet → client `useActionGuard` (one turn action until the server answers,
  3s safety timeout).
- Tests: `webSocket/tests/blinds_and_min_raise.test.js` (3, fail on the old code),
  `client/src/tests/use/useActionGuard.test.js` (3). webSocket 164, client 20, bot 9, lint, build OK.
- Still open (need specs): tournament lost on a 15s disconnect, certificates issued to bots,
  manual blinds.

## 2026-10-16 — Production deploy of `a505048` + deploy skill

- Deployed `main` (`a505048`) to the VPS: backup `/root/YAYPOKER-backup-20261016`, `git archive`
  upload, `down` + `up --build -d`. Checks: 4 containers up, `/health` healthy, home 200, new bundle
  served (tico heart, reconnect banner), `/Logs/certificates.json` no longer served. Downtime ~3 min.
- Learned: the client build fails while the old containers run (864 MB RAM, Chromium for prerender);
  `--rmi all -v` would have removed the rollback images and Caddy's certs; the tarball would have
  overwritten production `Logs/`. Prerender still logs "Unable to prerender all routes" (SEO only);
  Caddy cannot get a cert for `osongo.duckdns.org`.
- New project skill `.claude/skills/yaypoker-deploy/SKILL.md`; SSH key auth set up for root.

## 2026-10-16 — Quick wins from the UX analysis (branch `fix/quick-wins-game-safety`)

- Server no longer obeys client `dealtPrivateCards`; `nextRound` only after a tournament ends;
  `startGame` is ignored once the game runs and table settings (blinds, ante, initial stack) are
  host-only, private-only, pre-start and zod-validated. The lobby's initial stack now works.
- Stacks are server-owned (client `totalChips` only honoured under `NODE_ENV=test`).
- Turn timeout auto-checks when there is nothing to call (still folds facing a bet / on blinds).
- No hand is dealt while every player with chips sits out; resumes when one returns (tables used
  to play themselves forever).
- Spectators (`role=guest`) never take a seat or knock players off; same-name joins get a
  `NAME_TAKEN` message instead of hanging.
- WebSocket: 20s ping/pong heartbeat, 1 MiB max payload, voice limited to seated players and
  rate-limited, socket registry cleaned on close. Secrets removed from logs and from the
  tournament-winner broadcast. `Logs` no longer mounted into the client web root (read over
  SSH/FTP from `./Logs` on the host). (The public `Logs` mount in docker-compose was kept on purpose.)
- Client: reconnect with exponential backoff + jitter, immediate reconnect on `online` /
  tab visible, "Reconnecting…" banner, no action controls while offline.
- Tests: new `webSocket/tests/client_guardrails.test.js` (9); updated `allin_conservation`,
  `allin_uncalled_bet` (seed blinds server-side) and `gameplay` T0006 (expects `NAME_TAKEN`).
  webSocket 161 tests: 4 of 5 full runs green (1 run had 1 unidentified failure; baseline was
  already flaky, e.g. T0006 failed 1 of 3 before these changes). Client 15, bot 9, lint, build OK.

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
