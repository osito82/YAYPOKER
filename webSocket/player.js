const PokerCore = require('./pokerCore')

class Player {
  constructor(gameId, name, secretCode, chips, cards, id, playerNumber) {
    this.name = name
    this.id = id
    this.gameId = gameId
    this.secretCode = secretCode
    this.chips = Number(chips) || 0
    this.cards = Array.isArray(cards) ? cards : []
    this.lastAction = ''
    this.connected = true
    this.folded = false
    this.isAllIn = false
    this.isStarted = false
    this.playerNumber = playerNumber
    this.currentBet = 0
    this.handContribution = 0
    this.isBot =
      name.toLowerCase().includes('bot') || name.toLowerCase().includes('_ia')
  }

  currentPrize = {}

  getHandContribution = () => {
    return this.handContribution
  }

  setHandContribution = (amount) => {
    this.handContribution = Number(amount) || 0
  }

  setStarted = (status) => {
    this.isStarted = !!status
  }

  setCard = (card) => {
    this.cards.push(card)
  }

  setCurrentPrize = (prize) => {
    this.currentPrize = prize
  }

  getCurrentPrize = () => {
    return this.currentPrize
  }

  getCards = () => {
    return this.cards
  }

  countCards = () => {
    return this.cards.length
  }

  getPlayer(playersArray, playerId) {
    return playersArray.find((player) => player.id === playerId)
  }

  getPlayerId = () => {
    return this.id
  }

  getPlayerName = () => {
    return this.name
  }

  getChips = () => {
    return this.chips
  }

  getCurrentBet = () => {
    return this.currentBet
  }

  setLastAction = (action) => {
    this.lastAction = action
  }

  setConnected = (status) => {
    this.connected = !!status
  }

  setFolded = (status) => {
    this.folded = !!status
    if (this.folded) this.cards = []
  }

  giveChipsToDealer = () => {
    this.currentBet = 0
  }

  checkPrize = (dealerCards) => {
    if (!dealerCards) return
    const myHand = PokerCore.betterHand(dealerCards, this.cards)
    return myHand
  }

  setBet(chipsToBet) {
    const amount = Number(chipsToBet)
    if (isNaN(amount) || amount <= 0) return false

    if (amount > this.chips) {
      return false
    } else {
      this.chips -= amount
      this.currentBet += amount
      this.handContribution += amount
      if (this.chips === 0) this.isAllIn = true
      return true
    }
  }

  setTotalBet(totalAmount) {
    const amount = Number(totalAmount)
    if (isNaN(amount)) return false

    const diff = amount - this.currentBet
    if (diff < 0) return false

    if (diff > this.chips) {
      this.handContribution += this.chips
      this.currentBet += this.chips
      this.chips = 0
      this.isAllIn = true
      return true
    }

    this.chips -= diff
    this.currentBet = amount
    this.handContribution += diff
    if (this.chips === 0) this.isAllIn = true
    return true
  }

  toJson() {
    return {
      id: this.id,
      name: this.name,
      chips: this.chips,
      currentBet: this.currentBet,
      handContribution: this.handContribution, // ✅ AHORA SE ENVÍA
      folded: this.folded,
      isAllIn: this.isAllIn,
      isStarted: this.isStarted,
      connected: this.connected,
      lastAction: this.lastAction,
      playerNumber: this.playerNumber,
      currentPrize: this.currentPrize,
      isBot: this.isBot,
    }
  }
}

module.exports = Player
