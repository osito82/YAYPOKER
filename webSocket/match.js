const EventEmitter = require('node:events')
const path = require('node:path')
const Player = require('./player')
const Dealer = require('./dealer')
const Deck = require('./deck')
const StepChecker = require('./stepChecker')
const Socket = require('./sockets')
const Communicator = require('./communicator')

const { generateUniqueId } = require('./utils')
const {
  TIMEOUTS,
  GAME_RULES,
  DECK_CONSTANTS,
  BOT_NAMES,
  SERVER_CONFIG,
} = require('./constants')

const PokerOddsCalculator = require('./pokerOdds')
const log = require('./logger')

// Sub-módulos
const MatchComms = require('./match/comms')
const MatchActions = require('./match/actions')
const MatchLobby = require('./match/lobby')

class Match extends EventEmitter {
  log = log
  static timeouts = TIMEOUTS

  constructor(torneoId, gameId) {
    super()
    this.torneoId = torneoId
    this.gameId = gameId
    this.handCount = 0
    this.currentHandId = null

    // Blinds management
    this.blindLevel = 1
    this.smallBlind = GAME_RULES.DEFAULT_SMALL_BLIND
    this.bigBlind = GAME_RULES.DEFAULT_BIG_BLIND
    this.ante = GAME_RULES.DEFAULT_ANTE

    this.players = []
    this.acceptingPlayers = true
    this.pauseTimeouts = new Map()
    this.autofoldTimer = null
    this.autofoldDuration = TIMEOUTS.autofold

    this.playersFold = []
    this.pot = 0

    this.activePlayerId = null // Track who is expected to act
    this.waitingForNextRound = false
    this.isRunout = false

    this.hostId = null
    this.isSpawningBots = false

    this.initHand()
    this.setupEventListeners()
  }

  setupEventListeners() {
    this.on('START_GAME', (socket, data) => this.startGame(socket, data))
    this.on('CONTINUE', (socket, delay) => this.continue(socket, delay))
    this.on('NEXT_ROUND', () => this.nextRound())
    this.on('RESTART_MATCH', (customDeck) => this.restartMatch(customDeck))
  }

  async spawnBots(count) {
    if (count <= 0) return
    this.isSpawningBots = true

    // Intentamos primero con la IP pública directa al servicio de bots
    const botServiceUrl = `http://73.7.52.167:8886/spawn`

    this.log.R({
      msg: `[BOT_API] SENDING POST REQUEST`,
      url: botServiceUrl,
      count,
    })

    for (let i = 0; i < count; i++) {
      const botName =
        BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] +
        '_' +
        Math.floor(Math.random() * 100)

      try {
        const response = await fetch(botServiceUrl, {
          method: 'POST', // ASEGURADO QUE ES POST
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameCode: this.torneoId,
            playerName: botName,
            provider: 'ollama',
            server: '73.7.52.167', // Le pedimos que se conecte de vuelta por la pública
            port: SERVER_CONFIG.PORT,
          }),
        })

