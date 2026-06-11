const isTest = process.env.NODE_ENV === 'test'

const TIMEOUTS = {
  autofold: isTest ? 7000 : 300000, // 7s in test
  autofoldPublic: isTest ? 7000 : 45000, // 7s in test
  fast: isTest ? 10 : 100, // 10ms in test, else 100ms
  standard: isTest ? 50 : 500, // 50ms in test, else 500ms
  runout: isTest ? 100 : 2000, // 100ms in test, else 2 seconds
  pause: isTest ? 1000 : 60000, // 3s in test, else 1 minute
  nextRound: isTest ? 500 : 5000, // 500ms in test, else 5 seconds
  collectChips: isTest ? 100 : 1500, // 100ms in test, else 1.5 seconds
  publicEmptyGrace: isTest ? 1000 : 30000, // 30 seconds
  publicSingleGrace: isTest ? 1000 : 15000, // 15 seconds
}

const GAME_RULES = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,
  MIN_PLAYERS_PUBLIC: 2,
  MAX_PLAYERS_PUBLIC: 5,
  MAX_NUMBER_BOTS: parseInt(process.env.MAX_NUMBER_BOTS) || 9,
  BOT_DISCONNECT_THRESHOLD: 4, // Bots leave when this many players are at the table
  DEFAULT_SMALL_BLIND: 10,
  DEFAULT_BIG_BLIND: 20,
  DEFAULT_ANTE: 0,
  BLIND_INCREASE_INTERVAL: 10,
  BLIND_INCREASE_PERCENTAGE: 1.25,
  HAND_ID_PREFIX: 'h',
  INITIAL_CARDS_PER_PLAYER: 2,
  MAX_CONSECUTIVE_AUTOFOLDS: 2,
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
  VOICE_MESSAGE: 'voiceMessage',
  DEALT_PRIVATE_CARDS: 'dealtPrivateCards',
}

const BOT_NAMES = [
  'ChipBlender_Bot',
  'TicoMan_Bot',
  'PokerFace_Bot',
  'RoboFlush_Bot',
  'Terminator_Bot',
  'TurboFold_Bot',
  'FlushMaster_Bot',
  'Optimus_Bot',
  'JackAss_Bot',
  'FiascoMatic_Bot',
  'AllInAlien_Bot',
  'FoldVoldemort_Bot',
  'BluffSponge_Bot',
  'TiltMaster_Bot',
  'RiverCry_Bot',
  'CallStation_Bot',
  'RaiseASaurus_Bot',
  'DonkBet_Bot',
  'FoldyMcFold_Bot',
  'NoLimitNerd_Bot',
  'CheckNorris_Bot',
  'PocketRockets_Bot',
  'BadBeat_Bot',
  'CryingCall_Bot',
  'SharkBait_Bot',
  'FishSticks_Bot',
  'ChipHoarder_Bot',
  'RiveredAgain_Bot',
  'Suckout_Bot',
  'RoyalFlusher_Bot',
  'SlowPlay_Bot',
  'NittyMcNit_Bot',
  'Maniac_Bot',
  'Potsy_Bot',
  'ThreeBet_Bot',
  'BubbleBoy_Bot',
  'NutPeddler_Bot',
  'Overbet_Bot',
  'LimpBiscuit_Bot',
  'Tiltosaurus_Bot',
  'CardDead_Bot',
  'Cooler_Bot',
  'FloppingDead_Bot',
  'Straddle_Bot',
  'MuckIt_Bot',
  'StackMe_Bot',
  'Mimoso_Bot',
  'Chipleader_Bot',
  'RakeBack_Bot',
  'PotOdds_Bot'
]

const SERVER_CONFIG = {
  PORT: process.env.VITE_WS_PORT || '8888',
  PROTOCOL: 'http',
  BASE_URL: process.env.VITE_WS_URL || 'localhost',
  BOT_SERVICE_URL: process.env.BOT_SERVICE_URL || 'http://localhost:8886',
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
