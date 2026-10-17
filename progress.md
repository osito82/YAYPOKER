# Progress Log

Recent sessions only.

## 2026-10-17 — OPS-003 SEO (branch `feat/ops-003-seo`)

- Approvals: 2026-10-17 direction (fix SEO, `/es` URLs, rules + hand rankings pages) and spec OK
  (Guillermo).
- Built: build-time Vue SSR prerender (`client/scripts/prerender.mjs`, jsdom globals, no Chromium) of
  14 pages (7 × en/es), `dist/app.html` (noindex shell), `dist/404.html`, generated sitemap;
  `client/nginx.conf` (real 404s, trailing-slash 301, noindex app routes); Caddy `www` → apex 301;
  new `/rules` and `/hand-rankings`; `og-image.jpg`; theme applied before paint.
- Verified locally (nginx:alpine container + browser); client 34/34, webSocket 196/196.
- Deployed 2026-10-17 (`c01a214`): backup `/root/YAYPOKER-backup-20261017-1903`, VPS build ran the
  prerender (14 pages), prod checks OK (titles per page, 301s, noindex app routes, 404s incl.
  `/Logs/*`, og-image, sitemap 14 URLs, `www` → apex, lobby loads). 79 merged remote branches and 99
  local ones deleted (owner OK); 5 unmerged kept: callButton, integrated-bots, reOrg, sidePot, winston.
- Pending: AC-10 text review; submit the sitemap in Google Search Console (owner); delete old
  server backups once confirmed.

## 2026-10-17 — Production deploy of `5ab037f` (GAM-001..003, OPS-001..002)

- `yaypoker-deploy` skill: backup `/root/YAYPOKER-backup-20261017-0314`, old
  `/root/YAYPOKER-backup-20261016` deleted (OPS-002 R-04; kept `-20261016-2351` and the new one),
  `git archive` upload, `down` + `up --build -d` (UP_EXIT=0, no prerender/Chromium in the build).
- Checks: 4 containers up, `/health` healthy, home 200, `certificates.json` served as text/html, new
  bundle `index-Ce84qf_5.js` contains the session-token code.
- Live smoke (two scripted players, temporary private table): same PIN → both connected, session
  token issued and not leaked, `blindsPosted` "SB 10 / BB 20", no `askForBlindBets`, first turn
  fold/call/raise; table removed afterwards (0 tournaments).
- Pending: watch the next real games' logs (`MATCH:IDLE`, `LOBBY:PLAYER_DISCONNECTED`, bot
  `AI:GEMINI_REQUEST`).

## 2026-10-16 — Specs GAM-001..003, OPS-001..002 implemented (branch `feat/gam-ops-specs`)

- Approvals: 2026-10-16 direction + spec OK (Guillermo). Decisions: keep the seat on disconnect,
  token + rate-limited PIN, drop prerender, no certificate for bot winners, per-player ante.
- GAM-001: no table pause; disconnected seats are dealt in, post blinds and auto check/fold after 10 s;
  reconnect keeps the turn clock; no humans connected → `tableIdle` (NO_HUMANS); public seats freed
  after 60 s; leaving mid-hand folds and keeps the chips in the pot (was losing them: 2000 vs 2020).
- GAM-002: server posts antes/blinds (`blindsPosted`), one `validateBet` (decimals, below call, min
  bet 1 BB, min raise, incomplete all-in does not reopen); order from hand seats (post-flop starts at
  the SB). Found and fixed: after any action the turn restarted from the first seat of the street
  (now continues clockwise from the last actor, R-10). `tests/tournament.test.js` rewritten (it
  encoded the old wrong order).
- GAM-003: fold wins no longer reveal the winner's cards; folded cards kept in the log
  (`muckedCards`); bot winners get no certificate; `totalPlayers` counts entrants; "Robot" is human.
- OPS-001: session token (UUID) in the private signUp; PIN + name only recovers a disconnected seat,
  5 failures / 10 min lock; sockets no longer evicted by PIN; private messages routed by socket id;
  client stores the token per table and stops reconnecting on close code 4000.
- OPS-002: prerender/Puppeteer/Chromium removed, `osongo` removed from the Caddyfile, skill updated.
- Client blind-button removal delegated to the `simple-tasks` subagent (reviewed).
- Evidence: webSocket 196 passed + eslint clean; client 24 passed, eslint (1 old warning), build OK;
  bot 9 passed. Not deployed.
- Browser test (local, 2026-10-16): auto blinds, UTG-first and SB-first post-flop order, min raise
  40 / min bet 20, reload mid-turn keeps seat/cards/turn, second tab takes the seat without
  ping-pong, disconnect → `MATCH:IDLE NO_HUMANS` (no bot tournament win) → reconnect resumes
  (blinds 13/26 after 10 hands). Fixes from it: "open in another tab" banner instead of
  "Reconnecting…", `MATCH:IDLE` log line; test grace for disconnected turns 3 s.

## 2026-10-16 — Production deploy of `830d2ee` (log findings)

- Deployed with the `yaypoker-deploy` skill: backup `/root/YAYPOKER-backup-20261016-2351`,
  `git archive` upload, `down` + `up --build -d` (UP_EXIT=0). Checks: 4 containers up, `/health`
  healthy, home 200, new bundle served, `/Logs/certificates.json` not served.
- Verified in production: blinds stayed 10/20 after the first hand (h1); a direct call from the bot
  container to `gemini-3.5-flash-lite` answered in 780 ms (was 404 on every call before).
- Skill fixed: backup name now includes the time (a same-day backup used to nest inside the
  previous one) and a bot/Gemini smoke check was added.
- Seen again: the human disconnected and the bot won the tournament after 15 s (open item).

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
