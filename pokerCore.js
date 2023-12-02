//get all posible combinations from cards
function combinar(arr, k) {
  const result = [];
  function combinatoria(temp, start) {
    if (temp.length === k) {
      result.push([...temp]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      temp.push(arr[i]);
      combinatoria(temp, i + 1);
      temp.pop();
    }
  }
  combinatoria([], 0);
  return result;
}

sameValueCards = (cartas, valorBuscado) => {
  return cartas.filter((carta) => carta.startsWith(valorBuscado));
};

detectPairs = (cartas) => {
  const conteoCartas = {};
  let arrayOnlyValues = [];
  const parejas = [];

  for (const carta of cartas) {
    const valor = carta.substring(0, carta.length - 1);

    conteoCartas[valor] = (conteoCartas[valor] || 0) + 1;

    if (conteoCartas[valor] === 2) {
      arrayOnlyValues.push(valor);
      const sameValueCardsArray = sameValueCards(cartas, valor);
      if (sameValueCardsArray.length == 2) parejas.push(sameValueCardsArray);
    }
  }

  if (parejas.length === 1) {
    return {
      pokerHand: "pairs",
      prizeRank: 9,
      show: parejas,
      cards: cartas,
    };
  } else {
    return false;
  }
};

detectTwoPairs = (cartas) => {
  const conteoCartas = {};
  const parejas = [];

  for (const carta of cartas) {
    const valor = carta.substring(0, carta.length - 1);

    conteoCartas[valor] = (conteoCartas[valor] || 0) + 1;

    if (conteoCartas[valor] === 2) {
      parejas.push(sameValueCards(cartas, valor));
    }
  }

  if (parejas.length === 2) {
    return {
      pokerHand: "twoPairs",
      prizeRank: 8,
      show: parejas,
      cards: cartas,
    };
  } else {
    return false;
  }
};

const detectStraightFlush = (cartas) => {
  const isStraight = detectStraight(cartas);
  const isFlush = detectFlush(cartas);
  const isRoyalFlush = detectRoyalFlush(cartas);

  if (isStraight && isFlush && !isRoyalFlush) {
    return {
      pokerHand: "straightFlush",
      prizeRank: 2,
      show: cartas,
      cards: cartas,
    };
  } else {
    return false;
  }
};

const detectFlush = (cartas) => {
  let flusha = new Set();

  for (const carta of cartas) {
    const simbolo = carta.substring(carta.length - 1);
    flusha.add(simbolo);
  }

  if (flusha.size === 1) {
    return {
      pokerHand: "flush",
      prizeRank: 5,
      show: cartas,
      cards: cartas,
    };
  } else {
    return false;
  }
};

function sumAllValuesArray(array) {
  const suma = array.reduce((acumulador, valor) => acumulador + valor, 0);
  return suma;
}

function detectRoyalFlush(cartas) {
  const realValues = cartas.map((carta) => {
    const valor = carta.substring(0, carta.length - 1);

    switch (valor) {
      case "T":
        return 10;
      case "J":
        return 11;
      case "Q":
        return 12;
      case "K":
        return 13;
      case "A":
        return 14;
      default:
        return 0;
    }
  });

  let isFlush = true;
  const sumValues = sumAllValuesArray(realValues);

  if (detectFlush(cartas) == false) isFlush = false;

  if (Number(sumValues) == 60 && isFlush) {
    return {
      pokerHand: "royalFlush",
      prizeRank: 1,
      show: cartas,
      cards: cartas,
    };
  } else return false;
}

function isArrayOrderedAndConsecutive(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] + 1 !== arr[i + 1]) {
      return false;
    }
  }
  return true;
}

function detectStraight(cartas) {
  const realValues = cartas.map((carta) => {
    const valor = carta.substring(0, carta.length - 1);

    switch (valor) {
      case "T":
        return 10;
      case "J":
        return 11;
      case "Q":
        return 12;
      case "K":
        return 13;
      case "A":
        return 14;
      default:
        return parseInt(valor, 10);
    }
  });

  const numerosOrdenados = realValues.slice().sort((a, b) => a - b);

  let memo = [1, 2, 3, 4, 5];

  if (isArrayOrderedAndConsecutive(numerosOrdenados)) {
    result = {
      pokerHand: "straight",
      prizeRank: 6,
      show: cartas,
      cards: cartas,
    };
  } else {
    result = false;
  }

  return result;
}

