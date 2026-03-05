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
    this.playerNumber = playerNumber
    this.currentBet = 0
  }

  currentPrize = {}

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
      if (this.chips === 0) this.isAllIn = true
      return true
    }
  }

  setTotalBet(totalAmount) {
    const amount = Number(totalAmount)
    if (isNaN(amount)) return false

    const diff = amount - this.currentBet
    if (diff < 0) return false
    if (diff > this.chips) return false

    this.chips -= diff
    this.currentBet = amount
    if (this.chips === 0) this.isAllIn = true
    return true
  }

  toJson() {
    return {
      id: this.id,
      name: this.name,
      chips: this.chips,
      currentBet: this.currentBet,
      folded: this.folded,
      isAllIn: this.isAllIn,
      connected: this.connected,
      lastAction: this.lastAction,
      playerNumber: this.playerNumber,
      currentPrize: this.currentPrize,
    }
  }
}

module.exports = Player