        if (response.ok) {
          this.log.R({ msg: `[BOT_API] SUCCESS`, bot: botName })
        } else {
          this.log.R({ error: `[BOT_API] FAILED`, status: response.status })
        }
      } catch (e) {
        this.log.R({ error: '[BOT_API] ERROR', msg: e.message })
      }
    }

    setTimeout(() => {
      this.isSpawningBots = false
    }, 10000)
  }

  increaseBlinds() {
    this.blindLevel++
    this.smallBlind = Math.ceil(
      this.smallBlind * GAME_RULES.BLIND_INCREASE_PERCENTAGE,
    )
    this.bigBlind = Math.ceil(
      this.bigBlind * GAME_RULES.BLIND_INCREASE_PERCENTAGE,
    )
    if (this.ante > 0)
      this.ante = Math.ceil(this.ante * GAME_RULES.BLIND_INCREASE_PERCENTAGE)

    this.communicator.msgBuilder('blindsIncreased', 'public', null, {
      level: this.blindLevel,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      ante: this.ante,
      handsPlayed: this.handCount,
      displayMsg: `Blinds increased to level ${this.blindLevel}`,
    })
    Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())
  }

  initHand() {
    this.handCount++
    this.currentHandId = `${GAME_RULES.HAND_ID_PREFIX}${this.handCount}`
    const initialDeck = Deck.shuffleDeck(
      Deck.cards,
      DECK_CONSTANTS.SHUFFLE_TIMES,
    )
    this.shuffledDeck = initialDeck

    this.dealer = new Dealer(
      this.gameId,
      this.players,
      initialDeck,
      this.torneoId,
      this.pot,
      [],
    )
    this.cardsDealer = this.dealer.getDealerCards()
    this.stepChecker = new StepChecker(this.gameId)
    this.communicator = new Communicator(
      this.gameId,
      this.torneoId,
      this.playersFold,
      this.stepChecker,
      this.players,
      this.dealer,
      this,
    )
    this.oddsCalculator = new PokerOddsCalculator()

    const context = {
      match: this,
      emitter: this,
      log: this.log,
      communicator: this.communicator,
      dealer: this.dealer,
      stepChecker: this.stepChecker,
    }
    this.comms = new MatchComms(context)
    this.actions = new MatchActions(context)
    this.lobby = new MatchLobby(context)
    this.lastActivity = Date.now()
  }

  getActivePlayers(onlyConnected = true) {
    return this.players.filter((p) => {
      const base = p.isStarted && !p.folded
      return onlyConnected ? base && p.connected : base
    })
  }

  getStartedPlayers(onlyConnected = true) {
    return this.players.filter((p) =>
      onlyConnected ? p.isStarted && p.connected : p.isStarted,
    )
  }

  getConnectedPlayers() {
    return this.players.filter((p) => p.connected)
  }

  continue(thisSocket, customDelay = null) {
    this.lastActivity = Date.now()
    const delay =
      customDelay !== null
        ? customDelay
        : this.isRunout
          ? TIMEOUTS.runout
          : TIMEOUTS.standard
    setTimeout(() => this.startGame(thisSocket), delay)
  }

  async startGame(thisSocket = {}, data = {}) {
    if (this.stepChecker.checkStep('pause')) return

    if (!this.stepChecker.checkStep('startGame')) {
      if (thisSocket.id && this.hostId && thisSocket.id !== this.hostId) {
        this.communicator.msgBuilder('lobbyError', 'private', null, {
          displayMsg: 'Only the host can start the game.',
        })
        this.dealer.talkToSocketById(thisSocket.id, this.communicator.getMsg())
        return
      }

      if (data.bots && Number(data.bots) > 0) {
        const count = Number(data.bots)
        await this.spawnBots(count)
        delete data.bots
        this.log.R({ msg: `[START] BOT SPAWN TRIGGERED. Waiting...` })
        setTimeout(() => this.startGame(thisSocket, data), 3000)
        return
      }

      const connectedCount = this.getConnectedPlayers().length
      if (this.isSpawningBots && connectedCount < GAME_RULES.MIN_PLAYERS) {
        this.log.R({
          msg: `[START] STILL WAITING FOR BOTS...`,
          current: connectedCount,
        })
        setTimeout(() => this.startGame(thisSocket, data), 1500)
        return
      }

      this.players.forEach((p) => {
        if (p.connected) p.setStarted(true)
      })

      if (connectedCount < GAME_RULES.MIN_PLAYERS) {
        if (!this.isSpawningBots) {
          this.communicator.msgBuilder('lobbyError', 'public', null, {
            displayMsg: `Waiting for at least 2 players (current: ${connectedCount})...`,
          })
          Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())
        } else {
          setTimeout(() => this.startGame(thisSocket, data), 1000)
        }
        return
      }

      this.lobby.noMorePlayers()
      this.stepChecker.grantStep('startGame')
    }

    if (!this.stepChecker.checkStep('blindsBetting'))
      return this.actions.askForBlindBets(thisSocket)
    if (!this.stepChecker.checkStep('dealtPrivateCards'))
      return this.actions.dealtPrivateCards(thisSocket)
    if (!this.stepChecker.checkStep('firstBetting'))
      return this.actions.bettingCore(thisSocket, 'firstBetting')
    if (!this.stepChecker.checkStep('flop_Dealer_Hand')) {
      this.dealer.clearActedPlayers()
      this.dealer.getChipsFromPlayers()
      return this.actions.dealerHand(thisSocket, 'flop')
    }
    if (!this.stepChecker.checkStep('flop_Check_Prize_Step'))
      return this.actions.checkPrizes(thisSocket)
    if (!this.stepChecker.checkStep('flop_Bet_Step'))
      return this.actions.bettingCore(thisSocket, 'flopBetting')
    if (!this.stepChecker.checkStep('turn_Dealer_Hand')) {
      this.dealer.clearActedPlayers()
      this.dealer.getChipsFromPlayers()
      return this.actions.dealerHand(thisSocket, 'turn')
    }
    if (!this.stepChecker.checkStep('turn_Check_Prize_Step'))
      return this.actions.checkPrizes(thisSocket)
    if (!this.stepChecker.checkStep('turn_Bet_Step'))
      return this.actions.bettingCore(thisSocket, 'turnBetting')
    if (!this.stepChecker.checkStep('river_Dealer_Hand')) {
      this.dealer.clearActedPlayers()
      this.dealer.getChipsFromPlayers()
      return this.actions.dealerHand(thisSocket, 'river')
    }
    if (!this.stepChecker.checkStep('river_Check_Prize_Step'))
      return this.actions.checkPrizes(thisSocket)
    if (!this.stepChecker.checkStep('river_Bet_Step'))
      return this.actions.bettingCore(thisSocket, 'riverBetting')
    if (!this.stepChecker.checkStep('finalHands')) {
      this.dealer.getChipsFromPlayers()
      this.dealer.setFinalHands()
      this.stepChecker.grantStep('finalHands')
      return this.continue(thisSocket)
    }
    if (!this.stepChecker.checkStep('showDown')) {
      this.communicator.msgBuilder('showDown', 'public', null, {
        method: 'showDown',
        showDown: this.dealer.getFinalHands(),
      })
      Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())
      this.stepChecker.grantStep('showDown')
      return this.continue(thisSocket)
    }
    if (!this.stepChecker.checkStep('winner')) {
      const { WinnerCore } = require('./winnerCore')
      const winnerData = WinnerCore.Winner(this.dealer.getFinalHands())
      if (!winnerData || (Array.isArray(winnerData) && winnerData.length === 0))
        return this.continue(thisSocket)
      this.actions.winner(winnerData)
      return
    }
  }

  nextRound() {
    if (!this.waitingForNextRound) return
    this.waitingForNextRound = false
    const playersWithChips = this.getConnectedPlayers().filter(
      (p) => p.chips > 0,
    )
    if (playersWithChips.length < GAME_RULES.MIN_PLAYERS) return
    this.restartMatch()
  }

  restartMatch(customDeck = null) {
    this.acceptingPlayers = false
    this.gameId = generateUniqueId()
    this.handCount++
    this.currentHandId = `${GAME_RULES.HAND_ID_PREFIX}${this.handCount}`
    this.pot = 0
    this.playersFold = []
    this.activePlayerId = null
    this.isRunout = false

    this.players.forEach((p) => {
      p.gameId = this.gameId
      p.cards = []
      p.currentBet = 0
      p.handContribution = 0
      p.folded = p.chips <= 0
      p.lastAction = p.chips <= 0 ? 'Out' : ''
      p.isAllIn = false
      p.setStarted(p.connected && p.chips > 0)
      p.setCurrentPrize({})
    })

    const Deck = require('./deck')
    this.shuffledDeck =
      customDeck || Deck.shuffleDeck(Deck.cards, DECK_CONSTANTS.SHUFFLE_TIMES)
    this.dealer.gameId = this.gameId
    this.dealer.deck = this.shuffledDeck
    this.dealer.cardsDealer = []
    this.cardsDealer = this.dealer.getDealerCards()
    this.dealer.pot = 0
    this.dealer.clearActedPlayers()
    this.dealer.setCurrentHighestBet(0)
    this.dealer.setLastRaiseAmount(0)
    this.dealer.setLastRaiser(null)

    this.communicator.gameId = this.gameId
    const shouldRotate = this.stepChecker.checkStep('winner')
    this.stepChecker.reset()
    this.stepChecker.gameFlow.gameId = this.gameId
    if (this.players.length > 1 && shouldRotate)
      this.players.push(this.players.shift())

    this.communicator.msgBuilder('gameRestarted', 'public', null, {
      displayMsg: 'New hand starting...',
      newGameId: this.gameId,
    })
    Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())
    setTimeout(() => {
      this.stepChecker.grantStep('startGame')
      this.startGame()
    }, TIMEOUTS.nextRound)
  }
}

module.exports = Match
