const Socket = require("./sockets");
const osolog = require("osolog");

class Dealer {
  log = new osolog();

  constructor(gameId, players, deck, torneoId, pot, cardsDealer) {
    this.gameId = gameId;
    this.torneoId = torneoId;
    this.deck = deck;
    this.players = players;
    this.pot = pot || 0;
    this.cardsDealer = cardsDealer || [];
    this.playersChecked = [];
    this.finalHands = [];
  }

  setFinalHands = () => {
    let currentPrize = {};
    this.log.Template({ name: "brakets", title: "DEALER - Final Hands", date: true }).R({ gameId: this.gameId });
    this.finalHands = []; 
    this.players.forEach((player) => {
      currentPrize = player.getCurrentPrize() || {};
      currentPrize.name = player.name;
      currentPrize.playerId = player.id;
      currentPrize.gameId = player.gameId;
      currentPrize.chips = player.chips; // Importante: incluir chips actualizados

      this.finalHands.push({
        ...currentPrize,
      });
    });
  };

  getFinalHands = () => {
    return this.finalHands;
  };

  allPlayersCheck = () => {
    const activePlayers = this.players.filter(p => p.connected && !p.folded);
    const maxBet = Math.max(...activePlayers.map(p => p.getCurrentBet()));
    return activePlayers.every(p => 
      p.getCurrentBet() === maxBet && this.playersChecked.includes(p.id)
    );
  };

  getPlayersChecked = () => {
    return this.playersChecked;
  };

  removeChecks = () => {
    this.playersChecked = [];
  };

  setChecked = (thisSocketId) => {
    if (!this.playersChecked.includes(thisSocketId)) {
      this.playersChecked.push(thisSocketId);
    }
  };

  setPot(chipsToBet) {
    this.pot = Number(this.pot) + Number(chipsToBet);
  }

  getPot() {
    return this.pot;
  }

  getChipsFromPlayers = () => {
    this.log.Template({ name: "brakets", title: "DEALER - Collecting Chips", date: true }).R({ currentPot: this.pot });
    this.players.forEach((player) => player.giveChipsToDealer());
  };

  dealCardsEachPlayer = (numberOfCards = 1) => {
    this.log.Template({ name: "brakets", title: "DEALER - Dealing Players", date: true }).R({ count: numberOfCards, deckLeft: this.deck.length });
    for (let i = 0; i < numberOfCards; i++) {
      this.players.forEach((player) => {
        if (player.connected && !player.folded) {
          if (player.countCards() < 2) {
            const cardToDeal = this.deck.shift();
            if (cardToDeal) {
              player.setCard(cardToDeal);
            }
          }
        }
      });
    }
  };

  dealCardsDealer(numberOfCards = 1) {
    this.log.Template({ name: "brakets", title: "DEALER - Dealing Table", date: true }).R({ count: numberOfCards, deckLeft: this.deck.length });
    for (let i = 0; i < numberOfCards; i++) {
      const cardToDeal = this.deck.shift();
      if (cardToDeal) {
        this.setCard(cardToDeal);
      }
    }
  }

  getDealerCards() {
    return this.cardsDealer;
  }

  setCard(card) {
    this.cardsDealer.push(card);
  }

  hasMinimumPlayers() {
    const connectedPlayers = this.players.filter(p => p.connected);
    return connectedPlayers.length >= 2;
  }

  getPlayerByNumber(number) {
    const idx = Number(number) - 1;
    const foundPlayer = this.players[idx];

    if (foundPlayer) {
      return foundPlayer;
    } else {
      return null;
    }
  }

  getPlayerById(id) {
    const foundPlayer = this.players.find((myPlayer) => myPlayer.id === id);
    if (foundPlayer) {
      return foundPlayer;
    } else {
      return null;
    }
  }

  hasPlayerBetByNumber = (playerNumber) => {
    const playerToCheck = this.getPlayerByNumber(playerNumber);
    if (playerToCheck) {
      return playerToCheck.getCurrentBet() !== 0;
    }
    return false;
  };

  hasPlayerBet(player) {
    if (player) {
      return player.getCurrentBet() !== 0;
    } else {
      return false;
    }
  }

  hasAllPlayersBet = () => {
    const activePlayers = this.players.filter(p => p.connected && !p.folded);
    return activePlayers.every((player) => {
      return Number(player.getCurrentBet()) !== 0;
    });
  };

  talkToSocketById(socketId, targetMessage) {
    try {
      const allSockets = Socket.getSocketsByTorneo(this.torneoId);
      if (allSockets) {
        const targetSocket = allSockets.find((s) => s.id === socketId);
        if (targetSocket && targetSocket.socket) {
          targetSocket.socket.send(JSON.stringify({ message: targetMessage }));
        }
      }
    } catch (error) {
      console.log("Error in talkToSocketById:", error);
    }
  }

  talkToPLayerById(idNumber, targetMessage) {
    try {
      const foundPlayer = this.getPlayerById(idNumber);

      if (foundPlayer) {
        const targetSocket = Socket.getSocket(this.torneoId, idNumber);
        if (targetSocket && targetSocket.socket) {
          targetSocket.socket.send(JSON.stringify({ message: targetMessage }));
        }
      }
    } catch (error) {
      console.log("Error in talkToPLayerById:", error);
    }
  }

  talkToPlayerBUTid(idToOmitNumber, targetMessage) {
    try {
      this.players.forEach((player) => {
        const { id } = player;

        if (id && id !== idToOmitNumber) {
          this.talkToPLayerById(id, targetMessage);
        }
      });
    } catch (error) {
      console.log("Error in talkToPlayerBUTid:", error);
    }
  }

  talkToAllPlayersOnTable(targetMessage) {
    try {
      this.players.forEach((player) => {
        const { id } = player;
        this.talkToPLayerById(id, targetMessage);
      });
    } catch (error) {
      console.log("Error in talkToAllPlayersOnTable:", error);
    }
  }

  talkToAllSockets(targetMessage) {
    try {
      const allSockets = Socket.getSocketsByTorneo(this.torneoId);
      if (allSockets) {
        allSockets.forEach((thisSocket) => {
          thisSocket.socket.send(JSON.stringify({ message: targetMessage }));
        });
      }
    } catch (error) {
      console.log("Error in talkToAllSockets:", error);
    }
  }
}

module.exports = Dealer;
