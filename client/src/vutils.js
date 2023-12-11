function generateUniqueId() {
  const fullUUID = uuidv4();
  const shortUUID = fullUUID.substr(0, 4).replace(/-/g, "");
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
};
