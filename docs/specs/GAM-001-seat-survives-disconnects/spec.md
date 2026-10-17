# GAM-001 · Seat survives disconnects and mid-hand leaves

- **Level:** M · **Status:** implemented (pending deploy) · **Owner:** Guillermo · **Created:** 2026-10-16
- **Repos:** webSocket, client · **Depends on:** — · **Flags:** —
- **Gate:** nothing is implemented without explicit OK on §1 and §4.
- Covers TODO items "tournament ends on a disconnect", "disconnects pause the table", "leaving mid-hand
  loses pot chips".

## 0 — Inherited invariants

| Invariant | How it is preserved |
|---|---|
| Chips are conserved (game-engine §3) | A player who leaves mid-hand stays in `players` (folded, `left`) until the hand ends, so their contribution stays in the pot layers. New conservation test. |
| Server is authoritative (§1) | All timers (turn grace, seat release) run on the server from `TIMEOUTS`. |
| Hidden information (§4) | Disconnected players are never revealed; nothing about cards changes here. |
| Timing from constants (§5) | New `TIMEOUTS.disconnectedTurn`, `TIMEOUTS.publicSeatRelease`. |

## 1 — Audit (current state)

- `app.js` `ws.on('close')` → `lobby.pause()` for humans (`match/lobby.js` `pause`): grants step `pause`
  (whole table stops), and after 60 s private / 15 s public calls `playerLeave` → the player is
  **spliced** from `players`.
- `match/actions.js` `winner()`: `playersWithChips = players.filter(chips > 0 && connected)` → a
  disconnected human with chips is ignored, so the remaining bot "wins the tournament" (seen twice in
  production, 2026-10-16).
- `match.js` `nextRound()` counts only connected players with chips.
- `getActivePlayers(true)` (connected only) is used by `fold`, `askForBlindBets`, `bettingCore`:
  a disconnected player silently drops out of the hand; `dealer.dealCardsEachPlayer` skips them.
- `playerLeave` splices the leaver mid-hand; `dealer.calculatePots()` builds layers from the players
  still in the list, so the leaver's `handContribution` disappears → chips destroyed. Private tables do
  not fold the leaver first.
- Reconnect (`lobby.signUp` existing player) → `sendCurrentPrompt` → `bettingCore(…, isRefresh)` →
  `startAutofold()` restarts the full turn clock.
- `app.js` public lobby logic redirects a reconnecting player to another public table when a
  "waiting" table exists.
- **Decision (human, 2026-10-16):** keep the seat; no table pause; auto check/fold after a short
  grace; public seats freed after 60 s disconnected between hands; table stops when no human is
  connected.

## 2 — Problem and outcome

- A network blip (phone switching networks, tab asleep) costs a human the whole tournament and pauses
  everybody else. Outcome: a disconnect never ends a tournament by itself and never pauses the table.
- Non-goals: changing normal turn length (60 s / 45 s), time bank, persistence across server restarts.

## 4 — Requirements (EARS)

- R-01 WHEN a seated player's socket closes during a running game THE SYSTEM SHALL keep the player
  seated with their chips, mark them `connected: false`, broadcast `playerDisconnected`, and SHALL NOT
  pause the table.
- R-02 WHILE a player is disconnected THE SYSTEM SHALL deal them in and post their blinds like any other
  seated player.
- R-03 WHEN it is a disconnected player's turn THE SYSTEM SHALL wait `TIMEOUTS.disconnectedTurn`
  (10 s) and then check if checking is legal, otherwise fold.
- R-04 WHEN the active player disconnects THE SYSTEM SHALL shorten their remaining turn to at most
  `TIMEOUTS.disconnectedTurn`.
- R-05 WHEN a disconnected player reconnects during their turn THE SYSTEM SHALL resend the prompt and
  give them the remainder of the normal turn (measured from `turnStartedAt`), never a fresh clock.
- R-06 WHEN a hand ends THE SYSTEM SHALL decide the tournament winner from all seated players with
  chips, connected or not.
- R-07 WHEN a hand ends and no human player is connected THE SYSTEM SHALL not deal the next hand,
  broadcast `tableIdle`, and resume when a human reconnects.
- R-08 WHEN a hand ends on a public table THE SYSTEM SHALL release the seat of every player
  disconnected for longer than `TIMEOUTS.publicSeatRelease` (60 s).
- R-09 WHEN a player leaves (`close` action, abandonment, bot socket close) during a hand THE SYSTEM
  SHALL fold them (on private and public tables), keep their contribution in the pot, and remove them
  from the table when the hand ends.
- R-10 WHEN a player reconnects to a public table they are seated at THE SYSTEM SHALL keep them on
  that table (no lobby redirect).
