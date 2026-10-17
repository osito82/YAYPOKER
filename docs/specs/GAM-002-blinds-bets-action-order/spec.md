# GAM-002 · Automatic blinds, one bet validator and action order

- **Level:** M · **Status:** implemented (pending deploy) · **Owner:** Guillermo · **Created:** 2026-10-16
- **Repos:** webSocket, client, bot · **Depends on:** GAM-001 (seated disconnected players) · **Flags:** —
- **Gate:** nothing is implemented without explicit OK on §1 and §4.

## 0 — Inherited invariants

| Invariant | How it is preserved |
|---|---|
| Chips are conserved | Blinds/antes go through the same `handContribution` path; conservation tests stay green plus a short-stack blind case. |
| Server is authoritative | Blind amounts, minimum bet/raise and turn order are computed only on the server; the client no longer guesses the blind from the message text. |
| Reject, don't coerce (game-engine §2) | Decimals, bets below the call, bets below one big blind and short raises are rejected with `actionRejected`. Amounts above the stack are treated as all-in (slider cap, unchanged). |

## 1 — Audit (current state)

- Blinds are a turn: `actions.askForBlindBets` prompts SB then BB; the client button computes the
  amount from `requiredBlind` or from the display text (`pages/Game.vue` `case 'blind'`); the bot reads
  `blindAmount`. A human who times out on the blind is folded.
- `setBet` (`match/actions.js`) validates the minimum raise only for `setRise`; `setBet` with an open
  bet accepts any amount ≥ current bet, including below the call; zod accepts decimals.
- An all-in raise smaller than the minimum (`isForcedAllIn`) updates `lastRaiseAmount` and clears
  `playersActed`, so it reopens raising for everybody.
- Ante (`match.ante`, settable by the host) is never collected.
- Action order (`bettingCore`): pre-flop `players.slice(2)…` (correct), post-flop
  `players.slice(1)…` → the big blind acts first with 3+ players (should be the first live seat after
  the button, i.e. the SB). Blinds use `getActivePlayers()` while order uses all `players`, so a
  non-started seat shifts blinds and order differently.
- Seats: `restartMatch` rotates `players` (`push(shift())`); `players[0]` is the SB, the last seat is
  the button; heads-up the SB is the button.

## 2 — Problem and outcome

- Wrong amounts, extra turns and wrong order make hands feel broken and slow. Outcome: every hand
  starts with blinds already posted, every bet obeys No-Limit Hold'em rules, and the first player to act
  is correct for 2–10 players.
- Non-goals: dead-button rules when a player busts, straddles, pot-limit.

## 4 — Requirements (EARS)

- R-01 WHEN a hand starts THE SYSTEM SHALL post the antes (if any), the small blind and the big blind
  automatically from the seats in hand order, and broadcast `blindsPosted`.
- R-02 IF a player cannot cover a blind or ante THEN THE SYSTEM SHALL post what they have and mark them
  all-in.
- R-03 THE SYSTEM SHALL ignore the `blind` action (blinds are no longer a turn).
- R-04 WHEN a bet or raise is received THE SYSTEM SHALL validate it in one place (`validateBet`):
  integer amount; strictly above the player's current bet; equal to the current bet is a call;
  with no open bet at least one big blind; with an open bet a raise of at least the last full raise
  (minimum one big blind); any amount that puts the player all-in is always allowed.
- R-05 IF a bet is rejected THEN THE SYSTEM SHALL keep the player's turn and clock and send
  `actionRejected` with the minimum legal amount.
- R-06 WHEN an all-in raise is smaller than the minimum raise THE SYSTEM SHALL NOT change the minimum
  raise and SHALL NOT reopen raising for players who already acted; they may only call or fold.
- R-07 WHEN betting starts pre-flop THE SYSTEM SHALL start with the seat after the big blind (heads-up:
  the small blind/button).
- R-08 WHEN betting starts on flop, turn or river THE SYSTEM SHALL start with the first live seat after
  the button (heads-up: the big blind).
