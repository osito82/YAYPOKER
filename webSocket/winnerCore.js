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
    const trioNumVals = cardsToSingleNumValsArray(trioCards.flat())
    const pairNumVals = cardsToSingleNumValsArray(pairCards.flat())

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
    if (!bestHands || bestHands.length === 0) return []
    if (bestHands.length === 1) return bestHands

    const type = bestHands[0].pokerHand
    let winners = []

    switch (type) {
      case 'pairs': {
        const handsWithValues = bestHands.map((h) => ({
          ...h,
          pairVal: betterPair(h.show),
        }))
        const maxPairVal = Math.max(...handsWithValues.map((h) => h.pairVal))
        const candidates = handsWithValues.filter(
          (h) => h.pairVal === maxPairVal,
        )

        if (candidates.length === 1) return [candidates[0]]

        // Tie breaker: compare other cards
        const highestSum = Math.max(
          ...candidates.map((h) =>
            sumArrayNumbers(cardsToSingleNumValsArray(h.cards)),
          ),
        )
        return candidates.filter(
          (h) =>
            sumArrayNumbers(cardsToSingleNumValsArray(h.cards)) === highestSum,
        )
      }

      case 'twoPairs': {
        const handsWithValues = bestHands.map((h) => {
          const nums = cardsToSingleNumValsArray(h.show.flat()).sort(
            (a, b) => b - a,
          )
          return { ...h, highPair: nums[0], lowPair: nums[2] }
        })
        const maxHigh = Math.max(...handsWithValues.map((h) => h.highPair))
        let candidates = handsWithValues.filter((h) => h.highPair === maxHigh)
        if (candidates.length > 1) {
          const maxLow = Math.max(...candidates.map((h) => h.lowPair))
          candidates = candidates.filter((h) => h.lowPair === maxLow)
        }
        if (candidates.length > 1) {
          const highestSum = Math.max(
            ...candidates.map((h) =>
              sumArrayNumbers(cardsToSingleNumValsArray(h.cards)),
            ),
          )
          candidates = candidates.filter(
            (h) =>
              sumArrayNumbers(cardsToSingleNumValsArray(h.cards)) ===
              highestSum,
          )
        }
        return candidates
      }

      case 'threeOfAKind': {
        const handsWithValues = bestHands.map((h) => ({
          ...h,
          trioVal: Math.max(...cardsToSingleNumValsArray(h.show.flat())),
        }))
        const maxTrio = Math.max(...handsWithValues.map((h) => h.trioVal))
        let candidates = handsWithValues.filter((h) => h.trioVal === maxTrio)
        if (candidates.length > 1) {
          const highestSum = Math.max(
            ...candidates.map((h) =>
              sumArrayNumbers(cardsToSingleNumValsArray(h.cards)),
            ),
          )
          candidates = candidates.filter(
            (h) =>
              sumArrayNumbers(cardsToSingleNumValsArray(h.cards)) ===
              highestSum,
          )
        }
        return candidates
      }

      case 'fourOfaKind': {
        const handsWithValues = bestHands.map((h) => ({
          ...h,
          quadVal: Math.max(...cardsToSingleNumValsArray(h.show.flat())),
        }))
        const maxQuad = Math.max(...handsWithValues.map((h) => h.quadVal))
        return handsWithValues.filter((h) => h.quadVal === maxQuad)
      }

      case 'fullHouse': {
        const handsWithValues = bestHands.map((h) => {
          const nums = cardsToSingleNumValsArray(h.show.flat())
          const counts = {}
          nums.forEach((n) => (counts[n] = (counts[n] || 0) + 1))
          const trio = Number(Object.keys(counts).find((k) => counts[k] === 3))
          const pair = Number(Object.keys(counts).find((k) => counts[k] === 2))
          return { ...h, trio, pair }
        })
        const maxTrio = Math.max(...handsWithValues.map((h) => h.trio))
        let candidates = handsWithValues.filter((h) => h.trio === maxTrio)
        if (candidates.length > 1) {
          const maxPair = Math.max(...candidates.map((h) => h.pair))
          candidates = candidates.filter((h) => h.pair === maxPair)
        }
        return candidates
      }

      case 'straight':
      case 'straightFlush':
      case 'royalFlush': {
        const handsWithValues = bestHands.map((h) => ({
          ...h,
          sum: sumArrayNumbers(cardsToSingleNumValsArray(h.show.flat())),
        }))
        const maxSum = Math.max(...handsWithValues.map((h) => h.sum))
        return handsWithValues.filter((h) => h.sum === maxSum)
      }

      case 'flush': {
        const handsWithValues = bestHands.map((h) => ({
          ...h,
          nums: cardsToSingleNumValsArray(h.show.flat()).sort((a, b) => b - a),
        }))
        let candidates = handsWithValues
        for (let i = 0; i < 5; i++) {
          const maxVal = Math.max(...candidates.map((h) => h.nums[i]))
          candidates = candidates.filter((h) => h.nums[i] === maxVal)
          if (candidates.length === 1) break
        }
        return candidates
      }

      case 'highCard': {
        const handsWithValues = bestHands.map((h) => ({
          ...h,
          nums: cardsToSingleNumValsArray(h.cards.flat()).sort((a, b) => b - a),
        }))
        let candidates = handsWithValues
        for (let i = 0; i < 5; i++) {
          const maxVal = Math.max(...candidates.map((h) => h.nums[i]))
          candidates = candidates.filter((h) => h.nums[i] === maxVal)
          if (candidates.length === 1) break
        }
        return candidates
      }

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
  WinnerCore, // ✅ ahora puedes usar WinnerCore.Winner()
  selectBestRankHands,
  betterPair,
  betterTwoPairs,
  betterThreeOfAKind,
  betteraFourOfaKind,
  betterFullHouse,
  betterStraight,
}
