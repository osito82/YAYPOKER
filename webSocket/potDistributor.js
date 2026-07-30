const { WinnerCore } = require('./winnerCore')

/**
 * Official Texas Hold'em pot distribution.
 *
 * The pot is settled layer by layer (main pot + side pots, as built by
 * Dealer.calculatePots from each player's total hand contribution):
 *
 *  - A player can only win from each opponent up to the amount that
 *    opponent could match (effective stack rule).
 *  - Any unmatched portion of a bet (e.g. an all-in that nobody could
 *    call) is returned to its owner and can NEVER be won by opponents.
 *  - Each layer is awarded to the best hand among the players eligible
 *    for that layer (players who contributed to it and did not fold).
 *  - Tied layers are split; odd chips go to the earliest positions
 *    (closest to the button), one chip at a time.
 *
 * This function is pure: it performs no I/O and mutates nothing.
 *
 * @param {Array<{amount:number, eligiblePlayerIds:string[]}>} layers
 *        Pot layers from Dealer.calculatePots().
 * @param {Array<Object>} evaluations
 *        Hand evaluations for every player still in the hand (not folded).
 *        Each entry must contain at least { playerId, prizeRank, pokerHand }
 *        plus whatever WinnerCore needs for tie-breaks (cards, show...).
 * @param {Object}  [options]
 * @param {boolean} [options.isFold=false]
 *        True when the hand ended with every opponent folding.
 * @param {string[]} [options.fallbackWinnerIds=[]]
 *        Winners to use if a layer ends up with no eligible players
 *        (defensive; also covers the "winner contributed nothing" case).
 * @param {number} [options.totalPot=0]
 *        Raw pot, only used when no layers are available.
 * @param {(id:string)=>number} [options.seatOrderOf]
 *        Returns the seat/position index of a player, used to award odd
 *        chips on splits (lowest first).
 *
 * @returns {{
 *   payouts: Map<string, number>,   // total chips each player receives
 *   earned: Map<string, number>,    // chips actually WON (excludes returns)
 *   returned: Map<string, number>,  // unmatched bets returned to owner
 *   layerSummaries: Array<{amount:number, winnerIds:string[], isUncalledReturn:boolean}>
 * }}
 */
function distributePot(layers, evaluations, options = {}) {
  const {
    isFold = false,
    fallbackWinnerIds = [],
    totalPot = 0,
    seatOrderOf = () => 0,
  } = options

  const payouts = new Map()
  const earned = new Map()
  const returned = new Map()
  const layerSummaries = []

  const addTo = (map, id, amount) => map.set(id, (map.get(id) || 0) + amount)

  const splitAmong = (ids, amount, isReturn) => {
    const ordered = [...ids].sort((a, b) => seatOrderOf(a) - seatOrderOf(b))
    const share = Math.floor(amount / ordered.length)
    let remainder = amount - share * ordered.length
    for (const id of ordered) {
      const amt = share + (remainder > 0 ? 1 : 0)
      if (remainder > 0) remainder -= 1
      addTo(payouts, id, amt)
      if (isReturn) addTo(returned, id, amt)
      else addTo(earned, id, amt)
    }
    return ordered
  }

  // Fallback: no contribution layers available but there is money in the pot
  if ((!layers || layers.length === 0) && totalPot > 0) {
    const ids =
      fallbackWinnerIds.length > 0
        ? fallbackWinnerIds
        : evaluations.map((e) => e.playerId)
    if (ids.length > 0) {
      const winnerIds = splitAmong(ids, totalPot, false)
      layerSummaries.push({
        amount: totalPot,
        winnerIds,
        isUncalledReturn: false,
      })
    }
    return { payouts, earned, returned, layerSummaries }
  }

  for (const layer of layers || []) {
    if (!layer || layer.amount <= 0) continue

    // Only players still in the hand can win (folded players forfeit)
    let eligibleIds = (layer.eligiblePlayerIds || []).filter((id) =>
      evaluations.some((e) => e.playerId === id),
    )

    // Defensive: every contributor to this layer folded (or the only
    // remaining player contributed nothing to it) — hand winner(s) take it.
    if (eligibleIds.length === 0) {
      eligibleIds =
        fallbackWinnerIds.length > 0
          ? [...fallbackWinnerIds]
          : evaluations.map((e) => e.playerId)
      if (eligibleIds.length === 0) continue
    }

    // A layer with a single eligible player at showdown is an unmatched
    // bet: it is returned to its owner, not "won".
    const isUncalledReturn = !isFold && eligibleIds.length === 1

    let layerWinnerIds
    if (isFold || eligibleIds.length === 1) {
      layerWinnerIds = eligibleIds
    } else {
      const eligibleEvals = eligibleIds
        .map((id) => evaluations.find((e) => e.playerId === id))
        .filter(Boolean)
      layerWinnerIds = WinnerCore.Winner(eligibleEvals).map(
        (w) => w.playerId || w.id,
      )
      if (layerWinnerIds.length === 0) layerWinnerIds = eligibleIds
    }

    const winnerIds = splitAmong(
      layerWinnerIds,
      layer.amount,
      isUncalledReturn,
    )

    layerSummaries.push({
      amount: layer.amount,
      winnerIds,
      isUncalledReturn,
    })
  }

  return { payouts, earned, returned, layerSummaries }
}

module.exports = { distributePot }
