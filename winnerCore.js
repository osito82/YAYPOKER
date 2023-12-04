///Select the best hands in an array of winner
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


///Selects the array with the hihest different card
function ArrayWithHighestDifferentCard(...arrays) {
    const flat = [...arrays].flat();

    const noCopies = notRepeatedInIntArray(flat);

    const maxNumber = highestCardNumberFromArray(noCopies);

    return [...arrays].find(
      (array) => array.find((item) => item.includes(maxNumber)) || []
    );
  }
//}

class WinnerCore {
  constructor() {}
  static Winner(handsObj) {
    console.log("****************** THE WINNER ******************");
   const bestHand = selectBestRankHands(handsObj);

if (bestHand.length == 1) {
    //console.log('xxxxxxxxxxxxxxxxxxx')
    return bestHand
}




  }
}

module.exports = WinnerCore;
