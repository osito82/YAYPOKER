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
  lobby: isTest ? 100 : 5000, // 100ms in test, else 5 seconds
  fast: isTest ? 10 : 100, // 10ms in test, else 100ms
  standard: isTest ? 50 : 500, // 50ms in test, else 500ms
  runout: isTest ? 100 : 2000, // 100ms in test, else 2 seconds
  pause: isTest ? 1000 : 60000, // 1s in test, else 1 minute
}

class Match {
  log = new osolog()
  static timeouts = timeouts

  constructor(torneoId, gameId) {
    this.torneoId = torneoId
    this.gameId = gameId

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

    this.lobbyTimer = null
    this.lobbyTimerDuration = timeouts.lobby
    this.lobbyStartTime = null

    const initialDeck = Deck.shuffleDeck(Deck.cards, 101)
    this.shuffledDeck = initialDeck

    this.dealer = new Dealer(
      this.gameId,
      this.players,
      initialDeck,
      torneoId,
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
        title: 'MATCH - New Game Created',
        date: true,
      })
      .R({ torneoId, gameId })
  }

  continue(thisSocket, customDelay = null) {
    this.lastActivity = Date.now()
    const delay =
      customDelay !== null ? customDelay : this.isRunout ? timeouts.runout : timeouts.standard
    setTimeout(() => {
      this.lobby.startGame(thisSocket)
    }, delay)
  }
}

module.exports = Match
