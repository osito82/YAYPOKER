# TODO

Pending work agreed with the product owner and known gaps, in one place. Specs hold the detail;
this list is the index. When something here is done, remove it (and record it in `progress.md`);
when a new gap is found, add it with where it comes from.

Last reviewed: 2026-10-16.

## Next

- [ ] **Rotate the VPS root password and switch to SSH keys** — `DEPLOYMENT.md` (gitignored, never
      committed) stores it in plain text. Disable root password login afterwards.
- [ ] **Node ≥ 22 locally** — the harness CLI (`ship check`) refuses Node 20.19; Dockerfiles also use
      `node:20-alpine`.

## Game & connection (from the 2026-10-16 UX analysis — need specs, Level M)

- [ ] **GAM — automatic blinds + one bet validator**: blinds are posted by hand (client guesses the
      amount from the message text); `setBet` accepts bets below the call and skips the min-raise
      rule; decimals accepted.
- [ ] **GAM — action order**: post-flop starts at `players[1]` (BB) with 3+ players
      (`match/actions.js` bettingCore); blinds use active players but order uses all players.
- [ ] **GAM — leaving mid-hand loses pot chips**: pots are rebuilt from the players still in the
      list; `playerLeave` splices the leaver (private tables do not even fold them first).
- [ ] **GAM — tournament ends on a disconnect**: winner/nextRound count only *connected* players
      with chips.
- [ ] **GAM/OPS — identity**: 4-digit PIN in the URL is the session; brute-forceable, collisions make
      `Socket.addSocket` drop another player's socket. Move to a server-issued UUID session token.
- [ ] **GAM/UXP — disconnects**: one disconnect pauses the whole table (60s private / 15s public)
      and then removes the player for good; reconnecting resets the active player's turn clock;
      reconnecting to a public table can redirect to another table (`app.js` public lobby logic).
      Proposal: no table pause, auto check/fold, keep the seat, 20–25s turns + time bank.
- [ ] **GAM — folded hands revealed** at showdown/runout (`communicator.censoredPlayersInfo`).
- [ ] **BOT — slow bots**: 25s LLM timeout; aim for 6–8s with a heuristic fallback.
- [ ] **Deploy the quick wins** (branch `fix/quick-wins-game-safety`).

## Gaps

- [ ] `bot/` has no ESLint config (only Prettier); add one so `ship check` can lint it.
- [ ] Raw `console.log` in `webSocket/dealer.js` (`talkToSocketById`, `talkToAllSockets`) → `logger`.
- [ ] Lint warning: unused `err` in `client/src/pages/Contact.vue:206`.
- [ ] `npm test` runs Vitest in watch mode in all packages; consider `"test": "vitest run"`.
- [ ] Most client text is hardcoded; vue-i18n (`en`/`es`) is used in only a few components.
- [ ] `webSocket/utils.js` requires `uuid`, but `package.json` declares `uuidv4`; it works only because
      `uuid` is a transitive dependency. Declare `uuid` (or use `crypto.randomUUID`) — needs OK.
- [ ] Unused `webSocket` devDeps/deps: `mocha`, `chai` (no tests use them) and the `http` placeholder package.
- [ ] `README.md` links `DEPLOYMENT.md` with an absolute `file:///home/...` path.
