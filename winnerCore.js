///Select the best hands in an array of winner
const R = require("radash");
const {
  notRepeatedInIntArray,
  highestCardNumberFromArray,
  cardsToSingleNumValsArray,
  singleValsToSymbolsArray,
  numberToCard,
  uniqueElementsArray,
  compareArraysNoOrder,
  sumArrayNumbers,
} = require("./utils");

function selectBestRankHands(arrayHands) {
  const arrayRanks = [];

  if (arrayHands.length === 0) {
    return [];
  }

  arrayHands.forEach((hand) => {
    arrayRanks.push(hand.prizeRank);
  });

  const minimun = Math.min(...arrayRanks);

  const bestHands = arrayHands.filter((hand) => {
    return hand.prizeRank == minimun;
  });

  return bestHands;
}

function betterPair(...pairs) {
  const allPairs = [...pairs];
  const flatAllPairs = R.flat(allPairs);
  const numericArray = cardsToSingleNumValsArray(flatAllPairs);
  return highestCardNumberFromArray(numericArray);
}

function betterTwoPairs(...pairs) {
  const fourWSymbol = pairs[0].map((pair) => pair.join().split(","));

  const fourSingleNumbers = fourWSymbol.map((x) =>
    cardsToSingleNumValsArray(x)
  );

  const singles = fourSingleNumbers.map((x) =>
    uniqueElementsArray(x).sort((a, b) => b - a)
  );

  console.log(singles, "fourSingles");

  let izq = 0;
  let der = 0;

  for (let i = 0; i < singles.length; i++) {
    const currentPair = singles[i];

    if (currentPair[0] > izq) {
      izq = currentPair[0];
    }
  }

  for (let i = 0; i < singles.length; i++) {
    const currentPair = singles[i];

    if (currentPair[0] == izq && currentPair[1] > der) {
      der = currentPair[1];
    }
  }

  let maxPair = [izq, der];

  console.log(maxPair, "maxPair");
  const fourSimbols = [
    ...singleValsToSymbolsArray(maxPair),
    ...singleValsToSymbolsArray(maxPair),
  ].sort();

  //osito
  console.log(fourSimbols, "fourSimbols");

  //console.log(ArrayOutOfPairSingles(fourSingles))
  //const allPairs = [...pairs];
  //  const flatAllPairs = flat(allPairs);
  //  console.log(allPairs, 'xxx')
  //  const numericArray = cardsToSingleNumValsArray(flatAllPairs);
  // return highestCardNumberFromArray(numericArray);
}

function ArrayOutOfPairSingles(...arrays) {
  let arraysWithNoRepeated = arrays.map((array) =>
    notRepeatedInIntArray(array)
  );

  const arraysOrdenados = arraysWithNoRepeated.sort((array1, array2) => {
    const suma1 = sumArrayNumbers(array1);
    const suma2 = sumArrayNumbers(array2);

    return suma2 - suma1;
  });

  const highestSortedSingleNumArray = arraysOrdenados[0];

  return singleValsToSymbolsArray(highestSortedSingleNumArray);
}

class WinnerCore {
  constructor() {}
  static Winner(handsObj) {
    console.log("****************** THE WINNER ******************");

    const bestHands = selectBestRankHands(handsObj);

    if (bestHands.length == 1) {
      return bestHands;
    }

    //===========================================Pairs
    if (bestHands[0].pokerHand == "pairs") {
      let allPairsArray = [];
      let allCardsArray = [];
      bestHands.forEach((bestHand) => {
        allPairsArray.push(...bestHand.show);
      });

      let betterPairCard = betterPair(allPairsArray);

      ///Best Pairs Array
      const allPairsInfoArray =
        bestHands.filter((hand) => {
          return hand.show.some((item) => item.includes(betterPairCard));
        }) || [];

      allPairsInfoArray.forEach((bestHand) => {
        allCardsArray.push(bestHand.cards);
      });

      if (allPairsInfoArray.length == 1) {
        return allPairsInfoArray[0];
      }

      const bestOutofPairSingles = ArrayOutOfPairSingles(...allCardsArray);

      //console.log(bestOutofPairSingles, "bestGameFromPairWinners");
      //console.log(allPairsInfoArray, "allPairsInfoArray");

      const bestPairInfo = allPairsInfoArray.filter((info) =>
        compareArraysNoOrder(bestOutofPairSingles, info.cards)
      );
      return bestPairInfo;
    }

    //===========================================twoPairs
    if (bestHands[0].pokerHand == "twoPairs") {
      console.log("twoPairs");
      let allPairsArray = [];
      let allCardsArray = [];

      bestHands.forEach((bestHand) => {
        allPairsArray.push(bestHand.show);
      });

      let betterTwoPairsCard = betterTwoPairs(allPairsArray);
      let singlesNumArray = betterTwoPairsCard;

      //console.log(betterTwoPairsCard, "singlesNumArxxxxxxxray");
      /*
        ///Best Pairs Array
        const allPairsInfoArray =
          bestHands.filter((hand) => {
            return hand.show.some((item) => item.includes(betterPairCard));
          }) || [];
  
        allPairsInfoArray.forEach((bestHand) => {
          allCardsArray.push(bestHand.cards);
        });
  
        if (allPairsInfoArray.length == 1) {
          return allPairsInfoArray[0];
        }
    */
    }
  }
}

module.exports = WinnerCore;