- R-09 THE SYSTEM SHALL compute blinds and order from the same list: the seats dealt into the hand.
- R-10 WHEN a player acts THE SYSTEM SHALL give the turn to the next seat clockwise that still has to
  act (found while building AC-04: after a raise the turn went back to the first seat of the street).

## 6 — Edge cases

| Case | Player sees | Backend does |
|---|---|---|
| SB has 5 chips, SB is 10 | SB all-in 5 | BB still posts full; highest bet = BB |
| BB has 15, BB is 20 | BB all-in 15 | highest bet 15, min raise stays one BB (20) → min raise to 35 |
| Raise to 30 over BB 20 | "minimum raise is 40" | rejected, turn kept |
| Bet 15 on a flop with BB 20 | "minimum bet is 20" | rejected |
| Bet 25.5 | "whole chips only" | rejected (zod int) |
| Short all-in raise (to 50 over a 40 bet), first raiser to act again | call / fold only | no reopen |

## 7 — Design

- `actions.postBlinds()` replaces `askForBlindBets` in the step machine (step `blindsBetting` granted
  right after posting). Sit-out and disconnected players post like everyone else.
- `match.handSeats()` = `players.filter(isStarted)`; SB = seat 0, BB = seat 1 (heads-up: button = SB =
  seat 0). Pre-flop start = heads-up 0, else 2 % n; post-flop start = heads-up 1, else 0.
- `match/betting.js` `validateBet({ player, amount, maxBet, lastRaise, bigBlind })` → `{ ok, kind:
  'call'|'bet'|'raise'|'allin', reason, minLegal }`; `setBet`/`setRise` both route through it.
- Dealer keeps `lastRaiseAmount` for full raises only; options for a player in `playersActed` facing an
  incomplete raise exclude `raise`.
- Decimals are rejected by `validateBet` (not zod) so the player gets an `actionRejected` with the
  minimum legal amount instead of a generic validation error.
- `Dealer.lastActorId` (set on turn actions, reset per street) drives R-10.
- Client: remove the `blind` action path; show `blindsPosted` in the action log. Bot: read the big blind
  from `blindsPosted`/`signUp`, drop the blind handler.

## 8 — Contract changes

| Message | Change | Compatible? |
|---|---|---|
| `askForBlindBets` | no longer sent | old clients just never see a blind prompt |
| `blindsPosted` (new, public) | `{ smallBlind, bigBlind, ante, posts: [{ playerId, type, amount, isAllIn }] }` | additive |
| `blind` action | ignored | yes |
| `actionRejected` | adds `minLegal` | additive |

## 12 — Test plan / 13 — Acceptance criteria

| ID | Criterion | Test |
|---|---|---|
| AC-01 | Blinds posted without a prompt; short stacks go all-in | `tests/auto_blinds.test.js` |
| AC-02 | Ante collected when set | `tests/auto_blinds.test.js` |
| AC-03 | `validateBet` table (below call, below BB, short raise, decimals, all-in) | `tests/bet_validator.test.js` (unit) |
| AC-04 | Incomplete all-in raise does not reopen raising | `tests/auto_blinds.test.js` (integration) |
| AC-05 | 3 players: post-flop starts with SB; heads-up with BB; pre-flop UTG / SB | `tests/auto_blinds.test.js` |
| AC-06 | Existing suites updated and green (blind prompts removed from fixtures) | `cd webSocket && npx vitest run` |
| AC-07 | Client and bot no longer send `blind`; client suite green | `cd client && npx vitest run`, `cd bot && npx vitest run` |

## 16 — Pending

- None.

## Evidence (2026-10-16)

- Approved 2026-10-16 (Guillermo). Implemented on branch `feat/gam-ops-specs`.
- Tests: `tests/auto_blinds.test.js` (AC-01, AC-02, AC-04, AC-05), `tests/bet_validator.test.js` (AC-03), old suites migrated to automatic blinds (AC-06), client/bot without `blind` (AC-07).
- Commands: `cd webSocket && npx vitest run` (196 passed) and `npx eslint . --max-warnings=0`;
  `cd client && npx vitest run` (24 passed), `npx eslint .`, `npx vite build`; `cd bot && npx vitest run` (9 passed).
- Not yet verified by a fresh-context evaluator or in production.
