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

const cardsToNumericValues = (cartas) => {
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
  return realValues;
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
      return Number(number);
  }
};

function highestCardNumberFromArray(cartas) {
  const bigestNumber = Math.max(...cartas);
  return numberToCard(bigestNumber);
}

function arrayThatMatchesaCharachter(caracter, ...arrays) {
  return (
    arrays.find((array) =>
      array.some((elemento) => elemento.includes(caracter))
    ) || []
  );
}

///Remove all elemnets that has a copy in an array
function notRepeatedInIntArray(array) {
  let numbersArray = cardsToNumericValues(array);
  const uniqueArray = [...numbersArray].filter(
    (item) => numbersArray.indexOf(item) === numbersArray.lastIndexOf(item)
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

module.exports = {
  shuffle,
  highestCardNumberFromArray,
  generateUniqueId,
  randomName,
  msgBuilder,
  notRepeatedInIntArray,
  arrayThatMatchesaCharachter,
  cardsToNumericValues,
  numberToCard,
};
