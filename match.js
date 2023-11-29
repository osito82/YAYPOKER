const Player = require("./player");
const Dealer = require("./dealer");
const Deck = require("./deck");
const StepChecker = require("./stepChecker");
const Socket = require("./sockets");
const Communicator = require("./communicator");

const { msgBuilder } = require("./utils");

const osolog = require("osolog");
const R = require("radash");

class Match {
  log = new osolog();

  constructor(torneoId, gameId) {
    this.torneoId = torneoId;
    this.gameId = gameId;

    this.players = [];
    this.playersFold = [];
    this.pot = 0;
    this.cardsDealer = [];

    this.dealer = new Dealer(
      this.gameId,
      this.players,
      (this.shuffledDeck = Deck.shuffleDeck(Deck.cards, 101)),
      torneoId,
      this.pot,
      this.cardsDealer
    );

    this.stepChecker = new StepChecker(this.gameId);

    this.communicator = new Communicator(
      this.gameId,
      this.torneoId,
      this.playersFold,
      this.stepChecker,
      this.players,
      this.dealer
    );
  }

  signUp(data, thisSocket) {
    const { id: thisSocketId } = thisSocket;
    console.log("MATCH - signUp");

    ///Avoid Folders to play when startGame = true
    if (
      this.stepChecker.checkStep("startGame") &&
      this.playersFold.includes(data.name)
    ) {
      console.log("Todo, Folders cannot get in during match in progresss");
      return;
    }

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
        this.continue(thisSocket);
      }
    } else {
      this.players.push(player);
      console.log(`Nuevo usuario ${data.name} ha sido agregado.`);

      this.communicator.msgBuilder("signUp", "public", player, {
        method: "signUp",
        msg: "New PLayer",
        name: player.name,
        id: player.id,
      });

      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());

      this.log
        .Template({ name: "brakets", date: true, title: "signUp" })
        .R(this.communicator.getFullInfo());
    }

    if (this.players.length >= 2) {
      this.stepChecker.grantStep("signUp");
    } else {
      this.stepChecker.revokeStep("signUp");
    }

    return;
  }

  dealtPrivateCards(thisSocket) {
    console.log("MATCH - dealtPrivateCards");
    try {
      this.dealer.dealCardsEachPlayer(2);
      this.stepChecker.grantStep("dealtPrivateCards");

      ///Sends a customized msg
      for (const player of this.players) {
        this.communicator.msgBuilder(
          "dealtPrivateCards",
          "private",
          player,
          {}
        );

        this.dealer.talkToPLayerById(player.id, this.communicator.getMsg());
      }

      this.log
        .Template({ name: "brakets", date: true, title: "dealtPrivateCards" })
        .R(this.communicator.getFullInfo());

      this.continue(thisSocket);
    } catch (error) {
      console.error("Error in dealtPrivateCards:", error);
    }
  }

  setBet(thisSocket, chipsToBet, type = "setBet") {
    const { id: thisSocketId } = thisSocket;
    console.log("MATCH - " + type);

    if (R.isEmpty(this.players)) {
      return;
    }

    const foundPlayer = this.players.find(
      (myPlayer) => myPlayer.id == thisSocketId
    );
    if (foundPlayer) {
      const aprovedBet = foundPlayer.setBet(chipsToBet);

      if (aprovedBet) {
        this.dealer.setPot(chipsToBet);

        this.communicator.msgBuilder("setBet", "public", foundPlayer, {
          method: "setBet",
          msg: "A bet has been set",
          name: foundPlayer.name,
          id: foundPlayer.id,
          bet: foundPlayer.getCurrentBet(),
        });
        this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
        this.log
          .Template({ name: "brakets", date: true, title: "setBet" })
          .R(this.communicator.getFullInfo());
      } else {
        console.log("todo - setBet  was not possible");
      }
    }
    this.continue(thisSocket);
  }

  setCall(thisSocket) {
    console.log("MATCH - setCall");

    const maxBet = Math.max(
      ...this.players.map((player) => player.getCurrentBet())
    );

    const foundPlayer = this.players.find(
      (myPlayer) => myPlayer.id == thisSocket.id
    );

    if (!foundPlayer) {
      return;
    }

    const currentBet = foundPlayer.getCurrentBet();

    if (currentBet < maxBet) {
      const diff = maxBet - currentBet;
      const aprovedBet = foundPlayer.setBet(diff);

      if (aprovedBet) {
        this.dealer.setPot(diff);

        this.communicator.msgBuilder("setCall", "public", foundPlayer, {});
        this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
        this.log
          .Template({ name: "brakets", date: true, title: "setCall" })
          .R(this.communicator.getFullInfo());
      } else {
        console.log("todo - rise was not possible");
        return;
      }
    }

    this.continue(thisSocket);
  }

  setCheck(thisSocket) {
    console.log("MATCH - setCheck");

    const foundPlayer = this.players.find(
      (myPlayer) => myPlayer.id == thisSocket.id
    );

    if (foundPlayer) {
      this.communicator.msgBuilder("setCheck", "public", foundPlayer, {});
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
      this.log
        .Template({ name: "brakets", date: true, title: "setCheck" })
        .R(this.communicator.getFullInfo());
    }
    this.continue(thisSocket);
  }

  setRise(thisSocketId, chipsToBet) {
    console.log("MATCH - setRise");
    this.setBet(thisSocketId, chipsToBet, "setRise");
  }

  askForBlindBets(thisSocket) {
    console.log("MATCH - askForBlindBets");

    if (
      this.dealer.hasPlayerBetByNumber(1) &&
      this.dealer.hasPlayerBetByNumber(2)
    ) {
      this.stepChecker.grantStep("blindsBetting");
      this.continue(thisSocket);
    } else {
      ///blinds Ask for bet P1
      if (!this.dealer.hasPlayerBetByNumber(1)) {
        let thisPlayer = this.dealer.getPlayerByNumber(1);
        const dataMsg = {
          method: `askForBlindBets`,
          msg: "Please make your Small Blind bet",
          name: thisPlayer.name,
          id: thisPlayer.id,
        };

        this.communicator.msgBuilder(
          `askForBlindBets`,
          "private",
          thisPlayer,
          dataMsg
        );

        this.dealer.talkToPLayerById(thisPlayer.id, this.communicator.getMsg());
      }

      ///blinds Ask for bet P2
      if (!this.dealer.hasPlayerBetByNumber(2)) {
        let thisPlayer = this.dealer.getPlayerByNumber(2);
        const dataMsg = {
          method: `askForBlindBets`,
          msg: "Please make your Big Blind bet",
          name: thisPlayer.name,
          id: thisPlayer.id,
        };

        this.communicator.msgBuilder(
          `askForBlindBets`,
          "private",
          thisPlayer,
          dataMsg
        );

        this.dealer.talkToPLayerById(thisPlayer.id, this.communicator.getMsg());
      }
    }
  }

  askForBets = (thisSocket, bettingFor) => {
    console.log("MATCH - askForBets" + " " + bettingFor);

    const dataMsg = {
      method: `askForBets - ${bettingFor}`,
      msg: "Please make your bet",
    };

    if (this.dealer.hasAllPlayersBet() && bettingFor == "firstBetting") {
      return;
    }
    if (this.dealer.hasAllPlayersBet() && bettingFor == "flopBetting") {
      return;
    }
    if (this.dealer.hasAllPlayersBet() && bettingFor == "turnBetting") {
      return;
    }

    this.players.forEach((player) => {
      if (this.dealer.hasPlayerBet(player)) {
        this.communicator.msgBuilder(
          `askForBets - ${bettingFor}`,
          "public",
          player,
          dataMsg
        );

        this.dealer.talkToPLayerById(player.id, this.communicator.getMsg());
      }
    });
  };

  playerLeave(thisSocket) {
    const { id: thisSocketId } = thisSocket;
    console.log("MATCH - playerLeave");
    const index = this.players.findIndex(
      (player) => player.id === thisSocketId
    );
    if (index !== -1) {
      this.players.splice(index, 1);
    }
    this.continue(thisSocket);
  }

  fold(thisSocket) {
    const { id: thisSocketId } = thisSocket;
    console.log("MATCH - fold");
    const foundPlayer = this.players.find(
      (myPlayer) => myPlayer.id == thisSocketId
    );

    if (foundPlayer && foundPlayer.cards.length > 0) {
      this.playersFold.push(foundPlayer.name);

      const msg = msgBuilder("fold", "personal", foundPlayer, {});
      this.dealer.talkToPLayerById(thisSocketId, msg);

      this.communicator.msgBuilder("fold", "public", foundPlayer, {});
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
      this.log
        .Template({ name: "brakets", date: true, title: "fold" })
        .R(this.communicator.getFullInfo());

      const index = this.players.findIndex(
        (player) => player.id === thisSocketId
      );

      if (index !== -1) {
        this.players.splice(index, 1);
      }
    }

    this.continue(thisSocket);
  }

  close(thisSocket, torneoId) {
    console.log("MATCH - close");
    const { id: thisSocketId } = thisSocket;

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

  pause(thisSocket) {
    console.log("MATCH - pause");
    this.dealer.talkToAllPlayersOnTable(
      `The user ${thisSocket.name} - ${thisSocket.id} got disconnected`
    );
    this.stepChecker.grantStep("pause");

    setTimeout(() => {
      this.stepChecker.revokeStep("pause");
      this.playerLeave(thisSocket);
      this.dealer.talkToAllPlayersOnTable(
        `Player ${thisSocket.name} - ${thisSocket.id} didnt come back, lets continue`
      );
    }, 15000);
    this.continue(thisSocket);
  }

  continue(thisSocket) {
    console.log("MATCH - continue");
    this.startGame(thisSocket);
  }

  bettingCore(thisSocket, bettingFor) {
    console.log("MATCH - bettingCore" + " " + bettingFor);

    const maxBet = Math.max(
      ...this.players.map((player) => player.getCurrentBet())
    );
    const currentBets = this.players.map((player) => player.getCurrentBet());
    const allBetsEqual = currentBets.every((bet) => bet === currentBets[0]);

    if (allBetsEqual) {
      if (bettingFor === "firstBetting") {
        this.stepChecker.grantStep("firstBetting");
        this.continue(thisSocket);
      }
      if (bettingFor === "flopBetting") {
        this.stepChecker.grantStep("flopBetting");
        this.continue(thisSocket);
      }
      if (bettingFor === "turnBetting") {
        this.stepChecker.grantStep("turnBetting");
        this.continue(thisSocket);
      }
    } else {
      this.players.forEach((player) => {
        const currentBet = player.getCurrentBet();

        if (currentBet && currentBet != maxBet) {
          this.communicator.msgBuilder("bettingCore", "private", player, {
            messageForName: player.getPlayerName(),
            messageForId: player.getPlayerId(),
            action: ["call", "rise", "fold"],
            currentBet: currentBet,
            maxBet: maxBet,
          });

          this.dealer.talkToPLayerById(
            player.getPlayerId(),
            this.communicator.getMsg()
          );

          this.communicator.msgBuilder(
            `bettingCore ${bettingFor}`,
            "public",
            player,
            {
              messageForName: player.getPlayerName(),
              messageForId: player.getPlayerId(),
              action: ["call", "rise", "fold", "check"],
            }
          );

          this.dealer.talkToPlayerBUTid(
            player.getPlayerId(),
            this.communicator.getMsg()
          );

          this.log
            .Template({ name: "brakets", date: true, title: "bettingCore" })
            .R(this.communicator.getFullInfo());
        }
        return;
      });

      ///First Betting
      if (bettingFor === "firstBetting") {
        this.stepChecker.revokeStep("firstBetting");
      }
      ///Flop Betting
      if (bettingFor === "flopBetting") {
        this.stepChecker.revokeStep("flopBetting");
      }
      ///Turn Betting
      if (bettingFor === "turnBetting") {
        this.stepChecker.revokeStep("turnBetting");
      }
    }
  }

  dealerHand(thisSocket, whatHand) {
    console.log(`MATCH - dealerHand-${whatHand}`);
    let numberOfCards;

    switch (whatHand) {
      case "flop":
        numberOfCards = 3;
        break;
      case "turn":
      case "river":
        numberOfCards = 1;
    }

    this.dealer.dealCardsDealer(numberOfCards);

    switch (whatHand) {
      case "flop":
        this.stepChecker.grantStep("flop_dealerHand");
        break;
      case "turn":
        this.stepChecker.grantStep("turn_dealerHand");
      case "river":
        this.stepChecker.grantStep("river_dealerHand");
    }

    this.communicator.msgBuilder(
      `dealerHand-${whatHand}`,
      "public",
      { player: "dealer" },
      { method: "dealerHand" }
    );
    this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
    this.log
      .Template({
        name: "brakets",
        date: true,
        title: `dealerHand-${whatHand}`,
      })
      .R(this.communicator.getFullInfo());

    this.continue(thisSocket);
  }

  checkPrizes(thisSocket) {
    console.log("MATCH - checkPrizes");

    const dealerCards = this.dealer.getDealerCards();

    if (!dealerCards || dealerCards.length < 3) {
      return;
    }

    this.players.forEach((player) => {
      if (!player) return;
      const prize = player.checkPrize(dealerCards);
      player.setCurrentPrize(prize);

      this.communicator.msgBuilder("checkPrizes", "private", player, {
        method: "checkPrizes",
        msg: "Check your current max Prize",
        name: player.name,
        id: player.id,
      });

      this.dealer.talkToPLayerById(player.id, this.communicator.getMsg());
    });

    if (dealerCards.length == 3) this.stepChecker.grantStep("flopCheckCards");
    if (dealerCards.length == 4) this.stepChecker.grantStep("turnCheckCards");
    if (dealerCards.length == 5) this.stepChecker.grantStep("riverCheckCards");
    this.continue(thisSocket);
  }

  startGame(thisSocket = {}) {
    console.log("MATCH - startGame");

    const { id: thisSocketId } = thisSocket;

    ///Avoid Folded Players to ReEnter
    const foundPlayerFold = this.playersFold.find(
      (foldPlayerNames) => foldPlayerNames == thisSocket.name
    );

    if (foundPlayerFold) {
      const msg = msgBuilder(
        "startGame",
        "personal",
        { name: foundPlayerFold },
        {
          date: "No Re-enter after fold",
        }
      );
      this.dealer.talkToSocketById(thisSocketId, msg);
      return;
    }

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
    if (!this.stepChecker.checkStep("blindsBetting")) {
      this.askForBlindBets(thisSocket);
      return;
    }

    ///Deal Private Cards
    if (!this.stepChecker.checkStep("dealtPrivateCards")) {
      this.dealtPrivateCards(thisSocket);
      return;
    }

    ///firstBetting
    if (!this.stepChecker.checkStep("firstBetting")) {
      this.askForBets(thisSocket, "firstBetting");
      this.bettingCore(thisSocket, "firstBetting");
      return;
    }

    ///flop_dealerHand
    if (!this.stepChecker.checkStep("flop_dealerHand")) {
      this.dealer.getChipsFromPlayers();
      this.dealerHand(thisSocket, "flop");
      return;
    }

    ///checkPrizes - Flop
    if (!this.stepChecker.checkStep("flopCheckCards")) {
      this.checkPrizes(thisSocket);
      return;
    }

    ///flopBetting
    if (!this.stepChecker.checkStep("flopBetting")) {
      this.askForBets(thisSocket, "flopBetting");
      this.bettingCore(thisSocket, "flopBetting");
      return;
    }

    ///turn_dealerHand
    if (!this.stepChecker.checkStep("turn_dealerHand")) {
      this.dealer.getChipsFromPlayers();
      this.dealerHand(thisSocket, "turn");
      return;
    }

    ///checkPrizes - Turn
    if (!this.stepChecker.checkStep("turnCheckCards")) {
      this.checkPrizes(thisSocket);
      return;
    }

    ///turnBetting
    if (!this.stepChecker.checkStep("turnBetting")) {
      this.askForBets(thisSocket, "turnBetting");
      this.bettingCore(thisSocket, "turnBetting");
      return;
    }

    this.stepChecker.grantStep("startGame");
  }

  stats(socketId) {
    console.log(socketId);
    console.log("Players", JSON.stringify(this.players));
    console.log("Sockets", Socket.getSockets());
    console.log("pot", this.dealer.getPot());
    console.log("gameFlow", JSON.stringify(this.stepChecker.gameFlow));
  }
}

module.exports = Match;
