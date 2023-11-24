class Player {
  constructor(gameId, name, chips, cards, id) {
    this.gameId = gameId;
    this.id = id;
    this.viewCards = false
    this.name = name;
    this.chips = chips;
    this.cards = cards;
  }
  //playerNumber = 0;
  thisGameBet = 0;

  setCard(card) {
    this.cards.push(card);
  }

   countCards() {
    return this.cards.length;
  }

  viewCards() {
    return this.viewCards = true;
  }

  getPlayer(playersArray, playerId) {
    return playersArray.find((player) => player.id === playerId);
  }

  getPlayerId = () => {
    return this.id;
  };

  getChips = () => {
    return this.chips;
  };

  getThisGameBet = () => {
    return this.thisGameBet;
  };

  setBet(chipsToBet) {
    let betSet = false;
    if (chipsToBet > this.chips) {
      return "no enough chips";
    } else {
      this.chips -= chipsToBet;
      this.thisGameBet += chipsToBet;
      betSet = true;
    }
    return betSet;
  }

  showCards() {
    console.log("player - showCards");
    console.log("player cards", this.cards);
  }
}

module.exports = Player;