detectHighCard = (cartas) => {
  const realValues = cartas.map((carta) => {
    const valor = carta.substring(0, carta.length - 1);

    switch (valor) {
      case "T":
        return 10;
      case "J":
        return 11;
      case "Q":
        return 12;
      case "K":
        return 13;
      case "A":
        return 14;
      default:
        return parseInt(valor, 10);
    }
  });

  const bigestNumber = Math.max(...realValues);

  let numberToCard = (bigestNumber) => {
    switch (bigestNumber) {
      case 10:
        return "T";
      case 11:
        return "J";
      case 12:
        return "Q";
      case 13:
        return "K";
      case 14:
        return "A";
      default:
        return bigestNumber.toString();
    }
  };

  for (const carta of cartas) {
    const miniArray = carta.split("");

    if (miniArray[0].toString() === numberToCard(bigestNumber).toString()) {
      return {
        pokerHand: "highCard",
        prizeRank: 10,
        show: carta,
        cards: cartas,
      };
    }
  }

  return false;
};

function detectFullHouse(cartas) {
  const isThreeSome = detectThreesome(cartas);

  const isPairs = detectPairs(cartas);

  if (isThreeSome && isPairs) {
    return {
      pokerHand: "fullHouse",
      prizeRank: 4,
      show: cartas,
      cards: cartas,
    };
  } else {
    return false;
  }
}

detectThreesome = (cartas) => {
  const conteoCartas = {};
  let trio = [];

  for (const carta of cartas) {
    const valor = carta.substring(0, carta.length - 1);

    conteoCartas[valor] = (conteoCartas[valor] || 0) + 1;

    if (conteoCartas[valor] === 3) {
      trio = [...sameValueCards(cartas, valor)];
    }
  }

  if (trio.length === 3) {
    return {
      pokerHand: "threeOfAKind",
      prizeRank: 7,
      show: trio,
      cards: cartas,
    };
  } else {
    return false;
  }
};

detectFourOfaKind = (cartas) => {
  const conteoCartas = {};
  let fouroak = [];

  for (const carta of cartas) {
    const valor = carta.substring(0, carta.length - 1);
    const simbolo = carta.substring(carta.length - 1);

    conteoCartas[valor] = (conteoCartas[valor] || 0) + 1;

    if (conteoCartas[valor] === 4) {
      fouroak = [...sameValueCards(cartas, valor)];
    }
  }

  if (fouroak.length === 4) {
    return {
      pokerHand: "fourOfaKind",
      prizeRank: 3,
      show: fouroak,
      cards: cartas,
    };
  } else {
    return false;
  }
};



class PokerCore {
  constructor() {}

  static betterHand(dealerCards, playerCards) {
    let hand = {};
    let tempHand;
    const joinedCards = dealerCards.concat(playerCards);

    const combinationsArray = combinar(joinedCards, 5);

    combinationsArray.forEach((array) => {
      tempHand = detectRoyalFlush(array);

      if (tempHand && tempHand.pokerHand == "royalFlush") {
        hand = tempHand;
        return;
      }

      tempHand = detectStraightFlush(array);

      if (tempHand && tempHand.pokerHand === "straightFlush") {
        hand = tempHand;
        return;
      }

      tempHand = detectFourOfaKind(array);
      if (tempHand && tempHand.pokerHand == "fourOfaKind") {
        hand = tempHand;
        return;
      }

      tempHand = detectFullHouse(array);
      if (tempHand && tempHand.pokerHand == "fullHouse") {
        hand = tempHand;
        return;
      }

      tempHand = detectFlush(array);
      if (tempHand && tempHand.pokerHand == "flush") {
        hand = tempHand;
        return;
      }

      tempHand = detectStraight(array);
      if (tempHand && tempHand.pokerHand == "straight") {
        hand = tempHand;
        return;
      }

      tempHand = detectThreesome(array);
      if (tempHand && tempHand.pokerHand == "threeOfAKind") {
        hand = tempHand;
        return;
      }

      tempHand = detectTwoPairs(array);
      if (tempHand && tempHand.pokerHand == "twoPairs") {
        hand = tempHand;
        return;
      }

      tempHand = detectPairs(array);
      if (tempHand && tempHand.pokerHand == "pairs") {
        hand = tempHand;
        return;
      }

      tempHand = detectHighCard(array);
      if (tempHand && tempHand.pokerHand == "highCard") {
        hand = tempHand;
        return;
      }

    });

    
    return hand;
  }



}

module.exports = PokerCore;
