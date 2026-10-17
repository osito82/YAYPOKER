import { describe, it, expect } from 'vitest'
const { validateBet } = require('../match/betting')

// GAM-002 AC-03: one validator for every bet and raise
describe('validateBet', () => {
  const base = { chips: 1000, currentBet: 0, maxBet: 0, lastRaise: 0, bigBlind: 20 }
  const v = (over) => validateBet({ ...base, ...over })

  it('rejects decimals', () => {
    const r = v({ amount: 25.5 })
    expect(r.ok).toBe(false)
    expect(r.displayMsg).toContain('whole chips')
  })

  it('opening bet must be at least one big blind', () => {
    expect(v({ amount: 15 }).ok).toBe(false)
    expect(v({ amount: 15 }).minLegal).toBe(20)
    expect(v({ amount: 20 })).toMatchObject({ ok: true, kind: 'bet', total: 20 })
  })

  it('a short stack may open all-in below the big blind', () => {
    expect(v({ chips: 12, amount: 12 })).toMatchObject({ ok: true, kind: 'allin', total: 12 })
  })

  it('rejects a bet below the call and treats an equal amount as a call', () => {
    const facing = { maxBet: 100, lastRaise: 80 }
    expect(v({ ...facing, amount: 60 }).ok).toBe(false)
    expect(v({ ...facing, amount: 100 })).toMatchObject({ ok: true, kind: 'call' })
  })

  it('raise must be at least the last full raise', () => {
    // BB 20 posted: minimum raise is to 40
    const r = v({ maxBet: 20, lastRaise: 20, amount: 30 })
    expect(r.ok).toBe(false)
    expect(r.displayMsg).toContain('minimum raise is 40')
    expect(v({ maxBet: 20, lastRaise: 20, amount: 40 })).toMatchObject({
      ok: true,
      kind: 'raise',
      isFullRaise: true,
    })
    // After a raise to 100 (raise of 80), the next raise is to at least 180
    expect(v({ maxBet: 100, lastRaise: 80, amount: 150 }).ok).toBe(false)
    expect(v({ maxBet: 100, lastRaise: 80, amount: 180 }).ok).toBe(true)
  })

  it('an all-in for less than a full raise is allowed but is not a full raise', () => {
    const r = v({ chips: 130, maxBet: 100, lastRaise: 80, amount: 130 })
    expect(r).toMatchObject({ ok: true, kind: 'allin', total: 130, isFullRaise: false })
  })

  it('an all-in below the call is allowed (call all-in)', () => {
    expect(v({ chips: 50, maxBet: 100, amount: 50 })).toMatchObject({ ok: true, kind: 'allin' })
  })

  it('amounts above the stack are capped to all-in', () => {
    expect(v({ chips: 300, amount: 5000 })).toMatchObject({ ok: true, kind: 'allin', total: 300 })
  })

  it('a player who may only call or fold cannot raise, even all-in', () => {
    const r = v({ maxBet: 130, lastRaise: 80, currentBet: 100, chips: 900, amount: 300, canRaise: false })
    expect(r.ok).toBe(false)
    expect(r.displayMsg).toContain('only call or fold')
    expect(
      v({ maxBet: 130, currentBet: 100, chips: 900, amount: 130, canRaise: false }),
    ).toMatchObject({ ok: true, kind: 'call' })
  })

  it('the amount must be above the current bet', () => {
    expect(v({ currentBet: 20, maxBet: 20, amount: 20 }).ok).toBe(false)
  })
})
