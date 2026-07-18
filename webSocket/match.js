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
    // Mesa pública: Cualquier ID que empiece por P_ activa el comportamiento público
    this.isPublic = torneoId.startsWith('P_')

    this.handCount = 0
    this.currentHandId = `${GAME_RULES.HAND_ID_PREFIX}0`

    // Blinds management
    this.blindLevel = 1
    this.smallBlind = GAME_RULES.DEFAULT_SMALL_BLIND
    this.bigBlind = GAME_RULES.DEFAULT_BIG_BLIND
    this.ante = GAME_RULES.DEFAULT_ANTE

    this.initialStack = 1000 // Default initial stack

    this.players = []
    this.acceptingPlayers = true
    this.pauseTimeouts = new Map()
    this.autofoldTimer = null
    this.autofoldDuration = this.isPublic
      ? TIMEOUTS.autofoldPublic
      : TIMEOUTS.autofold

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
    // Escuchar eventos de los submódulos para orquestar el flujo
    this.on('START_GAME', (socket, data) => this.startGame(socket, data))
    this.on('CONTINUE', (socket, delay) => this.continue(socket, delay))
    this.on('NEXT_ROUND', () => this.nextRound())
    this.on('RESTART_MATCH', (customDeck) => this.restartMatch(customDeck))
  }

  async spawnBots(count = 1, retryCount = 0) {
    if (count <= 0) return
    if (process.env.NODE_ENV === 'test') return
    this.isSpawningBots = true

    this.log
      .Template({ name: 'brakets', title: 'BOT_API:REQUEST', date: true })
      .R({
        msg: `REQUESTING ${count} BOTS`,
        tournament: this.torneoId,
      })

    const usedNames = new Set(this.players.map((p) => p.name))

    for (let i = 0; i < count; i++) {
      const availableNames = BOT_NAMES.filter((name) => !usedNames.has(name))
      const botName =
        availableNames.length > 0
          ? availableNames[Math.floor(Math.random() * availableNames.length)]
          : `Bot_${Math.floor(Math.random() * 10000)}`

      usedNames.add(botName)

      try {
        await fetch(`${SERVER_CONFIG.BOT_SERVICE_URL}/spawn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameCode: this.torneoId,
            playerName: botName,
            server: SERVER_CONFIG.BASE_URL,
            port: SERVER_CONFIG.PORT,
          }),
        })
      } catch (error) {
        console.error('Error spawning bot:', error)
      }
    }
  }

  increaseBlinds() {
    this.blindLevel++
    this.smallBlind = Math.ceil(
      this.smallBlind * GAME_RULES.BLIND_INCREASE_PERCENTAGE,
    )
    this.bigBlind = Math.ceil(
      this.bigBlind * GAME_RULES.BLIND_INCREASE_PERCENTAGE,
    )
    if (this.ante > 0) {
      this.ante = Math.ceil(this.ante * GAME_RULES.BLIND_INCREASE_PERCENTAGE)
    }

    this.log
      .Template({
        name: 'brakets',
        title: 'MATCH:BLINDS_INCREASED',
        date: true,
      })
      .R({
        torneoId: this.torneoId,
        level: this.blindLevel,
        smallBlind: this.smallBlind,
        bigBlind: this.bigBlind,
        ante: this.ante,
        handsPlayed: this.handCount,
      })

    this.communicator.msgBuilder('blindsIncreased', 'public', null, {
      level: this.blindLevel,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      ante: this.ante,
      handsPlayed: this.handCount,
      displayMsg: `Blinds increased to level ${this.blindLevel}: SB $${this.smallBlind} / BB $${this.bigBlind}`,
    })
    Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())
  }

  initHand() {
    this.deck = Deck.shuffleDeck(Deck.cards)
    this.cardsDealer = []
    this.playersFold = []
    this.isRunout = false

    this.stepChecker = new StepChecker()
    this.dealer = new Dealer(
      this.gameId,
      this.players,
      this.deck,
      this.torneoId,
      this.pot,
      this.cardsDealer,
    )

    this.communicator = new Communicator(
      this.gameId,
      this.torneoId,
      this.playersFold,
      this.stepChecker,
      this.players,
      this.dealer,
      this, // Still used for some timeouts, but could be refactored further
    )

    this.oddsCalculator = new PokerOddsCalculator()

    // Contexto compartido para submódulos (inyectamos solo lo necesario)
    const context = {
      match: this, // Still passing this for state access, but interaction will be via events
      emitter: this,
      log: this.log,
      communicator: this.communicator,
      dealer: this.dealer,
      stepChecker: this.stepChecker,
    }

    // Instanciar submódulos con el nuevo enfoque
    this.comms = new MatchComms(context)
    this.actions = new MatchActions(context)
    this.lobby = new MatchLobby(context)

    this.lastActivity = Date.now()

    this.log
      .Template({
        name: 'brakets',
        title: 'MATCH:NEW_HAND',
        date: true,
      })
      .R({
        torneoId: this.torneoId,
        gameId: this.gameId,
        handId: this.currentHandId,
        dealerCards: this.cardsDealer,
      })
  }

  getActivePlayers(onlyConnected = true) {
    return this.players.filter((p) => {
      const base = p.isStarted && !p.folded
      return onlyConnected ? base && p.connected : base
    })
  }

  getStartedPlayers(onlyConnected = true) {
    return this.players.filter((p) => {
      return onlyConnected ? p.isStarted && p.connected : p.isStarted
    })
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
    setTimeout(() => {
      this.startGame(thisSocket)
    }, delay)
  }

  async startGame(thisSocket = {}, data = {}) {
    if (this.stepChecker.checkStep('pause')) return

    if (data.smallBlind !== undefined) this.smallBlind = Number(data.smallBlind)
    if (data.bigBlind !== undefined) this.bigBlind = Number(data.bigBlind)
    if (data.ante !== undefined) this.ante = Number(data.ante)

    if (!this.stepChecker.checkStep('startGame')) {
      const isHost =
        thisSocket.id && this.hostId && thisSocket.id === this.hostId
      if (!this.isPublic && !isHost) {
        this.communicator.msgBuilder('lobbyError', 'private', null, {
          displayMsg: 'Only the host can start the game.',
        })
        this.dealer.talkToSocketById(thisSocket.id, this.communicator.getMsg())
        return
      }

      const connectedPlayers = this.getConnectedPlayers()
      const minRequired = this.isPublic
        ? GAME_RULES.MIN_PLAYERS_PUBLIC
        : GAME_RULES.MIN_PLAYERS

      const botCountToSpawn =
        data.bots && !this.isSpawningBots ? Number(data.bots) : 0
      const totalExpectedPlayers = connectedPlayers.length + botCountToSpawn

      if (totalExpectedPlayers < minRequired) {
        if (!this.isSpawningBots) {
          this.communicator.msgBuilder('lobbyError', 'public', null, {
            errorType: 'WAITING_PLAYERS',
            displayMsg: `Waiting for at least ${minRequired} players to be connected (current: ${connectedPlayers.length})...`,
          })
          Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())

          setTimeout(() => this.startGame(thisSocket, data), 2000)
        } else {
          setTimeout(() => this.startGame(thisSocket, data), 1000)
        }
        return
      }

      const botLimit = GAME_RULES.MAX_PLAYERS - connectedPlayers.length
      if (data.bots > 0 && !this.isSpawningBots) {
        let count = Number(data.bots)
        if (count > botLimit) {
          this.log
            .Template({ name: 'brakets', title: 'BOT_API:REDUCED', date: true })
            .R({
              msg: `Bot request reduced from ${count} to ${botLimit}`,
            })
          count = botLimit
        }

        if (count > 0) {
          await this.spawnBots(count)
        }
        delete data.bots
        setTimeout(() => this.startGame(thisSocket, data), 3000)
        return
      }

      this.players.forEach((p) => {
        if (p.connected) p.setStarted(true)
      })

      this.dealer.players = this.players
      this.lobby.noMorePlayers()
      this.stepChecker.grantStep('startGame')
    }

    if (!this.stepChecker.checkStep('blindsBetting'))
      return this.actions.askForBlindBets(thisSocket)
    if (!this.stepChecker.checkStep('dealtPrivateCards')) {
      this.players.forEach((p) => {
        if (p.connected) p.setStarted(true)
      })
      return this.actions.dealtPrivateCards(thisSocket)
    }
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
      this.log
        .Template({ name: 'brakets', title: 'MATCH:SHOWDOWN', date: true })
        .R({
          torneoId: this.torneoId,
          handId: this.currentHandId,
          finalHands: this.dealer.getFinalHands(),
          dealerCards: this.cardsDealer,
        })
      this.communicator.msgBuilder('showDown', 'public', null, {
        method: 'showDown',
        showDown: this.dealer.getFinalHands(),
      })
      Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())
      this.stepChecker.grantStep('showDown')
      return this.continue(thisSocket)
    }
    if (!this.stepChecker.checkStep('winner')) {
      this.actions.winner()
      return
    }
  }

  nextRound() {
    if (!this.waitingForNextRound) return
    this.waitingForNextRound = false

    const connected = this.getConnectedPlayers()
    if (connected.length === 0 && this.isPublic) return

    const playersWithChips = connected.filter((p) => p.chips > 0)

    if (playersWithChips.length < GAME_RULES.MIN_PLAYERS) {
      this.log
        .Template({ name: 'brakets', title: 'MATCH:FINISHED', date: true })
        .R({
          info: `Tournament finished. ${this.isPublic ? 'Resetting public table.' : 'No more rounds.'}`,
        })

      this.acceptingPlayers = true

      if (this.isPublic) {
        const remainingPlayers = this.players.filter(
          (p) => p.chips > 0 && p.connected,
        )
        this.players.length = 0
        this.players.push(...remainingPlayers)

        this.handCount = 0
        this.currentHandId = `${GAME_RULES.HAND_ID_PREFIX}0`
        this.initHand()

        this.communicator.msgBuilder('lobby', 'public', null, {
          displayMsg: 'Tournament finished. Waiting for new players...',
        })
        Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())

        if (this.players.some((p) => !p.isBot)) {
          this.lobby.handlePublicBots()
          this.lobby.handlePublicAutoStart()
        }
        return
      }
      return
    }
    this.restartMatch()
  }

  restartMatch(customDeck = null) {
    this.acceptingPlayers = false
    const oldGameId = this.gameId
    this.gameId = generateUniqueId()
    this.handCount++
    this.currentHandId = `${GAME_RULES.HAND_ID_PREFIX}${this.handCount}`

    this.log
      .Template({ name: 'brakets', title: 'MATCH:RESTARTING', date: true })
      .R({
        torneoId: this.torneoId,
        oldGameId,
        newGameId: this.gameId,
        handId: this.currentHandId,
        dealerCards: this.cardsDealer,
      })

    this.players.push(this.players.shift())

    const activePlayers = this.players.filter((p) => p.chips > 0)
    this.players.length = 0
    this.players.push(...activePlayers)

    this.initHand()

    this.players.forEach((p) => {
      p.setFolded(false)
      p.setAllIn(false)
      p.setLastAction('')
      p.setStarted(p.connected)
      p.cards = []
      p.currentBet = 0
      p.handContribution = 0
    })

    this.communicator.msgBuilder('gameRestarted', 'public', null, {
      displayMsg: 'New hand starting...',
      newGameId: this.gameId,
    })
    Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())

    const startDelay =
      process.env.NODE_ENV === 'test' ? TIMEOUTS.nextRound : 1500
    setTimeout(() => {
      this.stepChecker.grantStep('startGame')
      this.startGame()
    }, startDelay)
  }
}

module.exports = Match