- R-11 WHEN the game has not started and a player disconnects THE SYSTEM SHALL remove them as today.
- R-12 WHEN the garbage collector removes an inactive match THE SYSTEM SHALL close the sockets still
  attached to it (bots included).

## 5 — Player connection states

| State | Entered when | Exits to | Timeout | Player sees | Table sees |
|---|---|---|---|---|---|
| connected | signUp / reconnect | disconnected, left | — | normal game | normal seat |
| disconnected | socket close after start | connected (reconnect), left (public release) | 60 s public release, checked between hands | reconnect banner (client) | seat greyed "disconnected", auto check/fold |
| left | `close`, abandonment, release | — (removed at hand end) | — | lobby | "X left", seat removed next hand |

## 6 — Edge cases

| Case | Player sees | Table sees | Backend does |
|---|---|---|---|
| Heads-up human vs bot, human drops | banner, comes back to same stack | hand finishes (auto fold/check), then `tableIdle` | no tournament winner while human has chips |
| Two humans, one drops for 5 min (private) | — | disconnected player is blinded and folds each hand | tournament continues; may bust them out normally |
| Leaver was the host | — | `newHost` | host passes to first connected player |
| Active player leaves | — | fold | fold flow, then `left` |
| Everyone disconnected on public table | — | — | existing empty-table cleanup (30 s) still runs |

## 7 — Design

- `lobby.pause` → `lobby.markDisconnected`: `setConnected(false)`, `disconnectedAt = now`, broadcast;
  if active player, re-arm the autofold timer with `min(remaining, disconnectedTurn)`. Step `pause` is
  no longer granted (kept in StepChecker for compatibility).
- `getActivePlayers()` default changes to "started and not folded" (connection ignored) for hand logic;
  `dealCardsEachPlayer` deals to `isStarted && !folded`.
- `bettingCore`: if the chosen player is disconnected → `startAutofold(disconnectedTurn)`.
- `Player.left` flag; `playerLeave` during a running hand folds + marks `left`; `restartMatch` drops
  `left` and busted players; before the game starts it still splices.
- `nextRound`: release stale public seats, check tournament end over seated players with chips, then
  `idleNoHumans` (like `idleAllSittingOut`); `signUp` reconnect resumes it.
- `startAutofold(duration)` takes an optional duration; `sendCurrentPrompt` re-arms with the remaining
  time instead of restarting.
- Client: `playerDisconnected` shows a toast/seat badge (no pause countdown); `tableIdle` already shown.

## 8 — Contract changes

| Message | Change | Compatible? |
|---|---|---|
| `playerPaused` | replaced by `playerDisconnected` `{ playerId, displayMsg }` | old clients ignore unknown action |
| `tableIdle` | also sent with `reason: 'NO_HUMANS'` | yes |
| `players[].connected` | already present; now meaningful during a hand | yes |

## 12 — Test plan / 13 — Acceptance criteria

| ID | Criterion | Test |
|---|---|---|
| AC-01 | Disconnect mid-hand: no pause, player stays seated with chips | `tests/disconnect_keeps_seat.test.js` |
| AC-02 | Disconnected player's turn auto-checks/folds after `disconnectedTurn` | same file |
| AC-03 | Heads-up: human disconnects, bot does not win the tournament; table goes idle; reconnect resumes | same file |
| AC-04 | Reconnect during own turn does not restart the clock | same file |
| AC-05 | Leave mid-hand (private): chips conserved, leaver removed next hand | `tests/leave_mid_hand.test.js` |
| AC-06 | Public: seat released after 60 s disconnected, between hands | `tests/disconnect_keeps_seat.test.js` |
| AC-07 | Public reconnect is not redirected to another table | `tests/public_reconnect.test.js` (extended) |
| AC-08 | Full webSocket suite green | `cd webSocket && npx vitest run` |

## 16 — Pending

- None.

## Evidence (2026-10-16)

- Approved 2026-10-16 (Guillermo). Implemented on branch `feat/gam-ops-specs`.
- Tests: `tests/disconnect_keeps_seat.test.js` (AC-01..04, AC-06), `tests/leave_mid_hand.test.js` (AC-05: 2020 chips, was 2000 before the fix), `tests/public_reconnect.test.js` (AC-07), `tests/gameplay.test.js` T0003/T0006, `tests/dealer.test.js`. Client: offline seat badge (`PlayerMap.vue`).
- Commands: `cd webSocket && npx vitest run` (196 passed) and `npx eslint . --max-warnings=0`;
  `cd client && npx vitest run` (24 passed), `npx eslint .`, `npx vite build`; `cd bot && npx vitest run` (9 passed).
- Not yet verified by a fresh-context evaluator or in production.
