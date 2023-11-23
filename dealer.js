const Socket = require("./sockets");

class Dealer {
  constructor(gameId, players, deck, torneoId) {
    this.gameId = gameId;
    this.torneoId = torneoId;
    this.deck = deck;

    this.players = players;
  }

  cards = [];



  dealCardsEachPlayer(numberOfCards = 1) {
    for (let i = 0; i < numberOfCards; i++) {
      this.players.forEach((player) => {
        if (player.countCards() == 2) return;

        const cardToDeal = this.deck.shift();
        if (cardToDeal) {
          player.setCard(cardToDeal);
        } else {
          console.log("No hay cartas suficientes en el mazo.");
        }
      });
    }
  }

  dealCardsDealer(numberOfCards = 1) {
    for (let i = 0; i < numberOfCards; i++) {
      const cardToDeal = this.deck.shift();
      if (cardToDeal) {
        this.setCard(cardToDeal);
      } else {
        console.log("No hay cartas suficientes en el mazo.");
      }
    }
  }

  setCard(card) {
    this.cards.push(card);
  }

  dealCards() {
    console.log("dealer - dealCards");

    const burnedCard = this.deck.shift();
    this.deck.push(burnedCard);

    this.dealCardsEachPlayer(2);
  }

  hasMinimunPlayers() {
    return this.players.length >= 2;
  }

  getPlayerByNumber(number) {
    const idx = Number(number) - 1;
    const foundPlayer = this.players[idx];

    if (foundPlayer) {
      return foundPlayer;
    } else {
      console.log("Jugador no encontrado");
      return null;
    }
  }

  getPlayerById(number) {
    const foundPlayer = this.players.find((myPlayer) => myPlayer.id === number);
    return foundPlayer;
  }

  hasPlayerBet(playerNUmber) {
    const playerToCheck = this.getPlayerByNumber(playerNUmber);
    if (playerToCheck) {
      return playerToCheck.getThisGameBet() !== 0;
    } else {
      return 0;
    }
  }

  talkToPLayerById(idNumber, targetMessage) {
    try {
      console.log("MATCH - talkToPLayerById " + idNumber);
      const targetSocket = Socket.getSocket(this.torneoId, idNumber);
      targetSocket.socket.send(JSON.stringify({ message: targetMessage }));
    } catch (error) {
      console.log(error);
    }
  }

  talkToPLayer(playerNumber, targetMessage) {
    try {
      const foundPlayer = this.getPlayerByNumber(playerNumber);

      if (foundPlayer) {
        console.log("MATCH - talkToPLayer " + playerNumber);
        const playerId = foundPlayer.id;
        const targetSocket = Socket.getSocket(this.torneoId, playerId);
        if (targetSocket) {
          targetSocket.socket.send(JSON.stringify({ message: targetMessage }));
        } else {
          console.log("There is not socket for player" + playerId);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  talkToAllPlayers(targetMessage) {
    console.log("MATCH - talkToAllPlayers ");
    try {
      for (const player of this.players) {
        const playerId = player.id;

        const targetSocket = Socket.getSocket(this.torneoId, playerId);
        targetSocket.socket.send(JSON.stringify({ message: targetMessage }));
      }
    } catch (error) {
      console.log(error);
    }
  }

  showCards() {
    return this.cards;
  }
}

module.exports = Dealer;
