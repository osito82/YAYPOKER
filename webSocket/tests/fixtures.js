/**
 * Fixtures para testing del Backend de Poker
 * Contiene jugadores predefinidos y acciones comunes.
 */

export const MOCK_PLAYERS = {
  ALICE: {
    name: 'Alice',
    secretCode: '4844',
    totalChips: 1000,
  },
  BOB: {
    name: 'Bob',
    secretCode: '8874',
    totalChips: 1500,
  },
  CHARLIE: {
    name: 'Charlie',
    secretCode: '8894',
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
  PLAYER_READY: {
    action: 'playerReady',
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
  SET_BET: (amount) => ({
    action: 'setBet',
    chipsToBet: amount,
  }),
  SET_CHECK: () => ({
    action: 'setCheck',
  }),
  SET_CALL: () => ({
    action: 'setCall',
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
  ],
}
