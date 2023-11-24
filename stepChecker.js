const { signUp } = require("./mock_sockets");

class StepChecker {
  gameFlowOriginal = {
    gameId: "",
    startGame: false,
    pause: false,
    signUp: false,
    blinds: false,
    dealPrivateCards: false,
  };

  constructor(gameId) {
    this.gamesArray = [];
    this.gameFlow = { ...this.gameFlowOriginal };
    this.gameFlow.gameId = gameId;
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

  isAllowedTo(step) {
    switch (step) {
      // case "bigBlind":
      // case "smallBlind":
      // case "blinds":
      //   return this.checkStep("signUp");

      case "dealPrivateCards":
        return (
          this.checkStep("signUp") &&
          this.checkStep("smallBlind") &&
          this.checkStep("bigBlind")
        );
    }
  }
}

module.exports = StepChecker;
