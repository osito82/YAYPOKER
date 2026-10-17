# OPS-001 · Server-issued session tokens

- **Level:** M · **Status:** implemented (pending deploy) · **Owner:** Guillermo · **Created:** 2026-10-16
- **Repos:** webSocket, client, bot · **Depends on:** GAM-001 (reconnect flow) · **Flags:** —
- **Gate:** nothing is implemented without explicit OK on §1 and §4.

## 0 — Inherited invariants

| Invariant | How it is preserved |
|---|---|
| Secret codes never broadcast or logged (game-engine §4) | The session token follows the same rule: sent only in the owner's private `signUp`, never in `players[]`, never logged. |
| Validate every inbound message (§2) | Token and PIN are checked in `signUp` before any seat is touched. |
| No persistence without a spec (§7) | Tokens live in memory with the match. |

## 1 — Audit (current state)

- The 4-digit PIN in the URL (`/play/:gameCode/:secretCode`) is the session. `Socket.addSocket`
  (`sockets.js`) deletes any existing socket with the same `secretCode` **at connection time**, before
  any check → a second player who picks the same PIN drops the first player's socket.
- `lobby.signUp` matches the existing seat by `secretCode` alone; a different name gets
  `PIN_COLLISION`. 10 000 PINs, no attempt limit → a seat can be taken over by brute force (name is
  public).
- Private messages are routed by PIN (`Socket.sendToPlayer(torneoId, secretCode)`).
- Public tables already use a UUID as `secretCode`; bots use a random 6-char code.
- The PIN also seeds the winner certificate code (`WinnerCertificate.generateMagicCode`) — unchanged.
- **Decision (human, 2026-10-16):** server token for reconnects; PIN + name may recover a seat from
  another device only while the player is disconnected, with an attempt limit.

## 4 — Requirements (EARS)

- R-01 WHEN a new player is seated THE SYSTEM SHALL issue a random session token (UUID v4) and send it
  only in that player's private `signUp`.
- R-02 WHEN a connection presents the session token of a seated player THE SYSTEM SHALL reconnect it to
  that seat (also when the old socket is still open, which is then closed with code 4000 "replaced").
- R-03 WHEN a connection presents name + PIN of a seated player who is disconnected THE SYSTEM SHALL
  reconnect it and rotate the session token.
- R-04 IF name + PIN is wrong, or the seat is connected and no token is presented, THEN THE SYSTEM
  SHALL reject with `NAME_TAKEN` and count a failed attempt against that seat.
- R-05 IF a seat has 5 failed attempts within 10 minutes THEN THE SYSTEM SHALL refuse PIN recovery for
  that seat for 10 minutes (`TOO_MANY_ATTEMPTS`); token reconnects keep working.
- R-06 THE SYSTEM SHALL never drop or replace another player's socket because two players chose the
  same PIN; two players may share a PIN.
- R-07 THE SYSTEM SHALL route private messages by the player's current socket, not by PIN.
- R-08 WHEN the client receives a session token THE SYSTEM SHALL store it per game code
  (`localStorage`) and send it on every reconnect; bots keep theirs in memory.

## 6 — Edge cases

| Case | Player sees | Backend does |
|---|---|---|
| Same browser, second tab | first tab gets "replaced", second plays | token reconnect, old socket closed |
| Phone after laptop died | enters name + PIN, gets the seat | PIN recovery (seat disconnected), token rotated |
| Attacker guesses PINs for a connected seat | `NAME_TAKEN` | attempt counted, seat untouched |
| Two friends both pick 1234 | both play | no collision |
| Game not started, name taken | joins as "Name-1" (unchanged) | — |

## 7 — Design

- `app.js`: read `sessionToken` from the query; `thisSocket.sessionToken`.
- `sockets.js`: `addSocket` no longer evicts by `secretCode`; `sendToPlayer(torneoId, player, data)`
  routes by `player.id` (the current socket id); old signature callers migrated.
- `lobby.signUp`: match order token → (name + PIN, seat disconnected, not locked) → new seat. Failed
  attempts tracked in `match.pinAttempts` (Map seatName → timestamps).
- `Player.sessionToken` excluded from `toJson`; never in logs.
- Client `pokerStore`: save `sessionToken` on private `signUp`; `useSockets` URL adds it; remove the
  `PIN_COLLISION` redirect (keep `NAME_TAKEN`). Bot: keep token, use it on reconnect.

## 8 — Contract changes

| Item | Change | Compatible? |
|---|---|---|
| WS URL | optional `sessionToken` query param | yes |
| private `signUp` | adds `sessionToken` | additive |
| errors | `PIN_COLLISION` removed; `TOO_MANY_ATTEMPTS` added | client updated in the same release |

## 12 — Test plan / 13 — Acceptance criteria

| ID | Criterion | Test |
|---|---|---|
| AC-01 | Same PIN, different names: both stay connected | `tests/session_tokens.test.js` |
| AC-02 | Token reconnect works while the old socket is open (old closed with 4000) | same |
| AC-03 | PIN recovery only when disconnected; rotates token | same |
| AC-04 | 5 wrong PINs lock recovery for the seat | same |
| AC-05 | Token never appears in public messages | same |
| AC-06 | Client stores/sends the token | `client/src/tests/use/sessionToken.test.js` |
| AC-07 | Existing reconnect suites green | `cd webSocket && npx vitest run` |

## Evidence (2026-10-16)

- Approved 2026-10-16 (Guillermo). Implemented on branch `feat/gam-ops-specs`.
- Tests: `tests/session_tokens.test.js` (AC-01..05), `client/src/tests/use/sessionToken.test.js` (AC-06), `tests/match.test.js`, `tests/sockets.test.js`, `tests/gameplay.test.js` T0012 (AC-07).
- Commands: `cd webSocket && npx vitest run` (196 passed) and `npx eslint . --max-warnings=0`;
  `cd client && npx vitest run` (24 passed), `npx eslint .`, `npx vite build`; `cd bot && npx vitest run` (9 passed).
- Not yet verified by a fresh-context evaluator or in production.
