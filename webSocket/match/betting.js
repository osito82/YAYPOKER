// One validator for every bet and raise (GAM-002). No-Limit Hold'em rules:
// - whole chips only; the amount is the player's new TOTAL bet this street
// - with no open bet: at least one big blind
// - with an open bet: equal to it is a call, below it is invalid, a raise must
//   be at least the last full raise (never less than one big blind)
// - going all-in is always allowed, except raising when the player may only
//   call or fold (an incomplete all-in raise does not reopen the betting)
// Amounts above the stack are capped to the stack (all-in), like a bet slider.
// Pure function: no I/O, no mutation.

function validateBet({
  amount,
  currentBet = 0,
  chips,
  maxBet = 0,
  lastRaise = 0,
  bigBlind,
  canRaise = true,
}) {
  const stack = chips + currentBet
  const minRaise = Math.max(lastRaise, bigBlind)
  const minLegal = Math.min(maxBet === 0 ? bigBlind : maxBet + minRaise, stack)
  const reject = (reason, displayMsg) => ({
    ok: false,
    reason,
    displayMsg,
    minLegal,
  })

  if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
    return reject('whole chips', 'Bet invalid: whole chips only.')
  }

  const total = Math.min(amount, stack)
  const isAllIn = amount >= stack

  if (total <= currentBet) {
    return reject(
      'not above current bet',
      `Bet invalid: must be higher than your current bet of ${currentBet}.`,
    )
  }

  if (total < maxBet) {
    if (isAllIn) return { ok: true, kind: 'allin', total, isFullRaise: false }
    return reject('below call', `Bet invalid: calling costs ${maxBet}.`)
  }

  if (total === maxBet) {
    return { ok: true, kind: isAllIn ? 'allin' : 'call', total, isFullRaise: false }
  }

  // From here the player puts in more than the current bet: a bet or a raise
  if (!canRaise) {
    return reject('call or fold', 'You can only call or fold.')
  }

  const increase = total - maxBet
  const isFullRaise = increase >= minRaise

  if (maxBet === 0) {
    if (total < bigBlind && !isAllIn) {
      return reject('minimum bet', `Bet invalid: minimum bet is ${bigBlind}.`)
    }
    return { ok: true, kind: isAllIn ? 'allin' : 'bet', total, isFullRaise }
  }

  if (!isFullRaise && !isAllIn) {
    return reject(
      'minimum raise',
      `Raise invalid: minimum raise is ${maxBet + minRaise}.`,
    )
  }
  return { ok: true, kind: isAllIn ? 'allin' : 'raise', total, isFullRaise }
}

module.exports = { validateBet }
