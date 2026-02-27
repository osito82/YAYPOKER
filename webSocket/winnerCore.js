const {
  notRepeatedInIntArray,
  highestCardNumberFromArray,
  cardsToSingleNumValsArray,
  singleValsToSymbolsArray,
  compareArraysNoOrder,
  selectArrayWithBiggestNumbers,
  getHigherSumArrayContent,
  sumArrayNumbers,
  singleSymbolsToNumsArray,
} = require('./utils')

function selectBestRankHands(arrayHands) {
  if (!arrayHands || arrayHands.length === 0) return []

  const validHands = arrayHands.filter(
    (h) => h.prizeRank !== undefined && h.prizeRank !== null,
  )
  if (validHands.length === 0) return []

  const minRank = Math.min(...validHands.map((h) => h.prizeRank))
  return validHands.filter((h) => h.prizeRank === minRank)
}

function betterPair(...pairs) {
  const flatAll = pairs.flat(2)
  const nums = cardsToSingleNumValsArray(flatAll)

  const counts = {}
  nums.forEach((n) => (counts[n] = (counts[n] || 0) + 1))

  const pairValues = Object.keys(counts)
    .filter((k) => counts[k] >= 2)
    .map(Number)
  return pairValues.length ? Math.max(...pairValues) : Math.max(...nums)
}

function betterTwoPairs(...hands) {
  if (hands.length === 1 && Array.isArray(hands[0][0][0])) hands = hands[0]

  const evaluatedHands = hands.map((hand) => {
    const flat = hand.flat()
    const nums = cardsToSingleNumValsArray(flat)
    const counts = {}
    nums.forEach((n) => (counts[n] = (counts[n] || 0) + 1))
    return Object.keys(counts)
      .filter((k) => counts[k] >= 2)
      .map(Number)
      .sort((a, b) => b - a)
  })

  let best = evaluatedHands[0]
  for (let i = 1; i < evaluatedHands.length; i++) {
    const cur = evaluatedHands[i]
    if (cur[0] > best[0] || (cur[0] === best[0] && cur[1] > best[1])) best = cur
  }

  return [
    ...singleValsToSymbolsArray([best[0], best[0]]),
    ...singleValsToSymbolsArray([best[1], best[1]]),
  ]
}

function betterThreeOfAKind(cards) {
  const nums = cardsToSingleNumValsArray(cards.flat())
  const trio = highestCardNumberFromArray(nums)
  return [trio, trio, trio]
}

function betteraFourOfaKind(cards) {
  const nums = cardsToSingleNumValsArray(cards.flat())
  const quad = highestCardNumberFromArray(nums)
  return [quad, quad, quad, quad]
}
function betterFullHouse(hands) {
  if (!hands || hands.length === 0) return []

  // Convertimos cada mano a números sumando trio + par
  const handsWithValue = hands.map((hand) => {
    const [trioCards, pairCards] = hand
    const trioNumVals = cardsToSingleNumValsArray(trioCards)
    const pairNumVals = cardsToSingleNumValsArray(pairCards)

    const trioNum = Math.max(...trioNumVals)
    const pairNum = Math.max(...pairNumVals)

    // Guardamos la mano original junto con la suma de valores
    return {
      hand: [trioNum, trioNum, trioNum, pairNum, pairNum],
      sum: trioNum + pairNum,
    }
  })

  // Seleccionamos la mano con mayor suma
  const bestHand = handsWithValue.reduce((prev, current) =>
    current.sum > prev.sum ? current : prev,
  )

  // Convertimos números a símbolos
  return singleValsToSymbolsArray(bestHand.hand)
}

function betterStraight(cards) {
  const numerics = cards.map((c) =>
    cardsToSingleNumValsArray(c).sort((a, b) => b - a),
  )
  const best = getHigherSumArrayContent(numerics)
  return singleValsToSymbolsArray(best)
}

