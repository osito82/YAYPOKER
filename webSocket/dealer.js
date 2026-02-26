const Socket = require("./sockets");

class Dealer {
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
    console.log("DEALER - setFinalHands");
    this.finalHands = []; // Clear previous hands
    this.players.forEach((player) => {
      currentPrize = player.getCurrentPrize();
      currentPrize.name = player.name;
      currentPrize.playerId = player.id;
      currentPrize.gameId = player.gameId;

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
    
    // Una ronda termina si:
    // 1. Todos los jugadores activos han igualado la apuesta máxima.
    // 2. Todos los jugadores activos han tenido la oportunidad de actuar (están en playersChecked).
    return activePlayers.every(p => 
      p.getCurrentBet() === maxBet && this.playersChecked.includes(p.id)
    );
  };

  getPlayersChecked = () => {
    return this.playersChecked;
  };

  removeChecks = () => {
    console.log("DEALER - removeChecks");
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
    console.log("DEALER - getChipsFromPlayers");
    this.players.forEach((player) => player.giveChipsToDealer());
  };

  dealCardsEachPlayer = (numberOfCards = 1) => {
    console.log(`DEALER - Dealing ${numberOfCards} cards to each player. Deck size: ${this.deck.length}`);
    for (let i = 0; i < numberOfCards; i++) {
      this.players.forEach((player) => {
        if (player.connected && !player.folded) {
          if (player.countCards() < 2) {
            const cardToDeal = this.deck.shift();
            if (cardToDeal) {
              console.log(`DEALER - Dealing ${cardToDeal} to ${player.name}`);
              player.setCard(cardToDeal);
            } else {
              console.log("DEALER - ERROR: Deck is empty!");
            }
          }
        }
      });
    }
  };

  dealCardsDealer(numberOfCards = 1) {
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
