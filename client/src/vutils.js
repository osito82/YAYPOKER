//const { v4: uuidv4 } = require("uuid");
import { v4 } from "uuid";

function generateUniqueId(long = 4) {
  const fullUUID = v4();
  const shortUUID = fullUUID.substr(0, long).replace(/-/g, "");
  return shortUUID;
}

const simbolConverter = (simbol) => {
  const number = {};

  const letter = simbol.charAt(0);
  const symbol = simbol.charAt(simbol.length - 1);

  const letterMod = letterToNumber(letter);
  const symbolMod = letterToSymbol(symbol);

  number.letter = letterMod;
  number.symbol = symbolMod;

  return number;
};

// function getKeyData(objeto, key) {
//   if (!objeto) return;

//   let obj;
//   try {
//     obj = JSON.parse(objeto);
//   } catch (error) {
//     obj = objeto;
//   }

//   if (key == "displayMsg") {
//     const displayMsg = obj?.message?.data?.displayMsg;

//     if (displayMsg !== undefined) {
//       return String(displayMsg);
//     } else {
//       return `The key "${key}" was not found.`;
//     }
//   }
// }

const whatColor = (symbol) => {
  const symbolC = symbol.charAt(symbol.length - 1);
  switch (symbolC) {
    case "s":
    case "c":
      return "black";
    case "h":
    case "d":
      return "red";
  }
};

const letterToSymbol = (letter) => {
  switch (letter) {
    case "s":
      return "♠";
    case "h":
      return "♥";
    case "c":
      return "♣";
    case "d":
      return "♦";
  }
};

const letterToNumber = (letter) => {
  switch (letter) {
    case "T":
      return "10";
    default:
      return letter.toString();
  }
};

export {
  generateUniqueId,
  simbolConverter,
  letterToSymbol,
  letterToNumber,
  whatColor,
  //getKeyData,
};
