# TODO

Pending work agreed with the product owner and known gaps, in one place. Specs hold the detail;
this list is the index. When something here is done, remove it (and record it in `progress.md`);
when a new gap is found, add it with where it comes from.

Last reviewed: 2026-10-16.

## Next

- [ ] **Rotate the VPS root password and disable password login** (SSH key auth works since 2026-10-16) — `DEPLOYMENT.md` (gitignored, never
      committed) stores it in plain text. Disable root password login afterwards.
- [ ] **Node ≥ 22 locally** — the harness CLI (`ship check`) refuses Node 20.19; Dockerfiles also use
      `node:20-alpine`.

## Game & connection (from the 2026-10-16 UX analysis)

Done in GAM-001..003, OPS-001..002 (see `docs/specs/INDEX.md`). Still open:

- [ ] **BOT — slow bots**: 25s LLM timeout; aim for 6–8s with a heuristic fallback.
- [ ] **OPS — delete old `/root/YAYPOKER-backup-*`** on the VPS once the next release is confirmed
      (OPS-002 R-04, keep only the newest rollback point).

## Gaps

- [ ] Dead-button rule when a player busts (GAM-002 non-goal).
- [ ] PIN still travels in the `/play/:gameCode/:secretCode` URL; with OPS-001 it only recovers a
      disconnected seat (rate limited), but it could move out of the URL.
- [ ] `gameplay.test.js` T0003/T0007 are timing-sensitive under load (failed 2 of 6 full runs on
      2026-10-16 while the local server and a browser were running); move them to the cursor-based
      helper in `tests/helpers/tableClient.js`.
- [ ] Turn length (60 s / 45 s) and a time bank were not changed (GAM-001 non-goal).
- [ ] `bot/` has no ESLint config (only Prettier); add one so `ship check` can lint it.
- [ ] Raw `console.log` in `webSocket/dealer.js` (`talkToSocketById`, `talkToAllSockets`) → `logger`.
- [ ] Lint warning: unused `err` in `client/src/pages/Contact.vue:206`.
- [ ] `npm test` runs Vitest in watch mode in all packages; consider `"test": "vitest run"`.
- [ ] Most client text is hardcoded; vue-i18n (`en`/`es`) is used in only a few components.
- [ ] `webSocket/utils.js` requires `uuid`, but `package.json` declares `uuidv4`; it works only because
      `uuid` is a transitive dependency. Declare `uuid` (or use `crypto.randomUUID`) — needs OK.
- [ ] Unused `webSocket` devDeps/deps: `mocha`, `chai` (no tests use them) and the `http` placeholder package.
- [ ] `README.md` links `DEPLOYMENT.md` with an absolute `file:///home/...` path.
