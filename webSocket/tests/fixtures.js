
/**
 * Fixtures para testing del Backend de Poker
 * Contiene jugadores predefinidos y acciones comunes.
 */

export const MOCK_PLAYERS = {
  ALICE: {
    name: 'Alice',
    secretCode: 'sec-alice-123',
    totalChips: 1000,
  },
  BOB: {
    name: 'Bob',
    secretCode: 'sec-bob-456',
    totalChips: 1500,
  },
  CHARLIE: {
    name: 'Charlie',
    secretCode: 'sec-charlie-789',
    totalChips: 500,
  },
}

export const MOCK_ACTIONS = {
  SIGN_UP: (chips = 1000) => ({
    action: 'signUp',
    totalChips: chips,
  }),
  START_GAME: {
    action: 'startGame',
  },
  FOLD: {
    action: 'fold',
  },
  CHECK: {
    action: 'setCheck',
  },
  CALL: {
    action: 'setCall',
  },
  BET: (amount) => ({
    action: 'setBet',
    chipsToBet: amount,
  }),
  SMALL_BLIND: (amount = 10) => ({
    action: 'setBet',
    chipsToBet: amount,
  }),
  BIG_BLIND: (amount = 20) => ({
    action: 'setBet',
    chipsToBet: amount,
  }),
  RISE: (amount) => ({
    action: 'setRise',
    chipsToRiseBet: amount,
  }),
  CHAT: (targetId, message) => ({
    action: 'sendMessage',
    targetPlayerId: targetId,
    targetMessage: message,
  }),
}

/**
 * Escenarios predefinidos para pruebas de flujo
 */
export const SCENARIOS = {
  QUICK_FOLD: [
    { player: 'ALICE', action: 'SIGN_UP', params: [1000] },
    { player: 'BOB', action: 'SIGN_UP', params: [1000] },
    { player: 'ALICE', action: 'START_GAME' },
    { player: 'ALICE', action: 'FOLD' },
  ],
  SIMPLE_BETTING: [
    { player: 'ALICE', action: 'SIGN_UP', params: [1000] },
    { player: 'BOB', action: 'SIGN_UP', params: [1000] },
    { player: 'ALICE', action: 'START_GAME' },
    { player: 'ALICE', action: 'BET', params: [50] },
    { player: 'BOB', action: 'CALL' },
  ]
}
