const Player = require('./player')
const Dealer = require('./dealer')
const Deck = require('./deck')
const StepChecker = require('./stepChecker')
const Socket = require('./sockets')
const Communicator = require('./communicator')

const { generateUniqueId } = require('./utils')

const osolog = require('osolog')
const PokerOddsCalculator = require('./pokerOdds')

// Sub-módulos
const MatchComms = require('./match/comms')
const MatchActions = require('./match/actions')
const MatchLobby = require('./match/lobby')

const isTest = process.env.NODE_ENV === 'test'

const timeouts = {
  autofold: isTest ? 1000 : 600000, // 1s in test, else 10 minutes
  fast: isTest ? 10 : 100, // 10ms in test, else 100ms
  standard: isTest ? 50 : 500, // 50ms in test, else 500ms
  runout: isTest ? 100 : 2000, // 100ms in test, else 2 seconds
  pause: isTest ? 3000 : 60000, // 3s in test, else 1 minute
  nextRound: isTest ? 500 : 5000, // 500ms in test, else 5 seconds
  collectChips: isTest ? 100 : 1500, // 100ms in test, else 1.5 seconds
}

class Match {
  log = new osolog()
  static timeouts = timeouts

  constructor(torneoId, gameId) {
    this.torneoId = torneoId
    this.gameId = gameId
    this.handCount = 0
    this.currentHandId = null

    this.players = []
    this.acceptingPlayers = true
    this.pauseTimeouts = new Map()
    this.autofoldTimer = null
    this.autofoldDuration = timeouts.autofold

    this.playersFold = []
    this.pot = 0

    this.activePlayerId = null // Track who is expected to act
    this.waitingForNextRound = false
    this.isRunout = false

    this.hostId = null

    this.initHand()
  }

  initHand() {
    this.handCount++
    this.currentHandId = `h${this.handCount}`
    const initialDeck = Deck.shuffleDeck(Deck.cards, 101)
    this.shuffledDeck = initialDeck

    this.dealer = new Dealer(
      this.gameId,
      this.players,
      initialDeck,
      this.torneoId,
      this.pot,
      [], // Start with empty array for dealer cards
    )
    this.cardsDealer = this.dealer.getDealerCards() // Reference the dealer's array

    this.stepChecker = new StepChecker(this.gameId)

    this.communicator = new Communicator(
      this.gameId,
      this.torneoId,
      this.playersFold,
      this.stepChecker,
      this.players,
      this.dealer,
      this, // Pass match instance to access timeouts
    )

    this.oddsCalculator = new PokerOddsCalculator()

    // Instanciar submódulos
    this.comms = new MatchComms(this)
    this.actions = new MatchActions(this)
    this.lobby = new MatchLobby(this)

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

  /**
   * Returns players who are currently in the hand (not folded) and were present when it started.
   * Optionally filters by connection status.
   */
  getActivePlayers(onlyConnected = true) {
    return this.players.filter((p) => {
      const base = p.isStarted && !p.folded
      return onlyConnected ? base && p.connected : base
    })
  }

  /**
   * Returns all players who were at the table when the current hand began.
   */
  getStartedPlayers(onlyConnected = true) {
    return this.players.filter((p) => {
      return onlyConnected ? p.isStarted && p.connected : p.isStarted
    })
  }

  /**
   * Returns all currently connected players.
   */
  getConnectedPlayers() {
    return this.players.filter((p) => p.connected)
  }

  continue(thisSocket, customDelay = null) {
    this.lastActivity = Date.now()
    const delay =
      customDelay !== null
        ? customDelay
        : this.isRunout
          ? timeouts.runout
          : timeouts.standard
    setTimeout(() => {
      this.startGame(thisSocket)
    }, delay)
  }

  startGame(thisSocket = {}) {
    if (this.stepChecker.checkStep('pause')) return

    // Si el juego aún no ha sido iniciado formalmente
    if (!this.stepChecker.checkStep('startGame')) {
      // Solo el host puede iniciar el juego la primera vez
      if (thisSocket.id !== this.hostId) {
        this.communicator.msgBuilder('lobbyError', 'private', null, {
          displayMsg: 'Only the host can start the game.',
        })
        this.dealer.talkToSocketById(thisSocket.id, this.communicator.getMsg())
        return
      }

      // 🔥 Forzar a todos los jugadores conectados a estar listos
      this.players.forEach((p) => {
        if (p.connected) p.setStarted(true)
      })

      const connectedPlayers = this.getConnectedPlayers()
      if (connectedPlayers.length < 2) {
        this.communicator.msgBuilder('lobbyError', 'public', null, {
          displayMsg: 'Waiting for at least 2 players to be connected...',
        })
        Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())
        return
      }

      // Al empezar el juego, cerramos el registro
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
      const { WinnerCore } = require('./winnerCore')
      const winnerData = WinnerCore.Winner(this.dealer.getFinalHands())
      if (
        !winnerData ||
        (Array.isArray(winnerData) && winnerData.length === 0)
      ) {
        return this.continue(thisSocket)
      }
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

    if (playersWithChips.length < 2) {
      this.log.R({ info: 'Tournament finished. No more rounds.' })
      return
    }
    this.restartMatch()
  }

  restartMatch(customDeck = null) {
    this.acceptingPlayers = false
    const oldGameId = this.gameId
    this.gameId = generateUniqueId()
    this.handCount++
    this.currentHandId = `h${this.handCount}`

    this.log
      .Template({ name: 'brakets', title: 'MATCH:RESTARTING', date: true })
      .R({
        torneoId: this.torneoId,
        oldGameId,
        newGameId: this.gameId,
        handId: this.currentHandId,
        dealerCards: this.cardsDealer,
      })

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
    this.shuffledDeck = customDeck || Deck.shuffleDeck(Deck.cards, 101)
    this.dealer.gameId = this.gameId
    this.dealer.deck = this.shuffledDeck
    this.dealer.cardsDealer = []
    this.cardsDealer = this.dealer.getDealerCards()
    this.dealer.pot = 0
    this.dealer.clearActedPlayers()
    this.dealer.setCurrentHighestBet(0)
    this.dealer.setLastRaiser(null)

    this.communicator.gameId = this.gameId
    const shouldRotate = this.stepChecker.checkStep('winner')
    this.stepChecker.reset()
    this.stepChecker.gameFlow.gameId = this.gameId

    if (this.players.length > 1 && shouldRotate) {
      this.players.push(this.players.shift())
    }

    this.communicator.msgBuilder('gameRestarted', 'public', null, {
      displayMsg: 'New hand starting...',
      newGameId: this.gameId,
    })
    Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())

    setTimeout(() => {
      this.stepChecker.grantStep('startGame')
      this.startGame()
    }, timeouts.nextRound)
  }
}

module.exports = Match
