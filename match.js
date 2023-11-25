const Player = require("./player");
const Dealer = require("./dealer");
const Deck = require("./deck");
const StepChecker = require("./stepChecker");
const PokerCore = require("./pokerCore");

const R = require("radash");
const log = require("./log");
const Socket = require("./sockets");
//const { startGame } = require("./mock_sockets");

class Match {
  constructor(torneoId, gameId) {
    this.torneoId = torneoId;
    this.gameId = gameId;
    this.pot = 0;
    this.players = [];
    this.shuffledDeck = Deck.shuffleDeck(Deck.cards, 101);

    this.dealer = new Dealer(
      this.gameId,
      this.players,
      this.shuffledDeck,
      torneoId
    );
    this.stepChecker = new StepChecker(this.gameId);
  }

  signUp(data, thisSocketId) {
    console.log("MATCH - signUp");

    if (this.players.length >= 10) {
      console.log("Max Ten Players");
      return;
    }

    const player = new Player(
      this.gameId,
      data.name,
      data.totalChips,
      [],
      thisSocketId
    );

    const existingPlayerIndex = this.players.findIndex(
      (s) => s.name === data.name
    );

    if (existingPlayerIndex !== -1) {
      this.players[existingPlayerIndex].id = player.id;
      console.log(`Usuario ${data.name} se ha reconectado.`);

      if (this.stepChecker.checkStep("pause")) {
        this.dealer.talkToAllPlayersOnTable(`${data.name} ya volvio`);
        this.stepChecker.revokeStep("pause");
        this.continue();
      }
    } else {
      this.players.push(player);
      console.log(`Nuevo usuario ${data.name} ha sido agregado.`);
      this.dealer.talkToPLayerById(
        player.id,
        `Hi, ${player.name} welcome to the Poker Game`
      );
    }

    if (this.players.length >= 2) {
      this.stepChecker.grantStep("signUp");
    } else {
      this.stepChecker.revokeStep("signUp");
    }

    return;
  }

  dealtPrivateCards() {
    console.log("MATCH - dealtPrivateCards");
    this.dealer.dealCardsEachPlayer(2);
    this.stepChecker.grantStep("dealPrivateCards");
    log.add({ method: "dealtPrivateCards" });
  }

  setBet(thisSocketId, chipsToBet) {
    console.log("MATCH - setBet");
    if (R.isEmpty(this.players)) {
      return;
    }

    const foundPlayer = this.players.find(
      (myPlayer) => myPlayer.id == thisSocketId
    );

    foundPlayer.setBet(chipsToBet);

    this.pot = this.pot + chipsToBet;

    this.dealer.talkToAllPlayersOnTable(
      `${foundPlayer.name} - bet ${chipsToBet} - pot ${this.pot}`
    );

    log.add({
      setBet: {
        player: foundPlayer,
        pot: this.pot,
      },
    });
  }

  askForBets(bettingFor) {
    if (bettingFor == "blinds") {
      if (this.dealer.hasPlayerBet(1) && this.dealer.hasPlayerBet(2)) {
        this.stepChecker.grantStep("blinds");
      } else {
        ///blinds Ask for bet P1
        if (!this.dealer.hasPlayerBet(1)) {
          this.dealer.talkToPLayer(1, "P1 - Please make your blind bet");
        }

        ///blinds Ask for bet P2
        if (!this.dealer.hasPlayerBet(2)) {
          this.dealer.talkToPLayer(2, "P2 - Please make your blind bet");
        }
      }
    }
  }

  playerLeave(thisSocketId) {
    const index = this.players.findIndex(
      (player) => player.id === thisSocketId
    );
    if (index !== -1) {
      this.players.splice(index, 1);
    }
    this.continue();
  }

  fold(thisSocketId) {
    console.log("MATCH - fold");
    this.dealer.talkToPLayerById(thisSocketId, "bye amigo");

    const index = this.players.findIndex(
      (player) => player.id === thisSocketId
    );
    if (index !== -1) {
      this.players.splice(index, 1);
    }
    this.continue();
  }

  close(thisSocket, torneoId) {
    const { id: thisSocketId } = thisSocket;
    console.log("MATCH - close");

    ///Remove User from Users Array
    const index = this.players.findIndex(
      (player) => player.id === thisSocketId
    );

    if (index !== -1) {
      this.players.splice(index, 1);
    }

    /// Close socket after removing user information
    if (thisSocket) {
      Socket.removeSocket(thisSocket, torneoId);
      thisSocket.socket.close();
    }
  }

