const { signUp } = require("./mock_sockets");

class StepChecker {
  gameFlowOriginal = {
    gameId: "",
    signUp: false,
    startGame: false,
    pause: false,
    blindsBetting: false,
    firstBetting: false,
    dealerFlop: false,
    flopCheckCards:false, //first check then bet
    flopBetting: false,

    turnBetting: false,
    riverBetting: false,
    finalBetting: false,

    dealtPrivateCards: false,

    fakeEnd:true
  };

  constructor(gameId) {
    this.gamesArray = [];
    this.gameFlow = { ...this.gameFlowOriginal };
    this.gameFlow.gameId = gameId;
  }

  getChecker() {
    return this.gameFlow;
  }

  checkStep(step) {
    return step in this.gameFlow ? this.gameFlow[step] : false;
  }

  grantStep(step) {
    this.gameFlow[step] = true;
    return this;
  }

  revokeStep(step) {
    this.gameFlow[step] = false;
    return this;
  }

  reset() {
    this.gameFlow = { ...this.gameFlowOriginal };
  }

  // isAllowedTo(step) {
  //   switch (step) {
  //     // case "bigBlind":
  //     // case "smallBlind":
  //     // case "blinds":
  //     //   return this.checkStep("signUp");

  //     case "dealtPrivateCards":
  //       return (
  //         this.checkStep("signUp") &&
  //         this.checkStep("smallBlind") &&
  //         this.checkStep("bigBlind")
  //       );
  //   }
  // }
}

module.exports = StepChecker;
