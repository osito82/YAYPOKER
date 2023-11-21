const Player = require("./player");
const Dealer = require("./dealer");
const Deck = require("./deck");
const StepChecker = require("./stepChecker");

const R = require("radash");
const log = require("./log");

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

  signUpPlayer(data, thisSocketId) {
    console.log("MATCH - signUpPlayer");

    if (this.players.length >= 10) {
      console.log("Max Ten Players"); //todo max players
      return;
    }

    const player = new Player(
      this.gameId,
      data.name,
      data.totalChips,
      [],
      thisSocketId
    );
    const foundPlayer = this.players.find(
      (myPlayer) => myPlayer.id == thisSocketId
    );

    const playerNumber = this.players.length + 1;

    player.setPlayerNumber(playerNumber);

    if (playerNumber >= 2) this.stepChecker.passedStep("signUp");

    if (!foundPlayer) this.players.push(player);
  }

  dealtPrivateCards() {
    console.log("MATCH - dealtPrivateCards");
    this.dealer.dealCardsEachPlayer(2);
    this.stepChecker.passedStep("dealPrivateCards");
    log.add({ players: this.players });
  }

  initialBet(thisSocketId, chipsToBet) {
    console.log("MATCH - initialBet");
    if (R.isEmpty(this.players)) {
      return;
    }

    const foundPlayer = this.players.find(
      (myPlayer) => myPlayer.id == thisSocketId
    );

    foundPlayer.setBet(chipsToBet);

    this.pot = this.pot + chipsToBet;

    log.add({
      initialBet: {
        player: foundPlayer,
        pot: this.pot,
      },
    });
  }

  askForBets(bettingFor) {
    console.log("MATCH - askForBets");

    if (bettingFor == "blinds") {
      //smallBlind Ask for bet P1
      if (!this.dealer.hasPlayerBet(1)) {
        this.dealer.talkToPLayer(1, "P1 - Please make your bet");
      } else {
        this.stepChecker.passedStep("smallBlind");
      }

      //bigBlind Ask for bet P2
      if (!this.dealer.hasPlayerBet(2)) {
        this.dealer.talkToPLayer(2, "P2 - Please make your bet");
      } else {
        this.stepChecker.passedStep("bigBlind");
      }
    }
  }

  fold(thisSocketId) {
    console.log("MATCH - fold");
    this.dealer.talkToPLayerById(thisSocketId, "bye amigo");

    const index = this.players.findIndex(
      (player) => player.id === thisSocketId
    );
    if (index !== -1) {
      this.players.splice(index, 1)[0];
    }
  }

  startGame() {
    console.log("MATCH - startGame");

    //Sign Up Min 2 Playes
    if (
      !this.stepChecker.checkStep("signUp") &&
      !this.dealer.hasMinimunPlayers()
    ) {
      this.dealer.talkToAllPlayers("Minimun 2 Players to Start");
    }

    //Blinds
    if (this.stepChecker.isAllowedTo("blinds")) {
      const timerAskBlinds = () => {
        if (
          !this.stepChecker.checkStep("bigBlind") ||
          !this.stepChecker.checkStep("smallBlind")
        ) {
          this.askForBets("blinds");
        } else {
          clearInterval(intervalId);
        }
      };

      const intervalId = setInterval(timerAskBlinds, 10000);
    }

    //Deal Private Cards
    // console.log("Deal Private Cards");
    console.log(this.stepChecker.isAllowedTo("dealPrivateCards"), "xxx");
    if (this.stepChecker.isAllowedTo("dealPrivateCards")) {
      //console.log("holis");
      this.dealtPrivateCards();
    }

    //   if (this.dealer.hasPlayerBet(1) && this.dealer.hasPlayerBet(2))

    //      this.dealer.dealCardsDealer(3);

    log.add({ dealerCards: this.dealer.showCards() });
  }
}

module.exports = Match;
