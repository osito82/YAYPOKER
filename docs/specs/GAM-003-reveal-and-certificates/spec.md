# GAM-003 · Hand reveal and tournament certificates

- **Level:** M · **Status:** implemented (pending deploy) · **Owner:** Guillermo · **Created:** 2026-10-16
- **Repos:** webSocket, client · **Depends on:** — · **Flags:** —
- **Gate:** nothing is implemented without explicit OK on §1 and §4.

## 0 — Inherited invariants

| Invariant | How it is preserved |
|---|---|
| Hidden information (game-engine §4) | Cards are revealed only for players who reach a real showdown or an all-in runout. |
| Logs keep every player's cards | Folding stores the mucked cards for the logs instead of losing them. |
| Secret codes never broadcast/logged | Certificate payload keeps excluding `secretCode`. |

## 1 — Audit (current state)

- `communicator.censoredPlayersInfo` reveals every player's cards when step `showDown` is granted or
  `isRunout`. `actions.winner()` grants `showDown` before broadcasting `winner`, so when everybody folds
  the **uncalled winner's hole cards are broadcast**.
- `Player.setFolded(true)` clears `cards`, so the `ACTION:FOLD` log (written after) records `[]`.
- `actions.winnerTournament` registers a certificate for any winner, bots included
  (`WinnerCertificate.registerWinner`), and `totalPlayers` is `players.length` at the end — busted
  players were already removed by `restartMatch`, so it is almost always 2.
- `Player.isBot` = name contains "bot" or "_ia": a human called "Robot" is treated as a bot.
- **Decision (human, 2026-10-16):** a bot winner gets no certificate; the certificate counts every
  entrant.

## 4 — Requirements (EARS)

- R-01 WHEN a hand ends because every other player folded THE SYSTEM SHALL NOT reveal any player's
  cards.
- R-02 WHEN a hand reaches showdown or an all-in runout THE SYSTEM SHALL reveal only the cards of
  players who did not fold.
- R-03 WHEN a player folds THE SYSTEM SHALL keep their cards in the server log entry for that action.
- R-04 WHEN a bot wins the tournament THE SYSTEM SHALL announce the winner without issuing or storing a
  certificate (`certificate: null`).
- R-05 WHEN a human wins the tournament THE SYSTEM SHALL issue the certificate with `totalPlayers`
  equal to the number of distinct players dealt into at least one hand of that tournament.
- R-06 THE SYSTEM SHALL treat a player as a bot only if the name ends in `_Bot`/`_IA` or matches the
  generated `Bot_<n>` fallback (case-insensitive).
- R-07 WHEN the tournament overlay receives `certificate: null` THE SYSTEM SHALL show the winner
  without the certificate block or verify link.

## 7 — Design

- `match.handEndedByFold` set in `winner(isFold)`; `censoredPlayersInfo` reveals only when
  `(showDown && !handEndedByFold) || isRunout`, and only for `!folded` players. Reset in `initHand`.
- `Player.setFolded(true)` moves cards to `muckedCards`; fold log uses `muckedCards`.
- `match.entrants` (Set of player names) filled in `dealtPrivateCards`, cleared on public table reset.
- `winnerTournament`: `if (winner.isBot) certificate = null`.
- `WinnerTournamentOverlay.vue`: `v-if="certificate"` around the certificate/verify block.

## 8 — Contract changes

| Message | Change | Compatible? |
|---|---|---|
| `winner` (fold) | `players[].cards` no longer present | yes |
| `winnerTournament` | `certificate` may be `null` | client updated in the same release |

## 12 — Test plan / 13 — Acceptance criteria

| ID | Criterion | Test |
|---|---|---|
| AC-01 | Fold win: no cards in the `winner` broadcast | `tests/reveal_and_certificates.test.js` |
| AC-02 | Showdown: only non-folded players' cards revealed | `tests/reveal_and_certificates.test.js` |
| AC-03 | Fold log keeps the folded cards | `tests/reveal_and_certificates.test.js` |
| AC-04 | Bot winner: `certificate: null`, nothing written to `certificates.json` | `tests/reveal_and_certificates.test.js` |
| AC-05 | Human winner: `totalPlayers` counts all entrants | `tests/reveal_and_certificates.test.js` |
| AC-06 | "Robot" is not a bot, "TicoMan_Bot" is | `tests/botNames.test.js` |
| AC-07 | Overlay hides the certificate when null | `client/src/tests/components/winnerTournamentOverlay.test.js` |

## Evidence (2026-10-16)

- Approved 2026-10-16 (Guillermo). Implemented on branch `feat/gam-ops-specs`.
- Tests: `tests/reveal_and_certificates.test.js` (AC-01..05), `tests/botNames.test.js` (AC-06), `client/src/tests/components/winnerTournamentOverlay.test.js` (AC-07).
- Commands: `cd webSocket && npx vitest run` (196 passed) and `npx eslint . --max-warnings=0`;
  `cd client && npx vitest run` (24 passed), `npx eslint .`, `npx vite build`; `cd bot && npx vitest run` (9 passed).
- Not yet verified by a fresh-context evaluator or in production.
