const { signUp } = require("./mock_sockets");

class StepChecker {
  gameFlowOriginal = {
    gameId: "",
    signUp: false,
    startGame: false,
    pause: false,
    blindsBetting: false,
    dealtPrivateCards: false,

    firstBetting: false,

    flop_Dealer_Hand: false,
    flop_Check_Prize_Step: false, //first check then bet
    flop_Bet_Step: false,

    turn_Dealer_Hand: false,
    turn_Check_Prize_Step: false,
    turn_Bet_Step: false,

    //////bbbbbbbb
    river_Dealer_Hand:false,
    river_Check_Prize_Step:false,
    river_Bet_Step: false,


    finalHands:false
    //showdown


    //dealerFinal:false
    //finalCheckCards:false,
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
}

module.exports = StepChecker;
