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

//console.log("betterHand", PokerCore.betterHand(dealerCards, playerCards));

const fOaK = ["8h", "8c", "2c", "8s", "8d"];
const flush = ["8h", "7h", "6h", "5h", "2h"];
const straightFlush = ["9h", "Jh", "Qh", "Kh", "Th"];
const royalFlush = ["Ah", "Jh", "Qh", "Kh", "Th"];
const fullHouse = ["Ah", "As", "Qh"];
const fullHouseD = ["Ks", "Td"];
const HighCard = ["1h", "2s", "3h"];

//const expemientoXXX = PokerCore.betterHand(dealerCards, playerCards)
//console.log(expemientoXXX)
let contadorFullHouse = 0;

for (let i = 0; i < 1000000000; i++) {
  const xxx = [...Deck.shuffleDeck(Deck.cards, 100)];


  const deal = (number, cardsPractice) => {
    return cardsPractice.splice(0, number);
  };

  const dealerCards = deal(5, xxx);
  const playerCards = deal(2, xxx);

  const resultado = PokerCore.betterHand(dealerCards, playerCards);
 
  if (i % 100000 === 0) {
    console.log(i, dealerCards, playerCards, resultado.pokerHand)
  }
  
 //console.log(resultado, 'xxx');
  // Verificar si el resultado tiene un full house
  if (resultado && resultado.pokerHand == 'royalFlush') {
    
    console.log(resultado)
   //console.log(resultado.pokerHand);
   //console.log("Full House obtenido");
    contadorFullHouse++;
  }
}

console.log(`Número de veces que se obtuvo un Full House: ${contadorFullHouse}`);



//console.log("betterHand", PokerCore.betterHand(HighCard, fullHouseD));
