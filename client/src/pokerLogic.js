
// Basic utils needed for poker logic
const shuffle = (array) => {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const cardsToNoSymbolValsArray = (cartas) => cartas.map((carta) => carta.slice(0, -1))

const singleSymbolsToNumsArray = (cartas) => {
  return cartas.map((carta) => {
    switch (carta) {
      case 'T': return 10
      case 'J': return 11
      case 'Q': return 12
      case 'K': return 13
      case 'A': return 14
      default: return parseInt(carta, 10)
    }
  })
}

const cardsToSingleNumValsArray = (cartas) => {
  const noSymbol = cardsToNoSymbolValsArray(cartas)
  return singleSymbolsToNumsArray(noSymbol)
}

const numberToCard = (number) => {
  switch (number) {
    case 10: return 'T'
    case 11: return 'J'
    case 12: return 'Q'
    case 13: return 'K'
    case 14: return 'A'
    default: return number.toString()
  }
}

// PokerCore Logic
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
  const parejas = []
  for (const carta of cartas) {
    const valor = carta.substring(0, carta.length - 1)
    conteoCartas[valor] = (conteoCartas[valor] || 0) + 1
    if (conteoCartas[valor] === 2) {
      const sameValueCardsArray = sameValueCards(cartas, valor)
      if (sameValueCardsArray.length === 2) parejas.push(sameValueCardsArray)
    }
  }
  if (parejas.length === 1) {
    return { pokerHand: 'Pair', prizeRank: 9, show: parejas[0], cards: cartas }
  }
  return false
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
    return { pokerHand: 'Two Pairs', prizeRank: 8, show: parejas, cards: cartas }
  }
  return false
}

const detectFlush = (cartas) => {
  let flusha = new Set()
  for (const carta of cartas) {
    const simbolo = carta.substring(carta.length - 1)
    flusha.add(simbolo)
  }
  if (flusha.size === 1) {
    return { pokerHand: 'Flush', prizeRank: 5, show: cartas, cards: cartas }
  }
  return false
}

const sumAllValuesArray = (array) => array.reduce((acc, val) => acc + val, 0)

const detectRoyalFlush = (cartas) => {
  const realValues = cardsToSingleNumValsArray(cartas)
  const sumValues = sumAllValuesArray(realValues)
  const isFlush = detectFlush(cartas)
  if (sumValues === 60 && isFlush) {
    return { pokerHand: 'Royal Flush', prizeRank: 1, show: cartas, cards: cartas }
  }
  return false
}

const isArrayOrderedAndConsecutive = (arr) => {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] + 1 !== arr[i + 1]) return false
  }
  return true
}

const detectStraight = (cartas) => {
  const realValues = cardsToSingleNumValsArray(cartas)
  const numerosOrdenados = realValues.slice().sort((a, b) => a - b)
  if (isArrayOrderedAndConsecutive(numerosOrdenados)) {
    return { pokerHand: 'Straight', prizeRank: 6, show: cartas, cards: cartas }
  }
  return false
}

const detectStraightFlush = (cartas) => {
  if (detectStraight(cartas) && detectFlush(cartas) && !detectRoyalFlush(cartas)) {
    return { pokerHand: 'Straight Flush', prizeRank: 2, show: cartas, cards: cartas }
  }
  return false
}

const detectHighCard = (cartas) => {
  const realValues = cardsToSingleNumValsArray(cartas)
  const biggestNumber = Math.max(...realValues)
  const card = cartas.find(c => c.startsWith(numberToCard(biggestNumber)))
  return { pokerHand: 'High Card', prizeRank: 10, show: card, cards: cartas }
}

const detectThreeOfAKind = (cartas) => {
  const conteoCartas = {}
  let trio = []
  for (const carta of cartas) {
    const valor = carta.substring(0, carta.length - 1)
    conteoCartas[valor] = (conteoCartas[valor] || 0) + 1
    if (conteoCartas[valor] === 3) {
      trio = sameValueCards(cartas, valor)
    }
  }
  if (trio.length === 3) {
    return { pokerHand: 'Three of a Kind', prizeRank: 7, show: trio, cards: cartas }
  }
  return false
}

const detectFullHouse = (cartas) => {
  const isThreeSome = detectThreeOfAKind(cartas)
  // Need to find a pair that is NOT the same value as the triple
  if (isThreeSome) {
    const remainingCards = cartas.filter(c => !isThreeSome.show.includes(c))
    // detectPairs expects 5 cards originally but we can adapt it or just check manually
    const conteo = {}
    for (const c of remainingCards) {
      const v = c.substring(0, c.length - 1)
      conteo[v] = (conteo[v] || 0) + 1
      if (conteo[v] === 2) {
        return { pokerHand: 'Full House', prizeRank: 4, show: [isThreeSome.show, sameValueCards(remainingCards, v)], cards: cartas }
      }
    }
  }
  return false
}

