// match 2
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

class Match {
  log = new osolog()

  constructor(torneoId, gameId) {
    this.torneoId = torneoId
    this.gameId = gameId

    this.players = []
    this.acceptingPlayers = true
    this.pauseTimeouts = new Map()
    this.autofoldTimer = null
    this.autofoldDuration = 600000 // 10 minutos

    this.playersFold = []
    this.pot = 0

    this.activePlayerId = null // Track who is expected to act
    this.waitingForNextRound = false

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

    this.log
      .Template({
        name: 'brakets',
        title: 'MATCH - New Game Created',
        date: true,
      })
      .R({ torneoId, gameId })
  }

  sendOdds() {
    const activePlayers = this.players.filter((p) => !p.folded && p.connected)
    if (activePlayers.length < 2) return

    const playerHands = activePlayers.map((p) => p.getCards())
    const boardCards = this.dealer.getDealerCards()

    const results = this.oddsCalculator.calculateOdds(playerHands, boardCards)

    activePlayers.forEach((p, idx) => {
      const playerOdds = {
        win: results.winProbabilities[idx],
        tie: results.tieProbability,
      }
      this.communicator.msgBuilder('oddsUpdate', 'private', p, {
        odds: playerOdds,
      })
      this.dealer.talkToPLayerById(p.id, this.communicator.getMsg())
    })
  }

  autofold() {
    const foundPlayer = this.players.find((p) => p.id == this.activePlayerId)
    if (foundPlayer) {
      this.log
        .Template({ name: 'brakets', title: 'MATCH - AUTOFOLD', date: true })
        .R({ player: foundPlayer.name })
      this.fold({ id: foundPlayer.id })
    }
  }

  startAutofold() {
    this.clearAutofold()
    this.autofoldTimer = setTimeout(() => {
      this.autofold()
    }, this.autofoldDuration)
  }

  clearAutofold() {
    if (this.autofoldTimer) {
      clearTimeout(this.autofoldTimer)
      this.autofoldTimer = null
    }
  }

