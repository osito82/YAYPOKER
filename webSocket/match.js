const Player = require("./player");
const Dealer = require("./dealer");
const Deck = require("./deck");
const StepChecker = require("./stepChecker");
const Socket = require("./sockets");
const Communicator = require("./communicator");

const { msgBuilder } = require("./utils");

const osolog = require("osolog");
const R = require("radash");
const WinnerCore = require("./winnerCore");

class Match {
  log = new osolog();

  constructor(torneoId, gameId) {
    this.torneoId = torneoId;
    this.gameId = gameId;

    this.players = [];
    this.pauseTimeouts = new Map(); // Para gestionar reconexiones

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
    console.log(`MATCH - signUp: ${data.name} [${thisSocketId}]`);

    ///Avoid Folders to play when startGame = true
    if (
      this.stepChecker.checkStep("startGame") &&
      this.playersFold.includes(data.name)
    ) {
      console.log("Todo, Folders cannot get in during match in progresss");
      return;
    }

    // Buscar si ya existe un jugador con ese nombre (reconexión)
    const existingPlayerIndex = this.players.findIndex(
      (s) => s.name === data.name
    );

    if (existingPlayerIndex !== -1) {
      // CANCELAR EXPULSIÓN: Si había un timeout de pausa para este jugador, lo quitamos
      if (this.pauseTimeouts.has(data.name)) {
        clearTimeout(this.pauseTimeouts.get(data.name));
        this.pauseTimeouts.delete(data.name);
        console.log(`MATCH - Timeout de expulsión cancelado para ${data.name}`);
      }

      // Re-vincular el jugador existente con el nuevo socket ID
      this.players[existingPlayerIndex].id = thisSocketId;
      this.players[existingPlayerIndex].setLastAction("Reconnected");
      this.players[existingPlayerIndex].setConnected(true);
      
      console.log(`Usuario ${data.name} se ha reconectado con ID: ${thisSocketId}`);

      if (this.stepChecker.checkStep("pause")) {
        this.stepChecker.revokeStep("pause");
        this.communicator.msgBuilder("startGame", "public", null, {
          displayMsg: `${data.name} is Back!`,
        });
        this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
      }
      
      // Confirmar ID al jugador
      this.communicator.msgBuilder("signUp", "private", this.players[existingPlayerIndex], {
        method: "signUp",
        msg: "Welcome back!",
        id: thisSocketId,
      });
      this.dealer.talkToPLayerById(thisSocketId, this.communicator.getMsg());

    } else {
      // Nuevo jugador
      if (this.players.length >= 10) {
        console.log("Max Ten Players");
        return;
      }

      const player = new Player(
        this.gameId,
        data.name,
        data.secretCode,
        data.totalChips,
        [],
        thisSocketId
      );

      this.players.push(player);
      console.log(`Nuevo usuario ${data.name} agregado. Total: ${this.players.length}`);

      this.communicator.msgBuilder("signUp", "public", player, {
        method: "signUp",
        msg: `Welcome ${player.name} to the table!`,
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

    this.continue(thisSocket);
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
        foundPlayer.setLastAction(type === "setBet" ? "Bet" : "Raise");
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
        foundPlayer.setLastAction("Call");
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

  setCheck = (thisSocket) => {
    console.log("MATCH - setCheck");
    this.dealer.setChecked(thisSocket.id);
    const foundPlayer = this.players.find(
      (myPlayer) => myPlayer.id == thisSocket.id
    );

    if (foundPlayer) {
      foundPlayer.setLastAction("Check");
      this.communicator.msgBuilder("setCheck", "public", foundPlayer, {
        method: "setCheck",
        msg: "Check!",
        name: foundPlayer.name,
        id: foundPlayer.id,
        checkPlayers: this.dealer.getPlayersChecked(),
      });

      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
      this.log
        .Template({ name: "brakets", date: true, title: "setCheck" })
        .R(this.communicator.getFullInfo());
    }

    this.continue(thisSocket);
  };

  setRise(thisSocket, chipsToBet) {
    console.log("MATCH - setRise");
    this.setBet(thisSocket, chipsToBet, "setRise");
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
          msg: `Waiting for ${thisPlayer.name} to post Small Blind`,
          name: thisPlayer.name,
          id: thisPlayer.id,
        };

        // Public info
        this.communicator.msgBuilder(`askForBlindBets`, "public", thisPlayer, dataMsg);
        this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());

        // Private prompt
        this.communicator.msgBuilder(`askForBlindBets`, "private", thisPlayer, {
          ...dataMsg,
          msg: "Please make your Small Blind bet (10 chips)"
        });
        this.dealer.talkToPLayerById(thisPlayer.id, this.communicator.getMsg());
      }

      ///blinds Ask for bet P2
      if (this.dealer.hasPlayerBetByNumber(1) && !this.dealer.hasPlayerBetByNumber(2)) {
        let thisPlayer = this.dealer.getPlayerByNumber(2);
        const dataMsg = {
          method: `askForBlindBets`,
          msg: `Waiting for ${thisPlayer.name} to post Big Blind`,
          name: thisPlayer.name,
          id: thisPlayer.id,
        };

        // Public info
        this.communicator.msgBuilder(`askForBlindBets`, "public", thisPlayer, dataMsg);
        this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());

        // Private prompt
        this.communicator.msgBuilder(`askForBlindBets`, "private", thisPlayer, {
          ...dataMsg,
          msg: "Please make your Big Blind bet (20 chips)"
        });
        this.dealer.talkToPLayerById(thisPlayer.id, this.communicator.getMsg());
      }
    }
  }

  askForBets = (thisSocket, bettingFor) => {
    console.log("MATCH - askForBets-" + bettingFor);

    this.players.forEach((player) => {
      // SOLO si está conectado y no ha foldeado
      if (player.connected && !player.folded && !this.dealer.hasPlayerBet(player)) {
        const currentBets = this.players.map((p) => p.getCurrentBet());
        const allBetsAreZero = currentBets.every((bet) => bet === 0);
        const bettingOptions = allBetsAreZero ? ["bet", "fold", "check"] : ["call", "rise", "fold"];

        const dataMsg = {
          method: `askForBets - ${bettingFor}`,
          msg: "Please make your bet",
          action: bettingOptions,
        };

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

    if (foundPlayer && !foundPlayer.folded) {
      this.playersFold.push(foundPlayer.name);
      foundPlayer.setLastAction("Fold");
      foundPlayer.setFolded(true);

      this.communicator.msgBuilder("fold", "personal", foundPlayer, {});
      this.dealer.talkToPLayerById(thisSocketId, this.communicator.getMsg());

      this.communicator.msgBuilder("fold", "public", foundPlayer , {});
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
      
      this.log
        .Template({ name: "brakets", date: true, title: "fold" })
        .R(this.communicator.getFullInfo());
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
    console.log(`MATCH - pause: ${thisSocket.name}`);
    const player = this.players.find(p => p.name === thisSocket.name);
    if (player) {
      player.setConnected(false);
    }

    this.communicator.msgBuilder("startGame", "public", null, {
      displayMsg: `The user ${thisSocket.name} got disconnected`,
    });
    this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());

    this.stepChecker.grantStep("pause");

    // Guardar el timeout para poder cancelarlo si vuelve
    const timeout = setTimeout(() => {
      this.stepChecker.revokeStep("pause");
      this.playerLeave(thisSocket);

      this.communicator.msgBuilder("startGame", "public", null, {
        displayMsg: `Player ${thisSocket.name} did not come back, let's continue`,
      });
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
    }, 15000);

    this.pauseTimeouts.set(thisSocket.name, timeout);
    this.continue(thisSocket);
  }

  continue(thisSocket) {
    console.log("MATCH - continue");
    this.startGame(thisSocket);
  }

  showDown = (finalHands, thisSocket) => {
    this.communicator.msgBuilder(
      `showDown`,
      "public",
      { player: "all" },
      { method: "showDown", showDown: finalHands }
    );
    this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
    this.log
      .Template({
        name: "brakets",
        date: true,
        title: `showDown`,
      })
      .R(this.communicator.getFullInfo());

    this.stepChecker.grantStep("showDown");
    this.continue(thisSocket);
  };

  winner = (finalHands, thisSocket) => {
    const winner = WinnerCore.Winner(finalHands);

    this.communicator.msgBuilder(
      `winner`,
      "public",
      { player: "all" },
      { method: "winner", winner: winner }
    );
    this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
    this.log
      .Template({
        name: "brakets",
        date: true,
        title: `winner`,
      })
      .R(this.communicator.getFullInfo());

    this.stepChecker.grantStep("winner");
    this.continue(thisSocket);
  };

  bettingCore = (thisSocket, bettingFor) => {
    console.log(`MATCH - bettingCore-${bettingFor} | Pot: ${this.dealer.getPot()}`);
    
    // FILTRAR: Solo jugadores conectados y que no hayan foldeado
    const activePlayers = this.players.filter(p => p.connected && !p.folded);

    const maxBet = Math.max(
      ...activePlayers.map((player) => player.getCurrentBet())
    );
    const currentBets = activePlayers.map((player) => player.getCurrentBet());
    const allBetsEqual = currentBets.every((bet) => bet === currentBets[0]);
    const allBetsAreZero = currentBets.every((bet) => bet === 0);

    const bettingOptions = allBetsAreZero
      ? ["bet", "fold", "check"]
      : ["call", "rise", "fold"];

    // Determinar quién falta por actuar (de los activos)
    const playersToAct = activePlayers.filter(player => {
      const currentBet = player.getCurrentBet();
      const hasChecked = this.dealer.getPlayersChecked().includes(player.id);
      return (currentBet < maxBet) || (maxBet === 0 && !hasChecked);
    });

    console.log(`MATCH - Active Players: ${activePlayers.length}, To act: ${playersToAct.length}`);

    if (playersToAct.length === 0 && (allBetsEqual || this.dealer.allPlayersCheck())) {
      console.log(`MATCH - bettingCore-${bettingFor} COMPLETED`);
      this.dealer.removeChecks();

      if (bettingFor === "firstBetting") {
        this.stepChecker.grantStep("firstBetting");
        this.continue(thisSocket);
      }
      if (bettingFor === "flopBetting") {
        this.stepChecker.grantStep("flop_Bet_Step");
        this.continue(thisSocket);
      }
      if (bettingFor === "turnBetting") {
        this.stepChecker.grantStep("turn_Bet_Step");
        this.continue(thisSocket);
      }
      if (bettingFor === "riverBetting") {
        this.stepChecker.grantStep("river_Bet_Step");
        this.continue(thisSocket);
      }
    } else {
      // Aún faltan jugadores por actuar
      playersToAct.forEach((player) => {
        this.communicator.msgBuilder(
          `bettingCore-${bettingFor}`,
          "private",
          player,
          {
            messageForName: player.getPlayerName(),
            messageForId: player.getPlayerId(),
            action: bettingOptions,
            currentBet: player.getCurrentBet(),
            maxBet: maxBet,
          }
        );

        this.dealer.talkToPLayerById(
          player.getPlayerId(),
          this.communicator.getMsg()
        );

        this.communicator.msgBuilder(
          `bettingCore-${bettingFor}`,
          "public",
          player,
          {
            messageForName: player.getPlayerName(),
            messageForId: player.getPlayerId(),
            action: bettingOptions,
          }
        );

        this.dealer.talkToPlayerBUTid(
          player.getPlayerId(),
          this.communicator.getMsg()
        );
      });

      this.log
        .Template({ name: "brakets", date: true, title: "bettingCore" })
        .R(this.communicator.getFullInfo());
    }
  };

  dealerHand = (thisSocket, whatHand) => {
    console.log(`MATCH - dealerHand-${whatHand}`);
    let numberOfCards;

    switch (whatHand) {
      case "flop":
        numberOfCards = 3;
        break;
      case "turn":
      case "river":
        numberOfCards = 1;
        break;
    }

    this.dealer.dealCardsDealer(numberOfCards);

    switch (whatHand) {
      case "flop":
        this.stepChecker.grantStep("flop_Dealer_Hand");
        break;
      case "turn":
        this.stepChecker.grantStep("turn_Dealer_Hand");
        break;
      case "river":
        this.stepChecker.grantStep("river_Dealer_Hand");
        break;
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
  };

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

    if (dealerCards.length == 3)
      this.stepChecker.grantStep("flop_Check_Prize_Step");
    if (dealerCards.length == 4)
      this.stepChecker.grantStep("turn_Check_Prize_Step");
    if (dealerCards.length == 5)
      this.stepChecker.grantStep("river_Check_Prize_Step");

    this.continue(thisSocket);
  }

  startGame(thisSocket = {}) {
    console.log("MATCH - startGame - Current Step Checker State:", JSON.stringify(this.stepChecker.getChecker()));

    const { id: thisSocketId } = thisSocket;

    ///Avoid Folded Players to ReEnter
    const foundPlayerFold = this.playersFold.find(
      (foldPlayerNames) => foldPlayerNames == thisSocket.name
    );

    if (foundPlayerFold) {
      this.communicator.msgBuilder(
        "startGame",
        "personal",
        { name: foundPlayerFold },
        {
          date: "No Re-enter after fold",
        }
      );
      this.dealer.talkToSocketById(thisSocketId, this.communicator.getMsg());
      return;
    }

    ///Pause
    if (this.stepChecker.checkStep("pause")) {
      this.communicator.msgBuilder("startGame", "public", null, {
        displayMsg: "We are on pause",
      });

      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
      return;
    }

    ///Check Minimun Players
    if (!this.dealer.hasMinimunPlayers()) {
      this.communicator.msgBuilder("startGame", "public", null, {
        displayMsg: "Minimun 2 Players to Start",
      });

      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
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

    ///flop_Dealer_Hand
    if (!this.stepChecker.checkStep("flop_Dealer_Hand")) {
      this.dealer.getChipsFromPlayers();
      this.dealerHand(thisSocket, "flop");
      return;
    }

    ///flop_Check_Prize_Step
    if (!this.stepChecker.checkStep("flop_Check_Prize_Step")) {
      this.checkPrizes(thisSocket);
      return;
    }

    ///flop_Bet_Step
    if (!this.stepChecker.checkStep("flop_Bet_Step")) {
      this.askForBets(thisSocket, "flopBetting");
      this.bettingCore(thisSocket, "flopBetting");
      return;
    }

    ///turn_Dealer_Hand
    if (!this.stepChecker.checkStep("turn_Dealer_Hand")) {
      this.dealer.getChipsFromPlayers();
      this.dealerHand(thisSocket, "turn");
      return;
    }

    ///turn_Check_Prize_Step
    if (!this.stepChecker.checkStep("turn_Check_Prize_Step")) {
      this.checkPrizes(thisSocket);
      return;
    }

    ///turn_Bet_Step
    if (!this.stepChecker.checkStep("turn_Bet_Step")) {
      this.askForBets(thisSocket, "turnBetting");
      this.bettingCore(thisSocket, "turnBetting");
      return;
    }

    //river_Dealer_Hand
    if (!this.stepChecker.checkStep("river_Dealer_Hand")) {
      this.dealer.getChipsFromPlayers();
      this.dealerHand(thisSocket, "river");
      return;
    }

    ///river_Check_Prize_Step
    if (!this.stepChecker.checkStep("river_Check_Prize_Step")) {
      this.checkPrizes(thisSocket);
      return;
    }

    ///river_Bet_Step
    if (!this.stepChecker.checkStep("river_Bet_Step")) {
      this.askForBets(thisSocket, "riverBetting");
      this.bettingCore(thisSocket, "riverBetting");
      return;
    }

    ///finalHands
    if (!this.stepChecker.checkStep("finalHands")) {
      this.dealer.getChipsFromPlayers();
      this.dealer.setFinalHands();

      this.stepChecker.grantStep("finalHands");
      this.continue(thisSocket);

      return;
    }

    ///showDown
    if (!this.stepChecker.checkStep("showDown")) {
      const finalHands = this.dealer.getFinalHands();
      this.showDown(finalHands, thisSocket);
      return;
    }

    ///winner
    if (!this.stepChecker.checkStep("winner")) {
      const finalHands = this.dealer.getFinalHands();
      this.winner(finalHands, thisSocket);
      //osito
      //chips transfer
      return;
      //
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