const detectFourOfaKind = (cartas) => {
  const conteoCartas = {}
  for (const carta of cartas) {
    const valor = carta.substring(0, carta.length - 1)
    conteoCartas[valor] = (conteoCartas[valor] || 0) + 1
    if (conteoCartas[valor] === 4) {
      return { pokerHand: 'Four of a Kind', prizeRank: 3, show: sameValueCards(cartas, valor), cards: cartas }
    }
  }
  return false
}

export class PokerCore {
  static betterHand(dealerCards, playerCards) {
    if (!playerCards || playerCards.length === 0) return null
    const joinedCards = dealerCards.concat(playerCards)
    if (joinedCards.length < 5) {
        // If we have less than 5 cards, we can still evaluate some hands or just high card
        // But the combiner will return empty if k > arr.length
        return { pokerHand: 'Evaluating...', prizeRank: 11 }
    }
    
    let bestHand = { prizeRank: 12, pokerHand: 'High Card' }
    const combinationsArray = combinar(joinedCards, 5)

    for (const array of combinationsArray) {
      let tempHand = detectRoyalFlush(array)
      if (tempHand && tempHand.prizeRank < bestHand.prizeRank) bestHand = tempHand
      if (bestHand.prizeRank === 1) break

      tempHand = detectStraightFlush(array)
      if (tempHand && tempHand.prizeRank < bestHand.prizeRank) bestHand = tempHand

      tempHand = detectFourOfaKind(array)
      if (tempHand && tempHand.prizeRank < bestHand.prizeRank) bestHand = tempHand

      tempHand = detectFullHouse(array)
      if (tempHand && tempHand.prizeRank < bestHand.prizeRank) bestHand = tempHand

      tempHand = detectFlush(array)
      if (tempHand && tempHand.prizeRank < bestHand.prizeRank) bestHand = tempHand

      tempHand = detectStraight(array)
      if (tempHand && tempHand.prizeRank < bestHand.prizeRank) bestHand = tempHand

      tempHand = detectThreeOfAKind(array)
      if (tempHand && tempHand.prizeRank < bestHand.prizeRank) bestHand = tempHand

      tempHand = detectTwoPairs(array)
      if (tempHand && tempHand.prizeRank < bestHand.prizeRank) bestHand = tempHand

      tempHand = detectPairs(array)
      if (tempHand && tempHand.prizeRank < bestHand.prizeRank) bestHand = tempHand

      tempHand = detectHighCard(array)
      if (tempHand && tempHand.prizeRank < bestHand.prizeRank) bestHand = tempHand
    }

    return bestHand
  }
}

export class PokerOddsCalculator {
  constructor() {
    this.suits = ['h', 'd', 'c', 's']
    this.ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A']
  }

  generateDeck() {
    const deck = []
    for (const r of this.ranks) {
      for (const s of this.suits) {
        deck.push(r + s)
      }
    }
    return deck
  }

  removeUsedCards(deck, usedCards) {
    const usedSet = new Set(usedCards)
    return deck.filter(c => !usedSet.has(c))
  }

  calculateOdds(playerHands, boardCards = [], simulations = 100) {
    if (!playerHands || playerHands.length === 0) return { winProbabilities: [], tieProbability: 0 }
    
    let originalDeck = this.generateDeck()
    const currentBoard = [...boardCards]
    const usedCards = [...currentBoard, ...playerHands.flat()]
    originalDeck = this.removeUsedCards(originalDeck, usedCards)

    const wins = Array(playerHands.length).fill(0)
    let ties = 0

    for (let i = 0; i < simulations; i++) {
      const remainingDeck = shuffle([...originalDeck])
      const simBoard = [...currentBoard]
      while (simBoard.length < 5) {
        simBoard.push(remainingDeck.pop())
      }

      const evaluatedHands = playerHands.map((hand, idx) => {
        const best = PokerCore.betterHand(simBoard, hand)
        return { ...best, playerId: idx }
      })

      // Simple winner detection for Monte Carlo
      evaluatedHands.sort((a, b) => a.prizeRank - b.prizeRank)
      
      if (evaluatedHands.length > 1 && evaluatedHands[0].prizeRank === evaluatedHands[1].prizeRank) {
          // Tie (simplified)
          ties++
      } else {
          wins[evaluatedHands[0].playerId]++
      }
    }

    return {
      winProbabilities: wins.map(w => (w / simulations * 100).toFixed(1)),
      tieProbability: (ties / simulations * 100).toFixed(1)
    }
  }
}
