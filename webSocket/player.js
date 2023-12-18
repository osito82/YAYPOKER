const PokerCore = require("./pokerCore");

class Player {
  constructor(gameId, name, secretCode, chips, cards, id) {
    this.name = name;
    this.id = id;
    this.gameId = gameId;
    this.secretCode = secretCode
    this.chips = chips;
    this.cards = cards;
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
}

module.exports = Player;
