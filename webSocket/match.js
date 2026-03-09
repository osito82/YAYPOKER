const Player = require('./player')
const Dealer = require('./dealer')
const Deck = require('./deck')
const StepChecker = require('./stepChecker')
const Socket = require('./sockets')
const Communicator = require('./communicator')

const { msgBuilder, generateUniqueId } = require('./utils')

const osolog = require('osolog')
const R = require('radash')
const { WinnerCore } = require('./winnerCore')
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

  dealtPrivateCards(thisSocket) {
    try {
      this.dealer.dealCardsEachPlayer(2)
      this.stepChecker.grantStep('dealtPrivateCards')
      this.dealer.clearActedPlayers()

      this.communicator.msgBuilder('dealtPrivateCards', 'public', null, {
        displayMsg: 'Cards dealt!',
      })
      Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())

      this.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Private Cards Dealt',
          date: true,
        })
        .R(this.communicator.getFullInfo())

      for (const player of this.players) {
        this.communicator.msgBuilder('dealtPrivateCards', 'private', player, {})
        Socket.sendToPlayer(
          this.torneoId,
          player.secretCode,
          this.communicator.getMsg(),
        )
      }
      this.comms.sendOdds()
      this.continue(thisSocket, timeouts.fast) // ✅ Fast transition to bettingCore
    } catch (error) {
      console.error('Error in dealtPrivateCards:', error)
    }
  }

  continue(thisSocket, customDelay = null) {
    this.lastActivity = Date.now()
    const delay =
      customDelay !== null ? customDelay : this.isRunout ? timeouts.runout : timeouts.standard
    setTimeout(() => {
      this.startGame(thisSocket)
    }, delay)
  }

  winner = (winnerData, isFold = false) => {
    if (this.stepChecker.checkStep('winner')) return

    this.stepChecker.grantStep('blindsBetting')
    this.stepChecker.grantStep('dealtPrivateCards')
    this.stepChecker.grantStep('firstBetting')
    this.stepChecker.grantStep('flop_Dealer_Hand')
    this.stepChecker.grantStep('flop_Check_Prize_Step')
    this.stepChecker.grantStep('flop_Bet_Step')
    this.stepChecker.grantStep('turn_Dealer_Hand')
    this.stepChecker.grantStep('turn_Check_Prize_Step')
    this.stepChecker.grantStep('turn_Bet_Step')
    this.stepChecker.grantStep('river_Dealer_Hand')
    this.stepChecker.grantStep('river_Check_Prize_Step')
    this.stepChecker.grantStep('river_Bet_Step')
    this.stepChecker.grantStep('finalHands')
    this.stepChecker.grantStep('showDown')
    this.stepChecker.grantStep('winner')

    this.activePlayerId = null
    this.actions.clearAutofold()

    this.dealer.setFinalHands()

    const winnerPlayers = Array.isArray(winnerData) ? winnerData : [winnerData]

    const pot = this.dealer.getPot()
    const splitPot = Math.floor(pot / winnerPlayers.length)
    const finalHands = this.dealer.getFinalHands()

    // repartir dinero
    winnerPlayers.forEach((wp) => {
      const player = this.players.find((p) => p.id === (wp.playerId || wp.id))

      if (player) {
        player.chips += splitPot

        this.log
          .Template({
            name: 'brakets',
            title: 'MATCH - HAND WINNER',
            date: true,
          })
          .R({
            winner: player.name,
            amount: splitPot,
            isFold,
          })
      }
    })

    const winnersInfo = winnerPlayers.map((wp) => {
      const player = this.players.find((p) => p.id === (wp.playerId || wp.id))
      const winningHand = finalHands.find((h) => h.playerId === player?.id)

      return {
        name: player?.name || 'Unknown',
        playerId: player?.id,
        amount: splitPot,
        handName: isFold
          ? 'Fold Victory'
          : winningHand?.pokerHand || 'High Card',
        winningCards: isFold ? [] : winningHand?.show || [],
      }
    })

    // verificar si ya hay ganador del torneo
    const playersWithChips = this.players.filter(
      (p) => p.chips > 0 && p.connected,
    )

    const isTournamentWinner = playersWithChips.length === 1

    if (isTournamentWinner) {
      this.winnerTournament(winnersInfo)
    } else {
      this.winnerHand(winnersInfo, isFold, pot, finalHands)
    }

    this.waitingForNextRound = true
  }

  winnerHand(winnersInfo, isFold, pot, finalHands) {
    const displayMsg =
      winnersInfo.length > 1
        ? `Tie! ${winnersInfo.map((w) => w.name).join(' and ')} split $${pot}!`
        : `${winnersInfo[0].name} wins $${pot}${isFold ? ' (Fold)' : ''}!`

    this.log
      .Template({
        name: 'brakets',
        title: 'MATCH - HAND RESULT',
        date: true,
      })
      .R({
        winners: winnersInfo.map((w) => w.name),
        pot,
        isFold,
      })

    this.communicator.msgBuilder('winner', 'public', null, {
      method: 'winner',
      displayMsg,
      winners: winnersInfo,
      allHands: finalHands,
      isFold,
      isTournamentWinner: false,
    })

    Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())
  }

  winnerTournament(winnersInfo) {
    const winner = winnersInfo[0]

    this.log
      .Template({
        name: 'brakets',
        title: 'MATCH - TOURNAMENT WINNER',
        date: true,
      })
      .R({
        winner: winner.name,
        playerId: winner.playerId,
        chipsWon: winner.amount,
      })

    this.communicator.msgBuilder('winnerTournament', 'public', null, {
      method: 'winnerTournament',
      displayMsg: `🏆 ${winner.name} wins the tournament!`,
      winner,
      isTournamentWinner: true,
    })

    Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())
  }


  nextRound() {
    if (!this.waitingForNextRound) return
    this.waitingForNextRound = false
    const playersWithChips = this.players.filter(
      (p) => p.connected && p.chips > 0,
    )
    if (playersWithChips.length < 2) {
      this.log.R({ info: 'Tournament finished. No more rounds.' })
      return
    }
    this.restartMatch()
  }

  resetStacks() {
    const INITIAL_STACK = 1000
    this.log
      .Template({
        name: 'brakets',
        title: 'MATCH - Resetting Stacks',
        date: true,
      })
      .R({ reason: 'Not enough chips to continue' })

    this.players.forEach((p) => {
      if (p.connected) {
        p.chips = INITIAL_STACK
      }
    })
  }

  restartMatch() {
    this.acceptingPlayers = false
    const oldGameId = this.gameId
    this.gameId = generateUniqueId()

    this.log
      .Template({ name: 'brakets', title: 'MATCH - Restarting', date: true })
      .R({ oldGameId, newGameId: this.gameId })

    this.pot = 0
    this.playersFold = []
    this.activePlayerId = null
    this.isRunout = false

    this.players.forEach((p) => {
      p.gameId = this.gameId
      p.cards = []
      p.currentBet = 0
      p.folded = p.chips <= 0
      p.lastAction = p.chips <= 0 ? 'Out' : ''
      p.isAllIn = false
      p.setCurrentPrize({})
    })

    this.shuffledDeck = Deck.shuffleDeck(Deck.cards, 101)
    this.dealer.gameId = this.gameId
    this.dealer.deck = this.shuffledDeck
    this.dealer.cardsDealer = []
    this.cardsDealer = this.dealer.getDealerCards()
    this.dealer.pot = 0
    this.dealer.clearActedPlayers()
    this.dealer.setCurrentHighestBet(0)
    this.dealer.setLastRaiser(null)

    this.communicator.gameId = this.gameId
    this.stepChecker.reset()
    this.stepChecker.gameFlow.gameId = this.gameId

    if (this.players.length > 1) {
      this.players.push(this.players.shift())
    }

    this.communicator.msgBuilder('gameRestarted', 'public', null, {
      displayMsg: 'New hand starting...',
      newGameId: this.gameId,
    })
    Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())

    this.stepChecker.grantStep('signUp')
    this.startGame()
  }

  bettingCore = (thisSocket, bettingFor) => {
    if (this.stepChecker.checkStep('winner')) return

    const allPlayers = this.players
    const activePlayers = allPlayers.filter(
      (p) => p.connected && !p.folded && p.isStarted,
    )

    if (activePlayers.length === 1) {
      this.winner(activePlayers[0], true)
      return
    }

    const maxBet = this.dealer.getCurrentHighestBet()
    const actedPlayers = this.dealer.getPlayersActed()
    const canActPlayers = activePlayers.filter((p) => !p.isAllIn)

    const steps = {
      firstBetting: 'firstBetting',
      flopBetting: 'flop_Bet_Step',
      turnBetting: 'turn_Bet_Step',
      riverBetting: 'river_Bet_Step',
    }

    if (
      !this.isRunout &&
      canActPlayers.length <= 1 &&
      activePlayers.length > 1
    ) {
      const p = canActPlayers[0]
      if (!p || (p.getCurrentBet() >= maxBet && actedPlayers.includes(p.id))) {
        this.isRunout = true
        this.log
          .Template({ name: 'brakets', title: 'MATCH - RUNOUT', date: true })
          .R({ gameId: this.gameId })

        this.communicator.msgBuilder('runout', 'public', null, {
          displayMsg: 'All-in runout! Dealing remaining cards...',
        })
        Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())
      }
    }

    if (this.isRunout) {
      this.stepChecker.grantStep(steps[bettingFor])
      return this.continue(thisSocket)
    }

    let sorted = []
    if (bettingFor === 'firstBetting') {
      if (allPlayers.length === 2) {
        sorted = [...allPlayers]
      } else {
        sorted = [...allPlayers.slice(2), ...allPlayers.slice(0, 2)]
      }
    } else {
      sorted = [...allPlayers.slice(1), ...allPlayers.slice(0, 1)]
    }

    const playersToAct = sorted.filter(
      (p) =>
        p.connected &&
        !p.folded &&
        !p.isAllIn &&
        p.isStarted &&
        (p.getCurrentBet() < maxBet || !actedPlayers.includes(p.id)),
    )

    if (playersToAct.length === 0) {
      this.log
        .Template({
          name: 'brakets',
          title: `MATCH - Betting Round ${bettingFor} Finished`,
          date: true,
        })
        .R({ pot: this.dealer.getPot() })
      this.activePlayerId = null
      this.dealer.clearActedPlayers()
      this.dealer.setCurrentHighestBet(0)
      this.dealer.setLastRaiser(null)

      this.stepChecker.grantStep(steps[bettingFor])
      this.continue(thisSocket, timeouts.fast) // ✅ Fast transition
    } else {
      const p = playersToAct[0]
      if (this.activePlayerId === p.id) return

      this.activePlayerId = p.id
      if (p.lastAction !== 'Out') p.setLastAction('')

      let opts = []
      if (maxBet === 0) {
        // Nadie ha apostado aún en esta calle
        opts = ['check', 'bet', 'fold']
      } else {
        if (p.getCurrentBet() < maxBet) {
          // Alguien apostó más que yo
          opts = ['fold', 'call', 'raise']
        } else {
          // Ya igualé la apuesta máxima (ej. BB pre-flop o después de un Call mutuo)
          opts = ['check', 'raise', 'fold']
        }
      }

      this.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Waiting Player Act',
          date: true,
        })
        .R({
          player: p.name,
          options: opts,
          maxBet,
          playerBet: p.getCurrentBet(),
          playerChips: p.chips,
          actedPlayers: actedPlayers.map(
            (id) => this.players.find((pl) => pl.id === id)?.name,
          ),
        })

      this.communicator.msgBuilder(`bettingCore-${bettingFor}`, 'private', p, {
        messageForId: p.id,
        action: opts,
        displayMsg: 'Your turn',
      })
      Socket.sendToPlayer(
        this.torneoId,
        p.secretCode,
        this.communicator.getMsg(),
      )
      this.communicator.msgBuilder(`bettingCore-${bettingFor}`, 'public', p, {
        messageForId: p.id,
        action: opts,
        displayMsg: `Waiting for ${p.name}`,
      })
      Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())
      this.actions.startAutofold()
    }
  }

  dealerHand = (thisSocket, whatHand) => {
    this.log
      .Template({
        name: 'brakets',
        title: `MATCH - Dealer Hand: ${whatHand.toUpperCase()}`,
        date: true,
      })
      .R({ gameId: this.gameId })
    this.dealer.dealCardsDealer(whatHand === 'flop' ? 3 : 1)
    const steps = {
      flop: 'flop_Dealer_Hand',
      turn: 'turn_Dealer_Hand',
      river: 'river_Dealer_Hand',
    }
    this.stepChecker.grantStep(steps[whatHand])
    this.communicator.msgBuilder(`dealerHand-${whatHand}`, 'public', null, {
      displayMsg: `Dealer deals the ${whatHand}`,
    })
    Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())
    this.comms.sendOdds()
    this.continue(thisSocket, timeouts.fast) // ✅ Fast transition
  }

  checkPrizes(thisSocket) {
    const cards = this.dealer.getDealerCards()
    this.log
      .Template({
        name: 'brakets',
        title: 'MATCH - Checking Prizes',
        date: true,
      })
      .R({ cardsCount: cards.length })
    if (cards.length >= 3) {
      this.players.forEach((p) => {
        if (p && !p.folded) p.setCurrentPrize(p.checkPrize(cards))
      })
      const steps = {
        3: 'flop_Check_Prize_Step',
        4: 'turn_Check_Prize_Step',
        5: 'river_Check_Prize_Step',
      }
      this.stepChecker.grantStep(steps[cards.length])
    }
    this.continue(thisSocket, timeouts.fast) // ✅ Fast transition
  }

  startGame(thisSocket = {}) {
    if (this.stepChecker.checkStep('pause')) return

    if (!this.stepChecker.checkStep('blindsBetting') && thisSocket.id) {
      const p = this.players.find((p) => p.id === thisSocket.id)
      if (p && !p.isStarted) {
        this.lobby.playerReady(thisSocket)
      }
    }

    const readyPlayers = this.players.filter((p) => p.isStarted && p.connected)

    if (readyPlayers.length < 2) {
      this.communicator.msgBuilder('startGame', 'public', null, {
        displayMsg: 'Waiting for at least 2 players to be ready...',
      })
      Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())
      return
    }

    if (!this.stepChecker.checkStep('blindsBetting'))
      return this.actions.askForBlindBets(thisSocket)
    if (!this.stepChecker.checkStep('dealtPrivateCards'))
      return this.dealtPrivateCards(thisSocket)
    if (!this.stepChecker.checkStep('firstBetting'))
      return this.bettingCore(thisSocket, 'firstBetting')
    if (!this.stepChecker.checkStep('flop_Dealer_Hand')) {
      this.dealer.clearActedPlayers()
      this.dealer.getChipsFromPlayers()
      return this.dealerHand(thisSocket, 'flop')
    }
    if (!this.stepChecker.checkStep('flop_Check_Prize_Step'))
      return this.checkPrizes(thisSocket)
    if (!this.stepChecker.checkStep('flop_Bet_Step'))
      return this.bettingCore(thisSocket, 'flopBetting')
    if (!this.stepChecker.checkStep('turn_Dealer_Hand')) {
      this.dealer.clearActedPlayers()
      this.dealer.getChipsFromPlayers()
      return this.dealerHand(thisSocket, 'turn')
    }
    if (!this.stepChecker.checkStep('turn_Check_Prize_Step'))
      return this.checkPrizes(thisSocket)
    if (!this.stepChecker.checkStep('turn_Bet_Step'))
      return this.bettingCore(thisSocket, 'turnBetting')
    if (!this.stepChecker.checkStep('river_Dealer_Hand')) {
      this.dealer.clearActedPlayers()
      this.dealer.getChipsFromPlayers()
      return this.dealerHand(thisSocket, 'river')
    }
    if (!this.stepChecker.checkStep('river_Check_Prize_Step'))
      return this.checkPrizes(thisSocket)
    if (!this.stepChecker.checkStep('river_Bet_Step'))
      return this.bettingCore(thisSocket, 'riverBetting')
    if (!this.stepChecker.checkStep('finalHands')) {
      this.dealer.getChipsFromPlayers()
      this.dealer.setFinalHands()
      this.stepChecker.grantStep('finalHands')
      return this.continue(thisSocket)
    }
    if (!this.stepChecker.checkStep('showDown')) {
      this.log
        .Template({ name: 'brakets', title: 'MATCH - Showdown', date: true })
        .R(this.dealer.getFinalHands())
      this.communicator.msgBuilder('showDown', 'public', null, {
        method: 'showDown',
        showDown: this.dealer.getFinalHands(),
      })
      Socket.broadcastToTorneo(this.torneoId, this.communicator.getMsg())
      this.stepChecker.grantStep('showDown')
      return this.continue(thisSocket)
    }
    if (!this.stepChecker.checkStep('winner')) {
      const winnerData = WinnerCore.Winner(this.dealer.getFinalHands())
      if (
        !winnerData ||
        (Array.isArray(winnerData) && winnerData.length === 0)
      ) {
        return this.continue(thisSocket)
      }
      this.winner(winnerData)
      return
    }
  }

  stats(socketId) {
    this.log
      .Template({ name: 'brakets', title: 'MATCH - Stats', date: true })
      .R({ pot: this.dealer.getPot(), players: this.players.length })
  }
}

module.exports = Match