class WinnerCore {
  static Winner(hands) {
    const bestHands = selectBestRankHands(hands)
    if (!bestHands || bestHands.length === 0) return null
    if (bestHands.length === 1) return bestHands

    const type = bestHands[0].pokerHand
    let bestCards, allCardsArray

    switch (type) {
      case 'pairs':
        allCardsArray = bestHands.flatMap((h) => h.show)
        const bestPairCard = betterPair(allCardsArray)
        bestCards = bestHands.filter((h) =>
          h.show.some((s) =>
            cardsToSingleNumValsArray(s).includes(bestPairCard),
          ),
        )
        if (bestCards.length === 1) return bestCards[0]
        const outOfPair = ArrayOutOfPairSingles(
          ...bestCards.map((h) => h.cards),
        )
        return bestCards.filter((h) => compareArraysNoOrder(outOfPair, h.cards))

      case 'twoPairs':
        allCardsArray = bestHands.map((h) => h.show)
        const bestTwoPairsCard = betterTwoPairs(allCardsArray)
        bestCards = bestHands.filter((h) => {
          const handNums = cardsToSingleNumValsArray(h.show.flat())
          return handNums.includes(
            singleSymbolsToNumsArray([bestTwoPairsCard[0]])[0],
          )
        })
        return bestCards.length === 1 ? bestCards[0] : bestCards

      case 'threeOfAKind':
        allCardsArray = bestHands.map((h) => h.show)
        const bestThreeCards = betterThreeOfAKind(allCardsArray)
        bestCards = bestHands.filter((h) =>
          compareArraysNoOrder(bestThreeCards, h.show.flat()),
        )
        return bestCards.length === 1 ? bestCards[0] : bestCards

      case 'fourOfaKind':
        allCardsArray = bestHands.map((h) => h.show)
        const bestFourCards = betteraFourOfaKind(allCardsArray)
        bestCards = bestHands.filter((h) =>
          compareArraysNoOrder(bestFourCards, h.show.flat()),
        )
        return bestCards.length === 1 ? bestCards[0] : bestCards

      case 'fullHouse':
        allCardsArray = bestHands.map((h) => h.show)
        const bestFull = betterFullHouse(allCardsArray)
        bestCards = bestHands.filter((h) =>
          compareArraysNoOrder(bestFull, h.show.flat()),
        )
        return bestCards.length === 1 ? bestCards[0] : bestCards

      case 'straight':
      case 'straightFlush':
      case 'royalFlush':
        allCardsArray = bestHands.map((h) => h.show)
        const bestStraightCards = betterStraight(allCardsArray)
        bestCards = bestHands.filter((h) =>
          compareArraysNoOrder(bestStraightCards, h.show.flat()),
        )
        return bestCards.length === 1 ? bestCards[0] : bestCards

      case 'flush':
        allCardsArray = bestHands.map((h) => h.show)
        const bestFlush = selectArrayWithBiggestNumbers(
          allCardsArray.map((c) => cardsToSingleNumValsArray(c)),
        )
        bestCards = bestHands.filter((h) =>
          compareArraysNoOrder(
            singleValsToSymbolsArray(bestFlush),
            h.show.flat(),
          ),
        )
        return bestCards.length === 1 ? bestCards[0] : bestCards

      case 'highCard':
        allCardsArray = bestHands.map((h) => h.cards)
        const bestHigh = selectArrayWithBiggestNumbers(
          allCardsArray.map((c) => cardsToSingleNumValsArray(c.flat())),
        )
        bestCards = bestHands.filter((h) =>
          compareArraysNoOrder(
            singleValsToSymbolsArray(bestHigh),
            h.cards.flat(),
          ),
        )
        return bestCards.length === 1 ? bestCards[0] : bestCards

      default:
        return bestHands
    }
  }
}

// Helpers
function ArrayOutOfPairSingles(...arrays) {
  const uniques = arrays.map((a) => notRepeatedInIntArray(a))
  const best = uniques.sort(
    (a, b) => sumArrayNumbers(b) - sumArrayNumbers(a),
  )[0]
  return singleValsToSymbolsArray(best)
}

module.exports = {
  WinnerCore,           // ✅ ahora puedes usar WinnerCore.Winner()
  selectBestRankHands,
  betterPair,
  betterTwoPairs,
  betterThreeOfAKind,
  betteraFourOfaKind,
  betterFullHouse,
  betterStraight,
}
