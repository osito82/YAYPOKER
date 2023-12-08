const { v4: uuidv4 } = require("uuid");

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

function generateUniqueId() {
  const fullUUID = uuidv4();
  const shortUUID = fullUUID.substr(0, 4).replace(/-/g, "");
  return shortUUID;
}

const cardsToNoSymbolValsArray = (cartas) => {
  return cartas.map((carta) => carta.slice(0, -1));
};

const singleSymbolsToNumsArray = (cartas) => {
  const realValues = cartas.map((carta) => {
    switch (carta) {
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
        return parseInt(carta, 10);
    }
  });
  return realValues;
};

const cardsToSingleNumValsArray = (cartas) => {
  const noSymbol = cardsToNoSymbolValsArray(cartas);
  return singleSymbolsToNumsArray(noSymbol);
};

const singleValsToSymbolsArray = (singleNumsArray) => {
  return singleNumsArray.map((x) => numberToCard(x));
};

const numberToCard = (number) => {
  switch (number) {
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
      return number.toString();
  }
};

function selectArrayWithBiggestNumbers(arrays) {
  if (!arrays || arrays.length === 0) {
    return null;
  }

  let arrayConMaxNumeros = arrays[0];
  for (const currentArray of arrays) {
    const sumaActual = currentArray.reduce((sum, num) => sum + num, 0);
    const sumaMaxima = arrayConMaxNumeros.reduce((sum, num) => sum + num, 0);
    if (sumaActual > sumaMaxima) {
      arrayConMaxNumeros = currentArray;
    }
  }

  return arrayConMaxNumeros;
}

function highestCardNumberFromArray(cartas) {
  const bigestNumber = Math.max(...cartas);
  return numberToCard(bigestNumber);
}

function uniqueElementsArray(arr) {
  return arr.filter((item, index) => arr.indexOf(item) === index);
}

///Remove all elemnets that has a copy in an array
function notRepeatedInIntArray(array) {
  let numbersArray = cardsToSingleNumValsArray(array);
  const uniqueArray = [...numbersArray].filter(
    (item) => numbersArray.indexOf(item) === numbersArray.lastIndexOf(item)
  );

  return uniqueArray;
}

function notRepeatedSymbolnArray(array) {
  const uniqueArray = [...array].filter(
    (item) => array.indexOf(item) === array.lastIndexOf(item)
  );

  return uniqueArray;
}

//borrar despues communicator
function msgBuilder(action, msgType, player, data) {
  const { id: playerId, name: playerName } = player;
  return { action, msgType, playerId: playerId, name: playerName, data };
}

function randomName() {
  const nombres = [
    "Pollito",
    "Osito",
    "Duke",
    "Billy",
    "Dixon",
    "Daniel",
    "Luis",
    "Kenneth",
    "Marco",
    "Uribe",
    "BobbyG",
    "Joshua",
    "Adolfo",
  ];
  const indiceAleatorio = Math.floor(Math.random() * nombres.length);
  const nombreElegido = nombres[indiceAleatorio];
  return nombreElegido + "-" + (Math.random() * 100).toFixed().toString();
}

const sumArrayNumbers = (array) =>
  array.reduce((suma, numero) => suma + numero, 0);

///compares the singles N array VS complete AlfaNum
const compareArraysNoOrder = (single, completeaN) => {
  const complete = singleValsToSymbolsArray(notRepeatedInIntArray(completeaN));

  if (single.length === 0 || complete.length === 0) {
    return false;
  }

  const sortedSingle = single.slice().sort();
  const sortedComplete = complete.slice().sort();

  return sortedSingle.every((value, index) => value === sortedComplete[index]);
};

//creates a flatMap in an only numers array
const flatToGetNUmbersArray = (singleNumbersArray) => {
  singleNumbersArray.flatMap((item) => {
    if (Array.isArray(item)) {
      return item;
    } else {
      return [item];
    }
  });
};

//creates a flat of Symbols Array
const flatToGetSymbolsArray = (singleSymbolsArray) => {
  return cardsToNoSymbolValsArray(singleSymbolsArray.flat());
};

//Get biggest array according to it items sum
function getHigherSumArrayContent(arrays) {
  let sumaMaxima = -Infinity;
  let arregloMaximo = null;

  for (const arreglo of arrays) {
    const sumaActual = arreglo.reduce((acc, num) => acc + num, 0);

    if (sumaActual > sumaMaxima) {
      sumaMaxima = sumaActual;
      arregloMaximo = arreglo;
    }
  }

  return arregloMaximo;
}

module.exports = {
  shuffle,
  compareArraysNoOrder,
  highestCardNumberFromArray,
  generateUniqueId,
  randomName,
  flatToGetNUmbersArray,
  msgBuilder,
  notRepeatedInIntArray,
  cardsToSingleNumValsArray,
  numberToCard,
  sumArrayNumbers,
  singleValsToSymbolsArray,
  uniqueElementsArray,
  cardsToNoSymbolValsArray,
  getHigherSumArrayContent,
  notRepeatedSymbolnArray,
  selectArrayWithBiggestNumbers,
  flatToGetSymbolsArray,
  singleSymbolsToNumsArray,
};
