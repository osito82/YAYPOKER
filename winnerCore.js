///Select the best hands in an array of winner
const R = require("radash");
const {
  notRepeatedInIntArray,
  highestCardNumberFromArray,
  cardsToSingleNumValsArray,
  singleValsToSymbolsArray,
  cardsToNoSymbolValsArray,
  uniqueElementsArray,
  compareArraysNoOrder,
  selectArrayWithBiggestNumbers,
  numberToCard,
  getHigherSumArrayContent,
  flatToGetNUmbersArray,
  flatToGetSymbolsArray,
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

//must work for flush
function betterStraight(cards) {
  const numerics = cards.map((x) =>
    cardsToSingleNumValsArray(x).sort((a, b) => b - a)
  );
  const maxSumIntArray = getHigherSumArrayContent(numerics);
  const maxSumSymArray = singleValsToSymbolsArray(maxSumIntArray);

  return maxSumSymArray;
}

//Get higher array of 3 items
function betterThreeOfAKind(cards) {
  let bestThreeKind = [];
  if (!cards) {
    return [];
  }

  bestThreeKind = highestCardNumberFromArray(
    cardsToSingleNumValsArray(cards.map((btk) => btk[0]))
  );

  const bestThreeKindArray = [bestThreeKind, bestThreeKind, bestThreeKind];
  return bestThreeKindArray;
}

function betterFullHouse(cards) {
  let singlesFromThree = [];
  let singlesFromTwo = [];
  cards.map((x) => {
    singlesFromThree.push(x[0][0]);
  });

  const biggestThreeRepresent = highestCardNumberFromArray(
    cardsToSingleNumValsArray(singlesFromThree)
  );

  const bestFH3 = cards.filter((trio) =>
    cardsToNoSymbolValsArray(trio[0]).includes(biggestThreeRepresent)
  );

  if (bestFH3.length == 1) {
    const bestfullHouse = [...bestFH3[0]];
    return flatToGetSymbolsArray(bestfullHouse);
  }

  bestFH3.map((x) => {
    singlesFromTwo.push(x[1][0]);
  });

  const biggestTwoRepresent = highestCardNumberFromArray(
    cardsToSingleNumValsArray(singlesFromTwo)
  );

  const bestFullHouseTwoParts = bestFH3.filter((duo) =>
    cardsToNoSymbolValsArray(duo[1]).includes(biggestTwoRepresent)
  );

  return flatToGetSymbolsArray(bestFullHouseTwoParts[0]);
}

function betterTwoPairs(...pairs) {
  const fourWSymbol = pairs[0].map((pair) => pair.join().split(","));

  const fourSingleNumbers = fourWSymbol.map((x) =>
    cardsToSingleNumValsArray(x)
  );

  const singles = fourSingleNumbers.map((x) =>
    uniqueElementsArray(x).sort((a, b) => b - a)
  );

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

  const fourSimbols = [
    ...singleValsToSymbolsArray(maxPair),
    ...singleValsToSymbolsArray(maxPair),
  ].sort();

  return fourSimbols;
}

///Gets the Best Pair after moving out repeated
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

      const allTwoPairsInfoArray =
        bestHands.filter((hand) => {
          const twoPairsFromHand = cardsToNoSymbolValsArray(hand.show.flat());
          return (
            twoPairsFromHand.sort().toString() ===
            betterTwoPairsCard.sort().toString()
          );
        }) || [];

      allTwoPairsInfoArray.forEach((bestHand) => {
        allCardsArray.push(bestHand.cards);
      });

      if (allTwoPairsInfoArray.length == 1) {
        return allTwoPairsInfoArray[0];
      }

      const bestOutofPairSingles = ArrayOutOfPairSingles(...allCardsArray);

      const unTieBestGame = betterTwoPairsCard.concat(bestOutofPairSingles);

      const allTwoPairsInfoArrayUnTie =
        bestHands.filter((hand) => {
          const myCards = cardsToNoSymbolValsArray(hand.cards.flat());

          return myCards.sort().toString() === unTieBestGame.sort().toString();
        }) || [];

      return allTwoPairsInfoArrayUnTie;
    }

    //===========================================threeOfAKind
    if (bestHands[0].pokerHand == "threeOfAKind") {
      console.log("threeOfAKind");
      let allThreeOfAKindArray = [];

      bestHands.forEach((bestHand) => {
        allThreeOfAKindArray.push(bestHand.show);
      });

      let betterThreeOfAKindCards = betterThreeOfAKind(allThreeOfAKindArray);

      const allThreeOfAKindInfoArray =
        bestHands.filter((hand) => {
          const threeOfAKindFromHand = cardsToNoSymbolValsArray(
            hand.show.flat()
          );
          return (
            threeOfAKindFromHand.sort().toString() ===
            betterThreeOfAKindCards.sort().toString()
          );
        }) || [];

      allThreeOfAKindInfoArray.forEach((bestHand) => {
        allThreeOfAKindArray.push(bestHand.cards);
      });

      if (allThreeOfAKindArray.length == 1) {
        return allThreeOfAKindInfoArray[0];
      }

      const bestOutof3oAKSingles = ArrayOutOfPairSingles(
        ...allThreeOfAKindArray
      );

      const unTieBest3oAKGame = bestOutof3oAKSingles.concat(
        betterThreeOfAKindCards
      );
      const all3ofAKInfoArrayUnTie =
        bestHands.filter((hand) => {
          const myCards = cardsToNoSymbolValsArray(hand.cards.flat());

          return (
            myCards.sort().toString() === unTieBest3oAKGame.sort().toString()
          );
        }) || [];

      return all3ofAKInfoArrayUnTie;
    }

    //===========================================straight
    if (bestHands[0].pokerHand == "straight") {
      console.log("straight");
      let allstraightArray = [];

      bestHands.forEach((bestHand) => {
        allstraightArray.push(bestHand.show);
      });

      let betterStraightCards = betterStraight(allstraightArray);

      const allStraightInfoArray =
        bestHands.filter((hand) => {
          const straightFromHand = cardsToNoSymbolValsArray(hand.show.flat());

          return (
            straightFromHand.sort().toString() ===
            betterStraightCards.sort().toString()
          );
        }) || [];

      return allStraightInfoArray;
    }

    //===========================================flush
    if (bestHands[0].pokerHand == "flush") {
      console.log("flush");
      let allFlushArray = [];

      bestHands.forEach((bestHand) => {
        allFlushArray.push(bestHand.show);
      });

      const onlyNumbers = allFlushArray.map((x) =>
        cardsToSingleNumValsArray(x)
      );

      const bestArray = selectArrayWithBiggestNumbers(onlyNumbers);
      const betterFlushCards = singleValsToSymbolsArray(bestArray);

      const allFlushInfoArray =
        bestHands.filter((hand) => {
          const flushFromHand = cardsToNoSymbolValsArray(hand.show.flat());

          return (
            flushFromHand.sort().toString() ===
            betterFlushCards.sort().toString()
          );
        }) || [];

      return allFlushInfoArray;
    }

    //===========================================fullHouse
    if (bestHands[0].pokerHand == "fullHouse") {
      console.log("fullHouse");
      let allFullHouseArray = [];

      bestHands.forEach((bestHand) => {
        allFullHouseArray.push(bestHand.show);
      });

      const betterFullHouseHand = betterFullHouse(allFullHouseArray);

      const allFullHouseInfoArray =
        bestHands.filter((hand) => {
          const flushFromHand = cardsToNoSymbolValsArray(hand.show.flat());

          return (
            flushFromHand.sort().toString() ===
            betterFullHouseHand.sort().toString()
          );
        }) || [];

      return allFullHouseInfoArray;
    }
  }
}

module.exports = WinnerCore;
