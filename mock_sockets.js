//Player signUp - 1
const signUp = {
  name: "osito",
  action: "signUp",
  totalChips: 1000,
};

//Start the game
const dealtPrivateCards = {
  action: "dealtPrivateCards",
};

//Player Initial Bet
const initialBet = {
  //torneoNumber:"55585548LC",
  action: "initialBet",
};

//Player Initial Bet
const stats = {
  //torneoNumber:"55585548LC",
  action: "stats",
};

//Start the game
const startGame = {
  action: "startGame",
};

//Fold
const fold = {
  action: "fold",
};

//Close
const close = {
  action: "close",
};

//Log
const log = {
  action: "log",
};

//SendMessage
const sendMessage = {
  action: "sendMessage",
};

//Player Ask
const askCard = {
  action: "askCard",
  bet: 20,
};

exports.askCard = askCard;
exports.signUp = signUp;
exports.startGame = startGame;
exports.initialBet = initialBet;
exports.dealtPrivateCards = dealtPrivateCards;
exports.log = log;
exports.sendMessage = sendMessage;
exports.fold = fold;
exports.close = close;
exports.stats = stats;
