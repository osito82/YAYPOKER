//Development File

//const { shuffle } = require("./utils");
const Deck = require("./deck");
const PokerCore = require("./pokerCore");
const shuffledDeck = Deck.shuffleDeck(Deck.cards, 101);

const deal = (number, cardsPractice) => {

  return cardsPractice.splice(0, number);
};

//console.log(shuffledDeck);
const dealerCards = deal(5, shuffledDeck);
const playerCards = deal(2, shuffledDeck);


console.log("betterHand", PokerCore.betterHand(dealerCards, playerCards));

const fOaK = ["8h", "8c", "2c", "8s", "8d"];
const flush = ["8h", "7h", "6h", "5h", "2h"];
const straightFlush = ["9h", "Jh", "Qh", "Kh", "Th"];
const royalFlush = ["Ah", "Jh", "Qh", "Kh", "Th"];
const fullHouse =  ["Ah", "As", "Qh"] 
const fullHouseD = ["Ks", "Td"]
const HighCard =  ["1h", "2s", "3h"] 

//console.log("betterHand", PokerCore.betterHand(HighCard, fullHouseD));
