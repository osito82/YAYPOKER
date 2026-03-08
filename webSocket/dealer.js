const Socket = require('./sockets')
const osolog = require('osolog')

class Dealer {
  log = new osolog()

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
  }

  // ===== Métodos clásicos =====
  getCurrentHighestBet() {
    return this.currentHighestBet
  }

  setCurrentHighestBet(amount) {
    this.currentHighestBet = Number(amount) || 0
  }

  getLastRaiser() {
    return this.lastRaiser
  }

  setLastRaiser(playerId) {
    this.lastRaiser = playerId
  }

  setFinalHands() {
    this.log
      .Template({ name: 'brakets', title: 'DEALER - Final Hands', date: true })
      .R({ gameId: this.gameId })

    this.finalHands = this.players.map((player) => {
      const prize = player.getCurrentPrize() || {}
      return {
        ...prize,
        name: player.name,
        playerId: player.id,
        gameId: player.gameId,
        chips: player.chips,
        folded: player.folded,
        connected: player.connected,
        lastAction: player.lastAction,
      }
    })
  }

  getFinalHands() {
    return this.finalHands
  }

  allPlayersCheck() {
    const activePlayers = this.players.filter((p) => p.connected && !p.folded)
    if (activePlayers.length === 0) return true

    const maxBet = Math.max(...activePlayers.map((p) => p.getCurrentBet()))
    return activePlayers.every(
      (p) => p.getCurrentBet() === maxBet && this.playersActed.includes(p.id)
    )
  }

  getPlayersActed() {
    return this.playersActed
  }

  clearActedPlayers() {
    this.playersActed = []
  }

  updatePlayerId(oldId, newId) {
    const idx = this.playersActed.indexOf(oldId)
    if (idx !== -1) this.playersActed[idx] = newId
    if (this.lastRaiser === oldId) this.lastRaiser = newId
  }

  setPlayerActed(thisSocketId) {
    if (thisSocketId && !this.playersActed.includes(thisSocketId)) {
      this.playersActed.push(thisSocketId)
    }
  }

  setPot(chipsToBet) {
    const amount = Number(chipsToBet)
    if (!isNaN(amount)) this.pot += amount
  }

  getPot() {
    return this.pot
  }

  getChipsFromPlayers() {
    this.log
      .Template({ name: 'brakets', title: 'DEALER - Collecting Chips', date: true })
      .R({ currentPot: this.pot })

    this.players.forEach((player) => player.giveChipsToDealer())
  }

  dealCardsEachPlayer(numberOfCards = 1) {
    this.log
      .Template({ name: 'brakets', title: 'DEALER - Dealing Players', date: true })
      .R({ count: numberOfCards, deckLeft: this.deck.length })

    for (let i = 0; i < numberOfCards; i++) {
      this.players.forEach((player) => {
        if (player.connected && !player.folded && player.countCards() < 2) {
          const cardToDeal = this.deck.shift()
          if (cardToDeal) {
            player.setCard(cardToDeal)
            this.talkToSocketById(player.id, {
              type: 'dealtPrivateCards',
              cards: player.cards,
            })
          }
        }
      })
    }
  }

  dealCardsDealer(numberOfCards = 1) {
    this.log
      .Template({ name: 'brakets', title: 'DEALER - Dealing Table', date: true })
      .R({ count: numberOfCards, deckLeft: this.deck.length })

    for (let i = 0; i < numberOfCards; i++) {
      const cardToDeal = this.deck.shift()
      if (cardToDeal) this.setCard(cardToDeal)
    }

    this.talkToAllSockets({ type: 'dealerHand-update', cardsDealer: this.cardsDealer })
  }

  getDealerCards() {
    return this.cardsDealer
  }

  setCard(card) {
    if (card) this.cardsDealer.push(card)
  }

  hasMinimumPlayers() {
    return this.players.filter((p) => p.connected).length >= 2
  }

  getPlayerByNumber(number) {
    return this.players[number - 1] || null
  }

  getPlayerById(id) {
    return this.players.find((p) => p.id === id) || null
  }

  hasPlayerBet(player) {
    return player ? player.getCurrentBet() !== 0 : false
  }

  hasPlayerBetByNumber(playerNumber) {
    const player = this.getPlayerByNumber(playerNumber)
    return player ? player.getCurrentBet() !== 0 : false
  }

  hasAllPlayersBet() {
    const activePlayers = this.players.filter((p) => p.connected && !p.folded)
    if (activePlayers.length === 0) return true
    return activePlayers.every((player) => Number(player.getCurrentBet()) !== 0)
  }

  // ===== Arrow functions solo si se pierden contextos =====
  talkToSocketById = (socketId, targetMessage) => {
    try {
      const targetSocket = Socket.getSocket(this.torneoId, socketId)
      if (targetSocket?.socket?.readyState === 1) {
        targetSocket.socket.send(JSON.stringify({ message: targetMessage }))
      }
    } catch (error) {
      console.log('Error in talkToSocketById:', error)
    }
  }

  talkToAllSockets = (targetMessage) => {
    try {
      const allSockets = Socket.getSocketsByTorneo(this.torneoId)
      allSockets?.forEach((socketWrapper) => {
        if (socketWrapper?.socket?.readyState === 1) {
          socketWrapper.socket.send(JSON.stringify({ message: targetMessage }))
        }
      })
    } catch (error) {
      console.log('Error in talkToAllSockets:', error)
    }
  }
}

module.exports = Dealer