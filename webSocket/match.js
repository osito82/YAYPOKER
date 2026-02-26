// match 2
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
    this.pauseTimeouts = new Map();

    this.playersFold = [];
    this.pot = 0;
    this.cardsDealer = [];

    const initialDeck = Deck.shuffleDeck(Deck.cards, 101);
    this.shuffledDeck = initialDeck;

    this.dealer = new Dealer(
      this.gameId,
      this.players,
      initialDeck,
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

    this.log.Template({ name: "brakets", title: "MATCH - New Game Created", date: true }).R({ torneoId, gameId });
  }

  signUp(data, thisSocket) {
  const { id: thisSocketId } = thisSocket;
  const existingPlayerIndex = this.players.findIndex((s) => s.name === data.name);

  let player;
  if (existingPlayerIndex !== -1) {
    player = this.players[existingPlayerIndex];
    player.id = thisSocketId;
    player.setConnected(true);
    this.stepChecker.revokeStep("pause");
    this.log.Template({ name: "brakets", title: "MATCH - Player Reconnected", date: true }).R({ name: player.name, id: player.id });
  } else {
    if (this.players.length >= 10) return;
    const playerNumber = this.players.length + 1;
    player = new Player(this.gameId, data.name, data.secretCode, data.totalChips, [], thisSocketId, playerNumber);
    player.setConnected(true); 
    this.players.push(player);
    this.log.Template({ name: "brakets", title: "MATCH - New Player Joined", date: true }).R({ name: player.name, chips: player.chips, num: playerNumber });
  }

  this.communicator.msgBuilder("signUp", "public", player, { msg: `Welcome ${player.name}!` });
  this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
  this.communicator.msgBuilder("signUp", "private", player, { method: "signUp", id: thisSocketId });
  this.dealer.talkToPLayerById(thisSocketId, this.communicator.getMsg());

  const connectedPlayers = this.players.filter(p => p.connected);
  if (connectedPlayers.length >= 2 && !this.stepChecker.checkStep("blindsBetting")) {
    this.log.Template({ name: "brakets", title: "MATCH - Enough Players To Start", date: true }).R({ count: connectedPlayers.length });
    this.stepChecker.grantStep("signUp");
    this.askForBlindBets(thisSocket); 
  }
}

  dealtPrivateCards(thisSocket) {
    try {
      this.dealer.dealCardsEachPlayer(2);
      this.stepChecker.grantStep("dealtPrivateCards");
      this.dealer.removeChecks(); 
      
      this.log.Template({ name: "brakets", title: "MATCH - Private Cards Dealt", date: true }).R(this.communicator.getFullInfo());

      for (const player of this.players) {
        this.communicator.msgBuilder("dealtPrivateCards", "private", player, {});
        this.dealer.talkToPLayerById(player.id, this.communicator.getMsg());
      }
      this.communicator.msgBuilder("dealtPrivateCards", "public", null, { displayMsg: "Cards dealt!" });
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
      this.continue(thisSocket);
    } catch (error) { console.error("Error in dealtPrivateCards:", error); }
  }

  setBet(thisSocket, chipsToBet, type = "setBet") {
    const foundPlayer = this.players.find(p => p.id == thisSocket.id);
    if (foundPlayer) {
      if (foundPlayer.setBet(chipsToBet)) {
        foundPlayer.setLastAction(type === "setBet" ? "Bet" : "Raise");
        this.dealer.setPot(chipsToBet);
        
        if (this.stepChecker.checkStep("blindsBetting")) {
           this.dealer.removeChecks();
        }

        this.dealer.setChecked(foundPlayer.id);
        
        this.log.Template({ name: "brakets", title: `MATCH - ${type.toUpperCase()}`, date: true }).R({
          player: foundPlayer.name,
          amount: chipsToBet,
          totalBet: foundPlayer.getCurrentBet(),
          newPot: this.dealer.getPot()
        });

        this.communicator.msgBuilder("setBet", "public", foundPlayer, {
          displayMsg: `${foundPlayer.name} bets ${chipsToBet}`,
          name: foundPlayer.name,
          bet: foundPlayer.getCurrentBet(),
        });
        this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
      }
    }
    this.continue(thisSocket);
  }

  setCall(thisSocket) {
    const activePlayers = this.players.filter(p => p.connected && !p.folded);
    const maxBet = Math.max(...activePlayers.map(p => p.getCurrentBet()));
    const foundPlayer = this.players.find(p => p.id == thisSocket.id);
    if (foundPlayer) {
      const diff = maxBet - foundPlayer.getCurrentBet();
      if (diff > 0) {
        if (foundPlayer.setBet(diff)) {
          foundPlayer.setLastAction("Call");
          this.dealer.setPot(diff);
          this.dealer.setChecked(foundPlayer.id);
          
          this.log.Template({ name: "brakets", title: "MATCH - CALL", date: true }).R({
            player: foundPlayer.name,
            amount: diff,
            newPot: this.dealer.getPot()
          });

          this.communicator.msgBuilder("setCall", "public", foundPlayer, { displayMsg: `${foundPlayer.name} calls` });
          this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
        }
      } else { 
        this.dealer.setChecked(foundPlayer.id); 
        this.log.Template({ name: "brakets", title: "MATCH - CALL (Zero diff)", date: true }).R({ player: foundPlayer.name });
      }
    }
    this.continue(thisSocket);
  }

  setCheck = (thisSocket) => {
    this.dealer.setChecked(thisSocket.id);
    const foundPlayer = this.players.find(p => p.id == thisSocket.id);
    if (foundPlayer) {
      foundPlayer.setLastAction("Check");
      this.log.Template({ name: "brakets", title: "MATCH - CHECK", date: true }).R({ player: foundPlayer.name });
      this.communicator.msgBuilder("setCheck", "public", foundPlayer, { displayMsg: `${foundPlayer.name} checks` });
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
    }
    this.continue(thisSocket);
  };

  setRise(thisSocket, chipsToBet) { this.setBet(thisSocket, chipsToBet, "setRise"); }

  askForBlindBets(thisSocket) {
    const p1 = this.players[0];
    const p2 = this.players[1];

    if (p1 && p2 && p1.getCurrentBet() > 0 && p2.getCurrentBet() > 0) {
      this.log.Template({ name: "brakets", title: "MATCH - Blinds Completed", date: true }).R({ pot: this.dealer.getPot() });
      this.stepChecker.grantStep("blindsBetting");
      this.continue(thisSocket);
    } else {
      let p = (p1 && p1.getCurrentBet() === 0) ? p1 : p2;
      if (p) {
        const isSB = (p === p1);
        this.log.Template({ name: "brakets", title: "MATCH - Asking Blinds", date: true }).R({ player: p.name, type: isSB ? "SB" : "BB" });
        this.communicator.msgBuilder(`askForBlindBets`, "public", p, { displayMsg: `Waiting for ${p.name} (${isSB ? 'SB' : 'BB'})` });
        this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
        this.communicator.msgBuilder(`askForBlindBets`, "private", p, { id: p.id, displayMsg: `YOUR TURN: ${isSB ? 'Small' : 'Big'} Blind` });
        this.dealer.talkToPLayerById(p.id, this.communicator.getMsg());
      }
    }
  }

  fold(thisSocket) {
        const foundPlayer = this.players.find(p => p.id == thisSocket.id);
    if (foundPlayer && !foundPlayer.folded) {
      foundPlayer.setLastAction("Fold");
      foundPlayer.setFolded(true);
      this.playersFold.push(foundPlayer.name);
      this.dealer.setChecked(foundPlayer.id);
      
      this.log.Template({ name: "brakets", title: "MATCH - FOLD", date: true }).R({ player: foundPlayer.name });

      this.communicator.msgBuilder("fold", "public", foundPlayer, { displayMsg: `${foundPlayer.name} folded.` });
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
      this.continue(thisSocket);
    }
  }

  continue(thisSocket) {
    setTimeout(() => { this.startGame(thisSocket); }, 1000);
  }

  winner = (winnerPlayer, isFold = false) => {
    if (this.stepChecker.checkStep("winner")) return;
    this.stepChecker.grantStep("winner");

    const pot = this.dealer.getPot();
    winnerPlayer.chips += pot;
    
    this.log.Template({ name: "brakets", title: "MATCH - WINNER", date: true }).R({
      winner: winnerPlayer.name,
      amount: pot,
      isFold: isFold
    });

    this.communicator.msgBuilder("winner", "public", null, { 
      method: "winner", 
      displayMsg: `${winnerPlayer.name} wins ${pot}${isFold ? ' (Fold)' : ''}!`,
      winner: [{ name: winnerPlayer.name, playerId: winnerPlayer.id }]
    });
    this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());

    setTimeout(() => { this.restartMatch(); }, 4000);
  };

  restartMatch() {
    this.log.Template({ name: "brakets", title: "MATCH - Restarting", date: true }).R({ oldGameId: this.gameId });
    
    const oldGameId = this.gameId;
    this.pot = 0;
    this.cardsDealer = [];
    this.playersFold = [];
    this.players.forEach(p => {
      p.cards = [];
      p.currentBet = 0;
      p.folded = false;
      p.lastAction = "";
    });
    this.shuffledDeck = Deck.shuffleDeck(Deck.cards, 101);
    this.dealer.deck = this.shuffledDeck;
    this.dealer.cardsDealer = [];
    this.dealer.pot = 0;
    this.dealer.removeChecks();
    
    if (this.players.length > 1) { this.players.push(this.players.shift()); }

    this.stepChecker.reset();
    this.stepChecker.gameFlow.gameId = oldGameId;
    this.stepChecker.grantStep("signUp");
    this.startGame();
  }

  bettingCore = (thisSocket, bettingFor) => {
  if (this.stepChecker.checkStep("winner")) return;
  
  const activePlayers = this.players.filter(p => p.connected && !p.folded);

  if (activePlayers.length === 1) {
    this.winner(activePlayers[0], true);
    return;
  }

  const maxBet = Math.max(...activePlayers.map(p => p.getCurrentBet()));
  
  let sorted = [...activePlayers];
  
  if (bettingFor === "firstBetting") {
    const bbPosition = activePlayers.length === 2 ? 1 : 2;
    if (activePlayers.length > bbPosition + 1) {
      sorted = [
        ...activePlayers.slice(bbPosition + 1),
        ...activePlayers.slice(0, bbPosition + 1)
      ];
    } else {
      sorted = [...activePlayers];
    }
  } else {
    sorted = [
      ...activePlayers.slice(1),
      ...activePlayers.slice(0, 1)
    ];
  }
  
  const playersToAct = sorted.filter(p => 
    (p.getCurrentBet() < maxBet) || !this.dealer.getPlayersChecked().includes(p.id)
  );

  if (playersToAct.length === 0 && this.dealer.allPlayersCheck()) {
    this.log.Template({ name: "brakets", title: `MATCH - Betting Round ${bettingFor} Finished`, date: true }).R({ pot: this.dealer.getPot() });
    this.dealer.removeChecks();
    const steps = { 
      firstBetting: "firstBetting", 
      flopBetting: "flop_Bet_Step", 
      turnBetting: "turn_Bet_Step", 
      riverBetting: "river_Bet_Step" 
    };
    this.stepChecker.grantStep(steps[bettingFor]);
    this.continue(thisSocket);
  } else if (playersToAct.length > 0) {
    const p = playersToAct[0];
    const opts = maxBet === 0 ? ["bet", "fold", "check"] : ["call", "rise", "fold"];
    
    this.log.Template({ name: "brakets", title: "MATCH - Waiting Player Act", date: true }).R({ player: p.name, options: opts });

    this.communicator.msgBuilder(`bettingCore-${bettingFor}`, "private", p, { 
      messageForId: p.id, 
      action: opts, 
      displayMsg: "Your turn" 
    });
    this.dealer.talkToPLayerById(p.id, this.communicator.getMsg());
    
    this.communicator.msgBuilder(`bettingCore-${bettingFor}`, "public", p, { 
      messageForId: p.id, 
      action: opts, 
      displayMsg: `Waiting for ${p.name}` 
    });
    this.dealer.talkToPlayerBUTid(p.id, this.communicator.getMsg());
  }
};

  dealerHand = (thisSocket, whatHand) => {
    this.log.Template({ name: "brakets", title: `MATCH - Dealer Hand: ${whatHand.toUpperCase()}`, date: true }).R({ gameId: this.gameId });
    this.dealer.dealCardsDealer(whatHand === "flop" ? 3 : 1);
    const steps = { flop: "flop_Dealer_Hand", turn: "turn_Dealer_Hand", river: "river_Dealer_Hand" };
    this.stepChecker.grantStep(steps[whatHand]);
    this.communicator.msgBuilder(`dealerHand-${whatHand}`, "public", null, { displayMsg: `Dealer deals the ${whatHand}` });
    this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
    this.continue(thisSocket);
  };

  checkPrizes(thisSocket) {
    const cards = this.dealer.getDealerCards();
    this.log.Template({ name: "brakets", title: "MATCH - Checking Prizes", date: true }).R({ cardsCount: cards.length });
    if (cards.length >= 3) {
      this.players.forEach(p => { if (p && !p.folded) p.setCurrentPrize(p.checkPrize(cards)); });
      const steps = { 3: "flop_Check_Prize_Step", 4: "turn_Check_Prize_Step", 5: "river_Check_Prize_Step" };
      this.stepChecker.grantStep(steps[cards.length]);
    }
    this.continue(thisSocket);
  }

  startGame(thisSocket = {}) {
        
    if (this.stepChecker.checkStep("pause")) return;

    if (!this.dealer.hasMinimumPlayers()) {
      this.communicator.msgBuilder("startGame", "public", null, { displayMsg: "Waiting for players..." });
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
      return;
    }
    if (!this.stepChecker.checkStep("blindsBetting")) return this.askForBlindBets(thisSocket);
    if (!this.stepChecker.checkStep("dealtPrivateCards")) return this.dealtPrivateCards(thisSocket);
    if (!this.stepChecker.checkStep("firstBetting")) return this.bettingCore(thisSocket, "firstBetting");
    if (!this.stepChecker.checkStep("flop_Dealer_Hand")) { this.dealer.getChipsFromPlayers(); return this.dealerHand(thisSocket, "flop"); }
    if (!this.stepChecker.checkStep("flop_Check_Prize_Step")) return this.checkPrizes(thisSocket);
    if (!this.stepChecker.checkStep("flop_Bet_Step")) return this.bettingCore(thisSocket, "flopBetting");
    if (!this.stepChecker.checkStep("turn_Dealer_Hand")) { this.dealer.getChipsFromPlayers(); return this.dealerHand(thisSocket, "turn"); }
    if (!this.stepChecker.checkStep("turn_Check_Prize_Step")) return this.checkPrizes(thisSocket);
    if (!this.stepChecker.checkStep("turn_Bet_Step")) return this.bettingCore(thisSocket, "turnBetting");
    if (!this.stepChecker.checkStep("river_Dealer_Hand")) { this.dealer.getChipsFromPlayers(); return this.dealerHand(thisSocket, "river"); }
    if (!this.stepChecker.checkStep("river_Check_Prize_Step")) return this.checkPrizes(thisSocket);
    if (!this.stepChecker.checkStep("river_Bet_Step")) return this.bettingCore(thisSocket, "riverBetting");
    if (!this.stepChecker.checkStep("finalHands")) { 
      this.dealer.getChipsFromPlayers(); 
      this.dealer.setFinalHands(); 
      this.stepChecker.grantStep("finalHands"); 
      return this.continue(thisSocket); 
    }
    if (!this.stepChecker.checkStep("showDown")) {
      this.log.Template({ name: "brakets", title: "MATCH - Showdown", date: true }).R(this.dealer.getFinalHands());
      this.communicator.msgBuilder("showDown", "public", null, { method: "showDown", showDown: this.dealer.getFinalHands() });
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());
      this.stepChecker.grantStep("showDown");
      return this.continue(thisSocket);
    }
    if (!this.stepChecker.checkStep("winner")) {
      const winnerData = WinnerCore.Winner(this.dealer.getFinalHands());
      const winner = Array.isArray(winnerData) ? winnerData[0] : winnerData;
      const wp = this.players.find(p => p.id === winner.playerId);
      if (wp) this.winner(wp);
      return;
    }
  }

  pause(thisSocket) {
    const socketId = typeof thisSocket === "string" ? thisSocket : thisSocket.id;
    const foundPlayer = this.players.find((p) => p.id === socketId);
    if (foundPlayer) {
      foundPlayer.setConnected(false);
      this.stepChecker.grantStep("pause");
      this.log.Template({ name: "brakets", title: "MATCH - PAUSE", date: true }).R({ player: foundPlayer.name, reason: "Disconnected" });

      this.communicator.msgBuilder("pause", "public", foundPlayer, {
        displayMsg: `${foundPlayer.name} disconnected. Game paused.`,
      });
      this.dealer.talkToAllPlayersOnTable(this.communicator.getMsg());

      const timeout = setTimeout(() => {
        this.playerLeave(thisSocket);
        this.pauseTimeouts.delete(foundPlayer.name);
      }, 60000); // 1 minute
      this.pauseTimeouts.set(foundPlayer.name, timeout);
    }
  }

  close(thisSocket) {
    this.playerLeave(thisSocket);
  }

  playerLeave(thisSocket) {
    const index = this.players.findIndex(p => p.id === thisSocket.id);
    if (index !== -1) {
      this.log.Template({ name: "brakets", title: "MATCH - Player Leaving", date: true }).R({ player: this.players[index].name });
      this.players.splice(index, 1);
    }
    this.continue(thisSocket);
  }

  stats(socketId) { this.log.Template({ name: "brakets", title: "MATCH - Stats", date: true }).R({ pot: this.dealer.getPot(), players: this.players.length }); }
}

module.exports = Match;

