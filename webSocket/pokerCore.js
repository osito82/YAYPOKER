const { cardsToSingleNumValsArray, numberToCard } = require('./utils')

///get all posible combinations from cards
function combinar(arr, k) {
  const result = []
  function combinatoria(temp, start) {
    if (temp.length === k) {
      result.push([...temp])
      return
    }
    for (let i = start; i < arr.length; i++) {
      temp.push(arr[i])
      combinatoria(temp, i + 1)
      temp.pop()
    }
  }
  combinatoria([], 0)
  return result
}

const sameValueCards = (cartas, valorBuscado) => {
  return cartas.filter((carta) => carta.startsWith(valorBuscado))
}

const detectPairs = (cartas) => {
  const conteoCartas = {}
  let arrayOnlyValues = []
  const parejas = []

  for (const carta of cartas) {
    const valor = carta.substring(0, carta.length - 1)

    conteoCartas[valor] = (conteoCartas[valor] || 0) + 1

    if (conteoCartas[valor] === 2) {
      arrayOnlyValues.push(valor)
      const sameValueCardsArray = sameValueCards(cartas, valor)
      if (sameValueCardsArray.length == 2) parejas.push(sameValueCardsArray)
    }
  }

  if (parejas.length === 1) {
    return {
      pokerHand: 'pairs',
      prizeRank: 9,
      show: parejas[0],
      cards: cartas,
    }
  } else {
    return false
  }
}

const detectTwoPairs = (cartas) => {
  const conteoCartas = {}
  const parejas = []

  for (const carta of cartas) {
    const valor = carta.substring(0, carta.length - 1)

    conteoCartas[valor] = (conteoCartas[valor] || 0) + 1

    if (conteoCartas[valor] === 2) {
      parejas.push(sameValueCards(cartas, valor))
    }
  }

  if (parejas.length === 2) {
    return {
      pokerHand: 'twoPairs',
      prizeRank: 8,
      show: parejas,
      cards: cartas,
    }
  } else {
    return false
  }
}

const detectStraightFlush = (cartas) => {
  const isStraight = detectStraight(cartas)
  const isFlush = detectFlush(cartas)
  const isRoyalFlush = detectRoyalFlush(cartas)

  if (isStraight && isFlush && !isRoyalFlush) {
    return {
      pokerHand: 'straightFlush',
      prizeRank: 2,
      show: cartas,
      cards: cartas,
    }
  } else {
    return false
  }
}

const detectFlush = (cartas) => {
  let flusha = new Set()

  for (const carta of cartas) {
    const simbolo = carta.substring(carta.length - 1)
    flusha.add(simbolo)
  }

  if (flusha.size === 1) {
    return {
      pokerHand: 'flush',
      prizeRank: 5,
      show: cartas,
      cards: cartas,
    }
  } else {
    return false
  }
}

function sumAllValuesArray(array) {
  const suma = array.reduce((acumulador, valor) => acumulador + valor, 0)
  return suma
}

function detectRoyalFlush(cartas) {
  const flush = detectFlush(cartas)
  if (!flush) return false

  const values = new Set(cardsToSingleNumValsArray(cartas))
  const royalValues = new Set([10, 11, 12, 13, 14])
  const isRoyal = [...royalValues].every((v) => values.has(v))
  if (isRoyal) {
    return {
      pokerHand: 'royalFlush',
      prizeRank: 1,
      show: cartas,
      cards: cartas,
    }
  }
  return false
}

function isArrayOrderedAndConsecutive(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] + 1 !== arr[i + 1]) {
      return false
    }
  }
  return true
}

function detectStraight(cartas) {
  const realValues = cardsToSingleNumValsArray(cartas)
  const numerosOrdenados = realValues.slice().sort((a, b) => a - b)
  let result

  if (isArrayOrderedAndConsecutive(numerosOrdenados)) {
    result = {
      pokerHand: 'straight',
      prizeRank: 6,
      show: cartas,
      cards: cartas,
    }
  } else {
    result = false
  }

  return result
}

const detectHighCard = (cartas) => {
  const realValues = cardsToSingleNumValsArray(cartas)
  const bigestNumber = Math.max(...realValues)

  for (const carta of cartas) {
    const miniArray = carta.split('')

    if (miniArray[0].toString() === numberToCard(bigestNumber).toString()) {
      return {
        pokerHand: 'highCard',
        prizeRank: 10,
        show: carta,
        cards: cartas,
      }
    }
  }

  return false
}

function detectFullHouse(cartas) {
  const threeOfAKind = detectThreeOfAKind(cartas)
  if (!threeOfAKind) return false

  const remainingCards = cartas.filter((c) => !threeOfAKind.show.includes(c))
  const pair = detectPairs(remainingCards)
  if (!pair) return false

  return {
    pokerHand: 'fullHouse',
    prizeRank: 4,
    show: [...threeOfAKind.show, ...pair.show],
    cards: cartas,
  }
}

const detectThreeOfAKind = (cartas) => {
  const conteoCartas = {}
  let trio = []

  for (const carta of cartas) {
    const valor = carta.substring(0, carta.length - 1)
    conteoCartas[valor] = (conteoCartas[valor] || 0) + 1

    if (conteoCartas[valor] === 3) {
      trio = [...sameValueCards(cartas, valor)]
    }
  }

  if (trio.length === 3) {
    return {
      pokerHand: 'threeOfAKind',
      prizeRank: 7,
      show: trio,
      cards: cartas,
    }
  } else {
    return false
  }
}

const detectFourOfaKind = (cartas) => {
  const conteoCartas = {}
  let fouroak = []

  for (const carta of cartas) {
    const valor = carta.substring(0, carta.length - 1)

    conteoCartas[valor] = (conteoCartas[valor] || 0) + 1

    if (conteoCartas[valor] === 4) {
      fouroak = [...sameValueCards(cartas, valor)]
    }
  }

  if (fouroak.length === 4) {
    return {
      pokerHand: 'fourOfaKind',
      prizeRank: 3,
      show: fouroak,
      cards: cartas,
    }
  } else {
    return false
  }
}

class PokerCore {
  constructor() {}

  static betterHand(dealerCards, playerCards) {
    let bestHand = { prizeRank: 11, cards: [] }
    const joinedCards = dealerCards.concat(playerCards)
    const combinationsArray = combinar(joinedCards, 5)

    const detectors = [
      detectRoyalFlush,
      detectStraightFlush,
      detectFourOfaKind,
      detectFullHouse,
      detectFlush,
      detectStraight,
      detectThreeOfAKind,
      detectTwoPairs,
      detectPairs,
      detectHighCard,
    ]

    for (const array of combinationsArray) {
      for (const detector of detectors) {
        const tempHand = detector(array)
        if (tempHand) {
          if (tempHand.prizeRank < bestHand.prizeRank) {
            bestHand = tempHand
          } else if (tempHand.prizeRank === bestHand.prizeRank) {
            // Si tienen el mismo rank, comparar cual es mejor
            // Usamos sumArrayNumbers como heurística rápida para la mejor combinación de 5
            const tempSum = sumAllValuesArray(
              cardsToSingleNumValsArray(tempHand.cards),
            )
            const bestSum = sumAllValuesArray(
              cardsToSingleNumValsArray(bestHand.cards),
            )
            if (tempSum > bestSum) {
              bestHand = tempHand
            }
          }
          // Una vez que encontramos el mejor rank para ESTA combinación, pasamos a la siguiente combinación
          break
        }
      }
    }

    return bestHand
  }
}

module.exports = PokerCore