  signUp(data, thisSocket) {
    const { id: thisSocketId } = thisSocket
    const existingPlayerIndex = this.players.findIndex(
      (s) => s.name === data.name,
    )

    let player
    if (existingPlayerIndex !== -1) {
      player = this.players[existingPlayerIndex]
      const oldId = player.id
      player.id = thisSocketId
      player.setConnected(true)

      // Actualizar referencias al ID antiguo si es necesario
      if (this.activePlayerId === oldId) {
        this.activePlayerId = thisSocketId
      }
      this.dealer.updatePlayerId(oldId, thisSocketId)

      const timeout = this.pauseTimeouts.get(player.name)
      if (timeout) {
        clearTimeout(timeout)
        this.pauseTimeouts.delete(player.name)
      }

      const stillPaused = this.players.some((p) => !p.connected)
      if (!stillPaused) {
        this.stepChecker.revokeStep('pause')
        this.continue(thisSocket)
      }

      this.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Player Reconnected',
          date: true,
        })
        .R({ name: player.name, id: player.id })
    } else {
      // Máximo 10 jugadores
      if (this.players.length >= 10) {
        this.communicator.msgBuilder('signUp', 'private', null, {
          displayMsg: 'Table is full (max 10 players).',
        })
        this.dealer.talkToSocketById(thisSocket.id, this.communicator.getMsg())
        return
      }

      // No permitir nuevos jugadores si el juego ya empezó
      if (!this.acceptingPlayers) {
        console.log(
          `[DEBUG] Blocking new player ${data.name} join because acceptingPlayers=false`,
        )
        this.communicator.msgBuilder('signUp', 'private', null, {
          displayMsg: 'Game in progress. Please wait for next round.',
        })
        this.dealer.talkToSocketById(thisSocket.id, this.communicator.getMsg())
        return
      }

      const playerNumber = this.players.length + 1
      player = new Player(
        this.gameId,
        data.name,
        data.secretCode,
        data.totalChips,
        [],
        thisSocketId,
        playerNumber,
      )
      player.setConnected(true)
      this.players.push(player)

      // Si llegamos a 10, cerramos registro inmediatamente
      if (this.players.length >= 10) {
        this.noMorePlayers()
      }

      this.log
        .Template({
          name: 'brakets',
          title: 'MATCH - New Player Joined',
          date: true,
        })
        .R({ name: player.name, chips: player.chips, num: playerNumber })
    }

    this.communicator.msgBuilder('signUp', 'public', player, {
      msg: `Welcome ${player.name}!`,
    })
    this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg())
    this.communicator.msgBuilder('signUp', 'private', player, {
      method: 'signUp',
      id: thisSocketId,
    })
    this.dealer.talkToPLayerById(thisSocketId, this.communicator.getMsg())

    const connectedPlayers = this.players.filter((p) => p.connected)
    if (
      connectedPlayers.length >= 2 &&
      !this.stepChecker.checkStep('blindsBetting')
    ) {
      this.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Enough Players To Start',
          date: true,
        })
        .R({ count: connectedPlayers.length })
      this.stepChecker.grantStep('signUp')
      this.askForBlindBets(thisSocket)
    }
  }

  noMorePlayers() {
    if (!this.acceptingPlayers) {
      console.log(
        `[DEBUG] noMorePlayers called but acceptingPlayers already false for game ${this.gameId}`,
      )
      return
    }
    console.log(`[DEBUG] Closing registration for game ${this.gameId}`)
    this.acceptingPlayers = false

    this.log
      .Template({
        name: 'brakets',
        title: 'MATCH - Registration Closed',
        date: true,
      })
      .R({ gameId: this.gameId })

    this.communicator.msgBuilder('noMorePlayers', 'public', null, {
      displayMsg: 'Registration closed. Game in progress.',
    })

    this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg())
  }

  dealtPrivateCards(thisSocket) {
    try {
      this.dealer.dealCardsEachPlayer(2)
      this.stepChecker.grantStep('dealtPrivateCards')
      this.dealer.removeChecks()

      this.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Private Cards Dealt',
          date: true,
        })
        .R(this.communicator.getFullInfo())

      for (const player of this.players) {
        this.communicator.msgBuilder('dealtPrivateCards', 'private', player, {})
        this.dealer.talkToPLayerById(player.id, this.communicator.getMsg())
      }
      this.communicator.msgBuilder('dealtPrivateCards', 'public', null, {
        displayMsg: 'Cards dealt!',
      })
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg())
      this.sendOdds()
      this.continue(thisSocket)
    } catch (error) {
      console.error('Error in dealtPrivateCards:', error)
    }
  }

  setBet(thisSocket, chipsToBet, type = 'setBet') {
    if (this.activePlayerId && this.activePlayerId !== thisSocket.id) {
      this.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Action Rejected',
          date: true,
        })
        .R({
          player: thisSocket.name,
          reason: 'Not your turn',
          expected: this.activePlayerId,
        })
      return
    }

    this.clearAutofold()
    if (this.acceptingPlayers) {
      console.log(
        `[DEBUG] Action ${type} from ${thisSocket.name} closing registration`,
      )
      this.noMorePlayers()
    }

    const foundPlayer = this.players.find((p) => p.id == thisSocket.id)
    if (foundPlayer) {
      const amount = Number(chipsToBet)
      const currentBetBefore = foundPlayer.getCurrentBet()
      const success = foundPlayer.setTotalBet(amount)

      if (success) {
        this.activePlayerId = null // Clear turn
        const addedChips = amount - currentBetBefore
        foundPlayer.setLastAction(type === 'setBet' ? 'Bet' : 'Raise')
        this.dealer.setPot(addedChips)

        if (amount > this.dealer.getCurrentHighestBet()) {
          this.dealer.setCurrentHighestBet(amount)
          this.dealer.setLastRaiser(foundPlayer.id)
          this.dealer.removeChecks()
        }

        this.dealer.setChecked(foundPlayer.id)

        this.log
          .Template({
            name: 'brakets',
            title: `MATCH - ${type.toUpperCase()}`,
            date: true,
          })
          .R({
            player: foundPlayer.name,
            added: addedChips,
            totalBet: foundPlayer.getCurrentBet(),
            newPot: this.dealer.getPot(),
          })

        this.communicator.msgBuilder('setBet', 'public', foundPlayer, {
          displayMsg: `${foundPlayer.name} ${type === 'setBet' ? 'bets' : 'raises to'} ${amount}`,
          name: foundPlayer.name,
          bet: foundPlayer.getCurrentBet(),
        })
        this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg())
      }
    }
    this.continue(thisSocket)
  }

  setCall(thisSocket) {
    // 🔒 Validar turno
    if (this.activePlayerId && this.activePlayerId !== thisSocket.id) return

    const maxBet = this.dealer.getCurrentHighestBet()
    const foundPlayer = this.players.find((p) => p.id == thisSocket.id)
    if (!foundPlayer) return

    this.clearAutofold()
    if (this.acceptingPlayers) {
      console.log(
        `[DEBUG] Action setCall from ${foundPlayer.name} closing registration`,
      )
      this.noMorePlayers()
    }

    const currentBetBefore = foundPlayer.getCurrentBet()
    const diff = maxBet - currentBetBefore

    // Nada que igualar
    if (diff <= 0) return

    this.activePlayerId = null

    let amountAdded = 0
    let actionType = 'Call'

    // 🔥 CASO ALL-IN (no puede cubrir la apuesta completa)
    if (foundPlayer.chips <= diff) {
      amountAdded = foundPlayer.chips

      foundPlayer.setTotalBet(currentBetBefore + amountAdded)
      foundPlayer.chips = 0
      foundPlayer.isAllIn = true
      actionType = 'All-In'
    } else {
      // ✅ Call normal
      amountAdded = diff
      foundPlayer.setTotalBet(maxBet)
    }

    // Actualizar pot
    this.dealer.setPot(amountAdded)

    // Marcar como que ya actuó
    this.dealer.setChecked(foundPlayer.id)
    foundPlayer.setLastAction(actionType)

    // Log
    this.log
      .Template({
        name: 'brakets',
        title: `MATCH - ${actionType.toUpperCase()}`,
        date: true,
      })
      .R({
        player: foundPlayer.name,
        added: amountAdded,
        totalBet: foundPlayer.getCurrentBet(),
        remainingChips: foundPlayer.chips,
        newPot: this.dealer.getPot(),
      })

    // Mensaje público
    this.communicator.msgBuilder('setCall', 'public', foundPlayer, {
      displayMsg: `${foundPlayer.name} ${actionType === 'All-In' ? 'goes all-in' : 'calls'}`,
      name: foundPlayer.name,
      bet: foundPlayer.getCurrentBet(),
    })

    this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg())

    this.continue(thisSocket)
  }

  setCheck = (thisSocket) => {
    if (this.activePlayerId && this.activePlayerId !== thisSocket.id) return

    const foundPlayer = this.players.find((p) => p.id == thisSocket.id)
    if (foundPlayer) {
      if (foundPlayer.getCurrentBet() === this.dealer.getCurrentHighestBet()) {
        this.clearAutofold()
        this.activePlayerId = null
        this.dealer.setChecked(thisSocket.id)
        foundPlayer.setLastAction('Check')
        this.log
          .Template({ name: 'brakets', title: 'MATCH - CHECK', date: true })
          .R({ player: foundPlayer.name })
        this.communicator.msgBuilder('setCheck', 'public', foundPlayer, {
          displayMsg: `${foundPlayer.name} checks`,
        })
        this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg())
      }
    }
    this.continue(thisSocket)
  }

  setRise(thisSocket, chipsToBet) {
    this.setBet(thisSocket, chipsToBet, 'setRise')
  }

  askForBlindBets(thisSocket) {
    // Filter active players (connected and with chips)
    const activePlayers = this.players.filter((p) => p.connected && p.chips > 0)

    if (activePlayers.length < 2) {
      this.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Not Enough Active Players',
          date: true,
        })
        .R({ activeCount: activePlayers.length })
      return
    }

    const p1 = activePlayers[0]
    const p2 = activePlayers[1]

    if (p1 && p2 && p1.getCurrentBet() > 0 && p2.getCurrentBet() > 0) {
      this.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Blinds Completed',
          date: true,
        })
        .R({ pot: this.dealer.getPot() })
      this.stepChecker.grantStep('blindsBetting')
      this.continue(thisSocket)
    } else {
      let p = p1 && p1.getCurrentBet() === 0 ? p1 : p2
      if (p) {
        const isSB = p === p1
        this.activePlayerId = p.id
        this.log
          .Template({
            name: 'brakets',
            title: 'MATCH - Asking Blinds',
            date: true,
          })
          .R({ player: p.name, type: isSB ? 'SB' : 'BB' })
        this.communicator.msgBuilder(`askForBlindBets`, 'public', p, {
          displayMsg: `Waiting for ${p.name} (${isSB ? 'SB' : 'BB'})`,
        })
        this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg())
        this.communicator.msgBuilder(`askForBlindBets`, 'private', p, {
          id: p.id,
          displayMsg: `YOUR TURN: ${isSB ? 'Small' : 'Big'} Blind`,
        })
        this.dealer.talkToPLayerById(p.id, this.communicator.getMsg())
        this.startAutofold()
      }
    }
  }

  fold(thisSocket) {
    if (this.activePlayerId && this.activePlayerId !== thisSocket.id) return

    const foundPlayer = this.players.find((p) => p.id == thisSocket.id)
    if (foundPlayer && !foundPlayer.folded) {
      this.clearAutofold()
      if (this.acceptingPlayers) {
        console.log(
          `[DEBUG] Action fold from ${foundPlayer.name} closing registration`,
        )
        this.noMorePlayers()
      }
      this.activePlayerId = null
      foundPlayer.setLastAction('Fold')
      foundPlayer.setFolded(true)
      this.playersFold.push(foundPlayer.name)
      this.dealer.setChecked(foundPlayer.id)

      this.log
        .Template({ name: 'brakets', title: 'MATCH - FOLD', date: true })
        .R({ player: foundPlayer.name })

      this.communicator.msgBuilder('fold', 'public', foundPlayer, {
        displayMsg: `${foundPlayer.name} folded.`,
      })
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg())
      this.sendOdds()
      this.continue(thisSocket)
    }
  }

  continue(thisSocket) {
    setTimeout(() => {
      this.startGame(thisSocket)
    }, 500)
  }

  winner = (winnerData, isFold = false) => {
    if (this.stepChecker.checkStep('winner')) return
    this.stepChecker.grantStep('winner')
    this.activePlayerId = null
    this.clearAutofold()

    // Preparar manos finales incluso en fold para que el overlay tenga datos de los oponentes
    this.dealer.setFinalHands()

    const winnerPlayers = Array.isArray(winnerData) ? winnerData : [winnerData]
    const pot = this.dealer.getPot()
    const splitPot = Math.floor(pot / winnerPlayers.length)
    const finalHands = this.dealer.getFinalHands()

    winnerPlayers.forEach((wp) => {
      const player = this.players.find((p) => p.id === (wp.playerId || wp.id))
      if (player) {
        player.chips += splitPot

        this.log
          .Template({ name: 'brakets', title: 'MATCH - WINNER', date: true })
          .R({
            winner: player.name,
            amount: splitPot,
            isFold: isFold,
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

    const displayMsg =
      winnersInfo.length > 1
        ? `Tie! ${winnersInfo.map((w) => w.name).join(' and ')} split $${pot}!`
        : `${winnersInfo[0].name} wins $${pot}${isFold ? ' (Fold)' : ''}!`

    this.communicator.msgBuilder('winner', 'public', null, {
      method: 'winner',
      displayMsg,
      winners: winnersInfo,
      allHands: finalHands,
      isFold: isFold,
    })
    this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg())

    this.waitingForNextRound = true
  }

  nextRound() {
    if (this.waitingForNextRound) {
      this.waitingForNextRound = false
      this.restartMatch()
    }
  }

  restartMatch() {
    this.acceptingPlayers = true
    const oldGameId = this.gameId
    this.gameId = generateUniqueId() // Generar nuevo ID para la nueva mano

    this.log
      .Template({ name: 'brakets', title: 'MATCH - Restarting', date: true })
      .R({ oldGameId, newGameId: this.gameId })

    this.pot = 0
    this.playersFold = []
    this.activePlayerId = null

    // Resetear jugadores pero mantener sus fichas y conexión
    this.players.forEach((p) => {
      p.gameId = this.gameId
      p.cards = []
      p.currentBet = 0
      p.folded = false
      p.lastAction = ''
      p.isAllIn = false
      p.setCurrentPrize({})
    })

    // Resetear el Dealer con el nuevo ID y mazo
    this.shuffledDeck = Deck.shuffleDeck(Deck.cards, 101)
    this.dealer.gameId = this.gameId
    this.dealer.deck = this.shuffledDeck
    this.dealer.cardsDealer = []
    this.cardsDealer = this.dealer.getDealerCards()
    this.dealer.pot = 0
    this.dealer.removeChecks()
    this.dealer.setCurrentHighestBet(0)
    this.dealer.setLastRaiser(null)

    // Actualizar el gameId en los componentes de apoyo
    this.communicator.gameId = this.gameId
    this.stepChecker.reset()
    this.stepChecker.gameFlow.gameId = this.gameId

    // Rotar el botón (Dealer) para la siguiente mano
    if (this.players.length > 1) {
      this.players.push(this.players.shift())
    }

    // Notificar a todos del cambio de ID y reinicio
    this.communicator.msgBuilder('gameRestarted', 'public', null, {
      displayMsg: 'New hand starting...',
      newGameId: this.gameId,
    })
    this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg())

    this.stepChecker.grantStep('signUp')
    this.startGame()
  }

  bettingCore = (thisSocket, bettingFor) => {
    if (this.stepChecker.checkStep('winner')) return

    const allPlayers = this.players
    const activePlayers = allPlayers.filter((p) => p.connected && !p.folded)

    if (activePlayers.length === 1) {
      this.winner(activePlayers[0], true)
      return
    }

    const maxBet = this.dealer.getCurrentHighestBet()
    const checkedPlayers = this.dealer.getPlayersChecked()

    let sorted = []

    if (bettingFor === 'firstBetting') {
      if (allPlayers.length === 2) {
        // Heads-up pre-flop: Dealer(0) acts first (SB), BB(1) acts last
        sorted = [...allPlayers]
      } else {
        // 3+ players pre-flop: UTG acts first (P3)
        sorted = [...allPlayers.slice(3), ...allPlayers.slice(0, 3)]
      }
    } else {
      // Post-flop (Flop, Turn, River):
      if (allPlayers.length === 2) {
        // Heads-up post-flop: SB(0) acts first, BB(1) acts last
        // This matches the user's requirement to avoid consecutive checks for the same player
        sorted = [...allPlayers]
      } else {
        // 3+ players post-flop: SB(1) acts first
        sorted = [...allPlayers.slice(1), ...allPlayers.slice(0, 1)]
      }
    }

    // Now filter only those who are still in the hand but KEEP the sorted order
    const playersToAct = sorted.filter(
      (p) =>
        p.connected &&
        !p.folded &&
        !p.isAllIn &&
        (p.getCurrentBet() < maxBet || !checkedPlayers.includes(p.id)),
    )

    this.log
      .Template({
        name: 'brakets',
        title: `MATCH - Debug Betting ${bettingFor}`,
        date: true,
      })
      .R({
        maxBet,
        checkedCount: checkedPlayers.length,
        checkedPlayers: checkedPlayers.map(
          (id) => this.players.find((pl) => pl.id === id)?.name,
        ),
        playersToAct: playersToAct.map((p) => p.name),
      })

    if (playersToAct.length === 0) {
      this.log
        .Template({
          name: 'brakets',
          title: `MATCH - Betting Round ${bettingFor} Finished`,
          date: true,
        })
        .R({ pot: this.dealer.getPot() })
      this.activePlayerId = null
      this.dealer.removeChecks()
      this.dealer.setCurrentHighestBet(0)
      this.dealer.setLastRaiser(null)

      const steps = {
        firstBetting: 'firstBetting',
        flopBetting: 'flop_Bet_Step',
        turnBetting: 'turn_Bet_Step',
        riverBetting: 'river_Bet_Step',
      }
      this.stepChecker.grantStep(steps[bettingFor])
      this.continue(thisSocket)
    } else if (playersToAct.length > 0) {
      const p = playersToAct[0]
      this.activePlayerId = p.id

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
          // Se puede hacer Check para pasar o Raise para subir
          opts = ['check', 'raise', 'fold']
        }
      }

      this.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Waiting Player Act',
          date: true,
        })
        .R({ player: p.name, options: opts })

      this.communicator.msgBuilder(`bettingCore-${bettingFor}`, 'private', p, {
        messageForId: p.id,
        action: opts,
        displayMsg: 'Your turn',
      })
      this.dealer.talkToPLayerById(p.id, this.communicator.getMsg())

      this.communicator.msgBuilder(`bettingCore-${bettingFor}`, 'public', p, {
        messageForId: p.id,
        action: opts,
        displayMsg: `Waiting for ${p.name}`,
      })
      this.dealer.talkToPlayerBUTid(p.id, this.communicator.getMsg())
      this.startAutofold()
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
    this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg())
    this.sendOdds()
    this.continue(thisSocket)
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
    this.continue(thisSocket)
  }

  startGame(thisSocket = {}) {
    if (this.stepChecker.checkStep('pause')) return

    if (!this.dealer.hasMinimumPlayers()) {
      this.communicator.msgBuilder('startGame', 'public', null, {
        displayMsg: 'Waiting for players...',
      })
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg())
      return
    }
    if (!this.stepChecker.checkStep('blindsBetting'))
      return this.askForBlindBets(thisSocket)
    if (!this.stepChecker.checkStep('dealtPrivateCards'))
      return this.dealtPrivateCards(thisSocket)
    if (!this.stepChecker.checkStep('firstBetting'))
      return this.bettingCore(thisSocket, 'firstBetting')
    if (!this.stepChecker.checkStep('flop_Dealer_Hand')) {
      this.dealer.getChipsFromPlayers()
      return this.dealerHand(thisSocket, 'flop')
    }
    if (!this.stepChecker.checkStep('flop_Check_Prize_Step'))
      return this.checkPrizes(thisSocket)
    if (!this.stepChecker.checkStep('flop_Bet_Step'))
      return this.bettingCore(thisSocket, 'flopBetting')
    if (!this.stepChecker.checkStep('turn_Dealer_Hand')) {
      this.dealer.getChipsFromPlayers()
      return this.dealerHand(thisSocket, 'turn')
    }
    if (!this.stepChecker.checkStep('turn_Check_Prize_Step'))
      return this.checkPrizes(thisSocket)
    if (!this.stepChecker.checkStep('turn_Bet_Step'))
      return this.bettingCore(thisSocket, 'turnBetting')
    if (!this.stepChecker.checkStep('river_Dealer_Hand')) {
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
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg())
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

  pause(thisSocket) {
    const time = 60000
    const socketId = typeof thisSocket === 'string' ? thisSocket : thisSocket.id
    const foundPlayer = this.players.find((p) => p.id === socketId)
    if (foundPlayer) {
      foundPlayer.setConnected(false)
      this.clearAutofold()
      this.stepChecker.grantStep('pause')
      this.log
        .Template({ name: 'brakets', title: 'MATCH - PAUSE', date: true })
        .R({ player: foundPlayer.name, reason: 'Disconnected' })

      this.communicator.msgBuilder('pause', 'public', foundPlayer, {
        displayMsg: `${foundPlayer.name} disconnected. Waiting ${time / 1000} seconds for reconnection...`,
        timeout: 60,
      })
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg())

      const timeout = setTimeout(() => {
        this.playerLeave(thisSocket)
        this.pauseTimeouts.delete(foundPlayer.name)
      }, time) // 1 minute
      this.pauseTimeouts.set(foundPlayer.name, timeout)
    }
  }

  close(thisSocket) {
    this.playerLeave(thisSocket)
  }

  playerLeave(thisSocket) {
    const socketId = typeof thisSocket === 'string' ? thisSocket : thisSocket.id
    const index = this.players.findIndex((p) => p.id === socketId)

    if (index !== -1) {
      const playerLeaving = this.players[index]

      this.communicator.msgBuilder('playerLeave', 'public', playerLeaving, {
        displayMsg: `${playerLeaving.name} has left the game.`,
      })
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg())

      this.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Player Leaving',
          date: true,
        })
        .R({ player: playerLeaving.name })

      if (this.activePlayerId === playerLeaving.id) {
        this.activePlayerId = null
        this.clearAutofold()
      }

      this.players.splice(index, 1)
    }

    const stillPaused = this.players.some((p) => !p.connected)
    if (!stillPaused) {
      this.stepChecker.revokeStep('pause')
    }

    this.continue(thisSocket)
  }

  stats(socketId) {
    this.log
      .Template({ name: 'brakets', title: 'MATCH - Stats', date: true })
      .R({ pot: this.dealer.getPot(), players: this.players.length })
  }
}

module.exports = Match
