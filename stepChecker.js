const { signUp } = require("./mock_sockets");

class StepChecker {
  gameFlowOriginal = {
    gameId: "",
    signUp: false,
    startGame: false,
    pause: false,
    blindsBetting: false,
    dealtPrivateCards: false,




    //error cuando entran valores iguales
    //creo que el askfor cards se jode cuando entran todos valores iguales
    firstBetting: false,

    flop_dealerHand: false,
    flopCheckCards: false, //first check then bet
    flopBetting: false,

    turn_dealerHand:false,
    turnCheckCards:false,
    turnBetting: false,

    //river_dealerHand:false
    //riverCheckCards:false,
    //riverBetting: false,

    //dealerFinal:false
    //finalCheckCards:false,

    //select Champion

    //fakeEnd:true
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
    console.log(step)
    this.gameFlow[step] = true;
    console.log(this.gameFlow[step])
    return ;
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
