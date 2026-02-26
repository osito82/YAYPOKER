const PokerCore = require("./pokerCore");

class Player {
  constructor(gameId, name, secretCode, chips, cards, id, playerNumber) {
    this.name = name;
    this.id = id;
    this.gameId = gameId;
    this.secretCode = secretCode
    this.chips = chips;
    this.cards = cards;
    this.lastAction = "";
    this.connected = true;
    this.folded = false;
    this.playerNumber = playerNumber;
  }

  currentBet = 0;
  currentPrize = {};

  setCard = (card) => {
    this.cards.push(card);
  };

  setCurrentPrize = (prize) => {
    this.currentPrize = prize;
  };

  getCurrentPrize = () => {
    return this.currentPrize;
  };

  getCards = () => {
    return this.cards;
  };

  countCards = () => {
    return this.cards.length;
  };

  getPlayer(playersArray, playerId) {
    return playersArray.find((player) => player.id === playerId);
  }

  getPlayerId = () => {
    return this.id;
  };

  getPlayerName = () => {
    return this.name;
  };

  getChips = () => {
    return this.chips;
  };

  getCurrentBet = () => {
    return this.currentBet;
  };

  setLastAction = (action) => {
    this.lastAction = action;
  };

  setConnected = (status) => {
    this.connected = status;
  };

  setFolded = (status) => {
    this.folded = status;
    if (status) this.cards = [];
  };

  giveChipsToDealer = () => {
    this.currentBet = 0;
  };

  checkPrize = (dealerCards) => {
    if (!dealerCards) return;
    const myHand = PokerCore.betterHand(dealerCards, this.cards);
    return myHand;
  };

  setBet(chipsToBet) {
    let betSet = false;
    if (Number(chipsToBet) > Number(this.chips)) {
    } else {
      this.chips -= chipsToBet;
      this.currentBet += chipsToBet;
      betSet = true;
    }
    return betSet;
  }

  setTotalBet(totalAmount) {
    const diff = totalAmount - this.currentBet;
    if (diff < 0) return false;
    if (diff > this.chips) return false;

    this.chips -= diff;
    this.currentBet = totalAmount;
    return true;
  }
}

module.exports = Player;
