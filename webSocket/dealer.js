const Socket = require('./sockets')
const log = require('./logger')

class Dealer {
  log = log

  constructor(gameId, players, deck, torneoId, pot, cardsDealer) {
    this.gameId = gameId
    this.torneoId = torneoId
    this.deck = deck
    this.players = players
    this.pot = Number(pot) || 0
    this.cardsDealer = cardsDealer || []
    this.playersActed = []
    this.finalHands = []
    this.currentHighestBet = 0
    this.lastRaiser = null
    this.lastRaiseAmount = 0
  }

  setLastRaiseAmount = (amount) => {
    this.lastRaiseAmount = Number(amount) || 0
  }

  getLastRaiseAmount = () => {
    return this.lastRaiseAmount
  }

  getCurrentHighestBet = () => {
    return this.currentHighestBet
  }

  setCurrentHighestBet = (amount) => {
    this.currentHighestBet = Number(amount) || 0
  }

  getLastRaiser = () => {
    return this.lastRaiser
  }

  setLastRaiser = (playerId) => {
    this.lastRaiser = playerId
  }

  setFinalHands = () => {
    this.log
      .Template({ name: 'brakets', title: 'DEALER:FINAL_HANDS', date: true })
      .R({ gameId: this.gameId, dealerCards: this.cardsDealer })
    this.finalHands = []
    this.players.forEach((player) => {
      const prize = (player.getCurrentPrize && player.getCurrentPrize()) || {}
      this.finalHands.push({
        ...prize,
        name: player.name,
        playerId: player.id,
        gameId: player.gameId,
        chips: player.chips,
        playerCards: player.getCards ? player.getCards() : [],
        folded: player.folded,
        connected: player.connected,
        lastAction: player.lastAction,
      })
    })
  }

  getFinalHands = () => {
    return this.finalHands
  }

  allPlayersCheck = () => {
    const activePlayers = this.players.filter(
      (p) => p.connected && !p.folded && p.isStarted,
    )
    if (activePlayers.length === 0) return true

    const maxBet = Math.max(...activePlayers.map((p) => p.getCurrentBet()))
    return activePlayers.every(
      (p) => p.getCurrentBet() === maxBet && this.playersActed.includes(p.id),
    )
  }

  getPlayersActed = () => {
    return this.playersActed
  }

  clearActedPlayers = () => {
    this.playersActed = []
  }

  updatePlayerId = (oldId, newId) => {
    const checkIndex = this.playersActed.indexOf(oldId)
    if (checkIndex !== -1) {
      this.playersActed[checkIndex] = newId
    }
    if (this.lastRaiser === oldId) {
      this.lastRaiser = newId
    }
  }

  setPlayerActed = (thisSocketId) => {
    if (thisSocketId && !this.playersActed.includes(thisSocketId)) {
      this.playersActed.push(thisSocketId)
    }
  }

  setPot(chipsToBet) {
    const amount = Number(chipsToBet)
    if (!isNaN(amount)) {
      this.pot = Number(this.pot) + amount
    }
  }

  getPot() {
    return this.pot
  }

  calculatePots() {
    // 1. Get all players who contributed something
    const contributors = this.players.filter((p) => p.getHandContribution() > 0)

    if (contributors.length === 0) return []

    // 2. Identify relevant contribution boundaries: All-In amounts and the maximum contribution
    const allInContributions = contributors
      .filter((p) => p.isAllIn)
      .map((p) => p.getHandContribution())

    const maxContribution = Math.max(
      ...contributors.map((p) => p.getHandContribution()),
    )

    // Sort boundaries and remove duplicates
    const boundaries = [
      ...new Set([...allInContributions, maxContribution]),
    ].sort((a, b) => a - b)

    const pots = []
    let prevBoundary = 0

    for (const currentBoundary of boundaries) {
      const boundaryLayer = currentBoundary - prevBoundary

      // Who contributed AT LEAST this much?
      const whoContributed = contributors.filter(
        (p) => p.getHandContribution() >= currentBoundary,
      )

      // Who is ELIGIBLE to win this layer? (Must have contributed AND not folded)
      const eligiblePlayers = whoContributed
        .filter((p) => !p.folded)
        .map((p) => p.id)

      const potAmount = boundaryLayer * whoContributed.length

      // Add any "excess" from players who contributed more than prevBoundary but less than currentBoundary
      // (This handles players who went All-In at different levels)
      const partialContributors = contributors.filter(
        (p) =>
          p.getHandContribution() > prevBoundary &&
          p.getHandContribution() < currentBoundary,
      )

      let extraAmount = 0
      for (const p of partialContributors) {
        extraAmount += p.getHandContribution() - prevBoundary
      }

      const totalLayerAmount = potAmount + extraAmount

      if (totalLayerAmount > 0) {
        pots.push({
          amount: totalLayerAmount,
          eligiblePlayerIds: eligiblePlayers,
        })
      }

      prevBoundary = currentBoundary
    }

    // If no pots were created but there is money in the pot
    if (pots.length === 0 && this.pot > 0) {
      const activePlayers = this.players
        .filter((p) => !p.folded)
        .map((p) => p.id)
      pots.push({
        amount: this.pot,
        eligiblePlayerIds: activePlayers,
      })
    }

    return pots
  }

