///Select the best hands in an array of winner
const { flat } = require("radash");
const {
  notRepeatedInIntArray,
  highestCardNumberFromArray,
  cardsToNumericValues,
  //arrayThatMatchesaCharachter,
  numberToCard,
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

  const flatAllPairs = flat(allPairs);

  const numericArray = cardsToNumericValues(flatAllPairs);

  return highestCardNumberFromArray(numericArray);
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

  return arraysOrdenados[0].map((x) => numberToCard(x));
}

class WinnerCore {
  constructor() {}
  static Winner(handsObj) {
    console.log("****************** THE WINNER ******************");

    const bestHands = selectBestRankHands(handsObj);

    if (bestHands.length == 1) {
      return bestHands;
    }

    ///Pairs
    if (bestHands[0].pokerHand == "pairs") {
      let allPairsArray = [];
      let allCardsArray = [];
      bestHands.forEach((bestHand) => {
        allPairsArray.push(...bestHand.show);
      });

      let betterPairCard = betterPair(allPairsArray);

      ///Has the best Pairs Array
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

      console.log(bestOutofPairSingles, "bestGameFromPairWinners");
      console.log(allPairsInfoArray, "allPairsInfoArray");

      const bestPairInfo = allPairsInfoArray.filter((info) =>
        compareArraysNoOrder(bestOutofPairSingles, info.cards)
      );

      console.log(bestPairInfo, "wATCH");
    }
  }
}


module.exports = WinnerCore;