  vigilant() {
    // console.log("vigilant");
  }

  pause(socket) {
    this.dealer.talkToAllPlayersOnTable(
      `The user ${socket.name} - ${socket.id} got disconnected`
    );
    this.stepChecker.grantStep("pause");

    setTimeout(() => {
      this.stepChecker.revokeStep("pause");
      this.playerLeave(socket.id);
      this.dealer.talkToAllPlayersOnTable(
        `Player ${socket.name} - ${socket.id} didnt come back, lets continue`
      );
      //this.startGame();
    }, 15000);
    this.continue();
  }

  continue() {
    this.startGame();
  }

  gameOptions(bettingFor) {
    try {
      const maxBet = Math.max(
        ...this.players.map((player) => player.getCurrentBet())
      );
      const currentBets = this.players.map((player) => player.getCurrentBet());
      console.log(currentBets, "currentBets", "-------------------");
      const allBetsEqual = currentBets.every((bet) => bet === currentBets[0]);
      console.log(allBetsEqual, "allBetsEqual", "-------------------");

      if (!allBetsEqual) {
        // Si las apuestas no son iguales, notifica a los jugadores y revoca el paso si es necesario
        this.players.forEach((player) => {
          const currentBet = player.getCurrentBet();
          this.dealer.talkToPLayerById(
            player.id,
            `Hey, ${player.name}+ Current ${currentBet} + MaxBet ${maxBet} is not equal to the maximum bet. Do you want - CALL - RISE - FOLD - Press Command`
          );
        });

        if (bettingFor === "firstBetting") {
          this.stepChecker.revokeStep("firstBetting");
        }
      } else {
        // Si todas las apuestas son iguales, concedes el paso si es necesario
        if (bettingFor === "firstBetting") {
          this.stepChecker.grantStep("firstBetting");
        }
      }
    } catch (error) {
      console.log(error);
    }

    //this.dealer.talkToPLayerById(thisSocketId, "bye amigo");
    //this.continue();
  }

  gameOptionsOld(bettingFor) {
    try {
      const maxBet = Math.max(
        ...this.players.map((player) => player.getCurrentBet())
      );

      const currentBets = this.players.map((player) => player.getCurrentBet());
      const allBetsEqual = currentBets.every((bet) => bet === currentBets[0]);

      this.players.forEach((player) => {
        const currentBet = player.getCurrentBet();

        if (currentBet !== maxBet) {
          this.dealer.talkToPLayerById(
            player.id,
            `Hey, ${player.name} + MaxBet ${maxBet} + Current ${currentBet} Do you want - CALL - RISE - FOLD - Press Command`
          );
        }

        if (bettingFor == "firstBetting")
          if (allBetsEqual) {
            //       this.stepChecker.grantStep("firstBetting");
            this.stepChecker.grantStep("firstBetting");
          } else {
            this.stepChecker.revokeStep("firstBetting");

            //     return;
          }
      });
    } catch (error) {
      console.log(error);
    }
  }

  startGame() {
    console.log("MATCH - startGame");

    ///Pause
    if (this.stepChecker.checkStep("pause")) {
      this.dealer.talkToAllPlayersOnTable("We are on pause");
      return;
    }

    ///Check Minimun Players
    if (!this.dealer.hasMinimunPlayers()) {
      this.dealer.talkToAllPlayersOnTable("Minimun 2 Players to Start");
      return;
    }

    ///Blinds
    //const timerAskBlinds = () => {
    if (!this.stepChecker.checkStep("blinds")) {
      this.askForBets("blinds");
    } // else {
    // clearInterval(intervalId);
    // }
    //};
    //const intervalId = setInterval(timerAskBlinds, 10000);

    //desision makinb

    //if (this.stepChecker.isAllowedTo("dealPrivateCards")) {

    if (!this.stepChecker.checkStep("firstBetting")) {
      this.gameOptions("firstBetting");
    }

    if (!this.stepChecker.checkStep("dealPrivateCards")) {
      this.dealtPrivateCards();
    }

    //desition selector

    log.add({ dealerCards: this.dealer.showCards() });

    this.stepChecker.grantStep("startGame");
  }

  stats(socketId) {
    console.log(socketId);
    //const thisPlayer = this.dealer.getPlayerById(socketId);
    //console.log(thisPlayer)

    console.log("Players", JSON.stringify(this.players));
    console.log("Sockets", Socket.getSockets());
    console.log("pot", this.pot);
    console.log("gameFlow", JSON.stringify(this.stepChecker.gameFlow));
  }
}

module.exports = Match;
