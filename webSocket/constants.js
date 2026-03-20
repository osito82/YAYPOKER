const isTest = process.env.NODE_ENV === 'test'

const TIMEOUTS = {
  autofold: isTest ? 1000 : 600000, // 1s in test, else 10 minutes
  fast: isTest ? 10 : 100, // 10ms in test, else 100ms
  standard: isTest ? 50 : 500, // 50ms in test, else 500ms
  runout: isTest ? 100 : 2000, // 100ms in test, else 2 seconds
  pause: isTest ? 1000 : 60000, // 3s in test, else 1 minute
  nextRound: isTest ? 500 : 5000, // 500ms in test, else 5 seconds
  collectChips: isTest ? 100 : 1500, // 100ms in test, else 1.5 seconds
}

const GAME_RULES = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,
  DEFAULT_SMALL_BLIND: 10,
  DEFAULT_BIG_BLIND: 20,
  DEFAULT_ANTE: 0,
  BLIND_INCREASE_INTERVAL: 10,
  BLIND_INCREASE_PERCENTAGE: 1.25,
  HAND_ID_PREFIX: 'h',
  INITIAL_CARDS_PER_PLAYER: 2,
  CHIPS_VALIDATION: {
    MIN: 0,
  },
}

const DECK_CONSTANTS = {
  SHUFFLE_TIMES: 506,
}

const ACTIONS = {
  FOLD: 'fold',
  CHECK: 'setCheck',
  CALL: 'setCall',
  SET_BET: 'setBet',
  RAISE: 'setRise',
  BLIND: 'blind',
  SIGN_UP: 'signUp',
  START_GAME: 'startGame',
  PLAYER_READY: 'playerReady',
  NEXT_ROUND: 'nextRound',
  STATS: 'stats',
  CLOSE: 'close',
  SEND_MESSAGE: 'sendMessage',
  DEALT_PRIVATE_CARDS: 'dealtPrivateCards',
}

const BOT_NAMES = [
  'Osito_Bot',
  'Malafama_Bot',
  'PokerFace_Bot',
  'AllIn_Bot',
  'FullHouse_Bot',
  'AceHigh_Bot',
  'FlushMaster_Bot',
  'RoyalBot',
  'Jack_IA',
  'Deush_Bot',
]

const SERVER_CONFIG = {
  PORT: process.env.VITE_WS_PORT || '8888',
  PROTOCOL: 'http',
  BASE_URL: process.env.VITE_WS_URL || 'localhost',
}

const CLEANUP_CONFIG = {
  GC_INTERVAL: 600000, // 10 minutes
  MATCH_MAX_IDLE: 3600000, // 1 hour
  ABANDONED_MATCH_IDLE: 600000, // 10 minutes
}

module.exports = {
  TIMEOUTS,
  GAME_RULES,
  DECK_CONSTANTS,
  ACTIONS,
  BOT_NAMES,
  SERVER_CONFIG,
  CLEANUP_CONFIG,
}