  getChipsFromPlayers = () => {
    this.log
      .Template({
        name: 'brakets',
        title: 'DEALER:COLLECTING_CHIPS',
        date: true,
      })
      .R({ currentPot: this.pot, dealerCards: this.cardsDealer })
    this.players.forEach((player) => player.giveChipsToDealer())
  }

  dealCardsEachPlayer = (numberOfCards = 2) => {
    this.log
      .Template({
        name: 'brakets',
        title: 'DEALER:DEALING_PLAYERS',
        date: true,
      })
      .R({
        count: numberOfCards,
        deckLeft: this.deck.length,
        dealerCards: this.cardsDealer,
      })

    for (let i = 0; i < numberOfCards; i++) {
      this.players.forEach((player) => {
        if (player.connected && !player.folded && player.isStarted) {
          const cardToDeal = this.deck.shift()
          if (cardToDeal) player.setCard(cardToDeal)
        }
      })
    }
  }

  dealCardsDealer(numberOfCards = 1) {
    this.log
      .Template({
        name: 'brakets',
        title: 'DEALER:DEALING_TABLE',
        date: true,
      })
      .R({
        count: numberOfCards,
        deckLeft: this.deck.length,
        dealerCards: this.cardsDealer,
      })
    for (let i = 0; i < numberOfCards; i++) {
      const cardToDeal = this.deck.shift()
      if (cardToDeal) {
        this.setCard(cardToDeal)
      }
    }
  }

  getDealerCards() {
    return this.cardsDealer
  }

  setCard(card) {
    if (card) {
      this.cardsDealer.push(card)
    }
  }

  hasMinimumPlayers() {
    const connectedPlayers = this.players.filter((p) => p.connected)
    return connectedPlayers.length >= 2
  }

  getPlayerByNumber(number) {
    const idx = Number(number) - 1
    const foundPlayer = this.players[idx]

    if (foundPlayer) {
      return foundPlayer
    } else {
      return null
    }
  }

  getPlayerById(id) {
    const foundPlayer = this.players.find((myPlayer) => myPlayer.id === id)
    if (foundPlayer) {
      return foundPlayer
    } else {
      return null
    }
  }

  hasPlayerBetByNumber = (playerNumber) => {
    const playerToCheck = this.getPlayerByNumber(playerNumber)
    if (playerToCheck) {
      return playerToCheck.getCurrentBet() !== 0
    }
    return false
  }

  hasPlayerBet(player) {
    if (player) {
      return player.getCurrentBet() !== 0
    } else {
      return false
    }
  }

  hasAllPlayersBet = () => {
    const activePlayers = this.players.filter(
      (p) => p.connected && !p.folded && p.isStarted,
    )
    if (activePlayers.length === 0) return true
    return activePlayers.every((player) => {
      return Number(player.getCurrentBet()) !== 0
    })
  }

  talkToSocketById(socketId, targetMessage) {
    try {
      const targetSocket = Socket.getSocket(this.torneoId, socketId)
      if (
        targetSocket &&
        targetSocket.socket &&
        targetSocket.socket.readyState === 1
      ) {
        targetSocket.socket.send(JSON.stringify({ message: targetMessage }))
      }
    } catch (error) {
      console.log('Error in talkToSocketById:', error)
    }
  }

  talkToAllSockets(targetMessage) {
    try {
      const allSockets = Socket.getSocketsByTorneo(this.torneoId)
      if (allSockets) {
        allSockets.forEach((socketWrapper) => {
          if (
            socketWrapper &&
            socketWrapper.socket &&
            socketWrapper.socket.readyState === 1
          ) {
            socketWrapper.socket.send(
              JSON.stringify({ message: targetMessage }),
            )
          }
        })
      }
    } catch (error) {
      console.log('Error in talkToAllSockets:', error)
    }
  }
}

module.exports = Dealer
