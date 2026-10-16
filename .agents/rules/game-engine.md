---
trigger: always_on
description: "Authoritative server, chip conservation and hidden information for the poker engine"
---

# Game Engine Standard (`webSocket/`)

1. **Server is authoritative.** Dealing, hand ranking (`pokerCore.js`, `winnerCore.js`), pots and side pots (`potDistributor.js`), blinds, turn order, timeouts and odds (`pokerOdds.js`) are computed only on the server. The client and the bots render state and send intents; never move a rule into `client/` or `bot/`.
2. **Validate every inbound message.** Parse WebSocket payloads with the zod schemas in `app.js`; check the sender belongs to the room and that it is their turn before mutating state. Reject, don't coerce, impossible amounts.
3. **Chips are conserved.** Within a tournament, the sum of all stacks plus all pots is constant; uncalled bets return to their owner. Any change to betting, all-in or pot code keeps `tests/allin_conservation.test.js`, `allin_uncalled_bet.test.js` and `sidePots.test.js` green and adds a case for the new scenario.
4. **Hidden information stays hidden.** A player only receives their own pocket cards until showdown; the deck, other players' cards and secret codes are never broadcast or logged.
5. **Timing.** All delays come from `TIMEOUTS` in `constants.js` (short values under `NODE_ENV=test`); rule constants from `GAME_RULES`. No hardcoded delays or magic numbers.
6. **Bots are ordinary players.** Bot sockets use the same messages and checks as humans; no privileged server paths. Bot spawning goes through `BOT_SERVICE_URL` (`POST /spawn`).
7. **State is in memory.** There is no database: a restart ends every match. Cleanup of idle sockets and abandoned rooms follows `CLEANUP_CONFIG`; do not add persistence without a spec.
