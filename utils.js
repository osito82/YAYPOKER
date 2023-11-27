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
  return nombreElegido;
}

module.exports = { shuffle, generateUniqueId, randomName, msgBuilder };
