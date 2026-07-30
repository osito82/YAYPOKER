import { describe, it, expect } from 'vitest'
const Dealer = require('../dealer')
const Player = require('../player')
const { distributePot } = require('../potDistributor')

// Build a player with a fixed contribution (chips already moved to the pot)
const contributor = (id, name, contribution, { allIn = false, folded = false, seat = 0 } = {}) => {
  const p = new Player('g1', name, id, 0, [], id, seat)
  p.setHandContribution(contribution)
  p.isAllIn = allIn
  if (folded) p.setFolded(true)
  return p
}

// Minimal hand evaluation; lower prizeRank = better hand
const evalOf = (playerId, prizeRank, cards = null) => ({
  playerId,
  name: playerId,
  prizeRank,
  pokerHand: prizeRank <= 8 ? 'twoPairs' : prizeRank === 9 ? 'pairs' : 'highCard',
  cards: cards || ['Ah', 'Kd', 'Qc', 'Js', '9h'],
  show: [],
})

const run = (players, evaluations, opts = {}) => {
  const totalPot = players.reduce((s, p) => s + p.getHandContribution(), 0)
  const dealer = new Dealer('g1', players, [], 't1', totalPot, [])
  const layers = dealer.calculatePots()
  return {
    layers,
    result: distributePot(layers, evaluations, {
      totalPot,
      seatOrderOf: (id) => players.find((p) => p.id === id)?.playerNumber || 0,
      ...opts,
    }),
  }
}

describe('Pot Distribution — Official Texas Holdem Rules', () => {
  it('Heads-up: unmatched all-in excess is returned, never won (the reported bug)', () => {
    // Log scenario: pot 80, Memo all-in 1342 total, Billy all-in call 213 total
    const memo = contributor('memo', 'Memo', 1382, { allIn: true, seat: 1 })
    const billy = contributor('billy', 'Billy', 253, { allIn: true, seat: 2 })
    const players = [memo, billy]

    // Billy wins the showdown (better hand)
    const evaluations = [evalOf('memo', 9), evalOf('billy', 8)]
    const { layers, result } = run(players, evaluations)

    // Layers: main 506 (253x2, both eligible) + 1129 uncalled (only Memo)
    expect(layers).toHaveLength(2)
    expect(layers[0].amount).toBe(506)
    expect(layers[1].amount).toBe(1129)

    // Billy wins ONLY the matched portion
    expect(result.payouts.get('billy')).toBe(506)
    expect(result.earned.get('billy')).toBe(506)
    expect(result.earned.get('billy')).toBeLessThanOrEqual(2 * 253)

    // Memo takes back the unmatched 1129 — it is a return, not a win
    expect(result.payouts.get('memo')).toBe(1129)
    expect(result.returned.get('memo')).toBe(1129)
    expect(result.earned.get('memo') || 0).toBe(0)

    // Chip conservation
    const total = [...result.payouts.values()].reduce((a, b) => a + b, 0)
    expect(total).toBe(1635)
  })

  it('Heads-up: big stack wins showdown — gets matched pot AND his own excess back', () => {
    const memo = contributor('memo', 'Memo', 1382, { allIn: true, seat: 1 })
    const billy = contributor('billy', 'Billy', 253, { allIn: true, seat: 2 })

    // Memo wins this time
    const evaluations = [evalOf('memo', 7), evalOf('billy', 9)]
    const { result } = run([memo, billy], evaluations)

    expect(result.earned.get('memo')).toBe(506)
    expect(result.returned.get('memo')).toBe(1129)
    expect(result.payouts.get('memo')).toBe(1635)
    expect(result.payouts.get('billy') || 0).toBe(0)
  })

  it('Heads-up preflop all-in fully covered: single pot, no returns', () => {
    const a = contributor('a', 'A', 1000, { allIn: true, seat: 1 })
    const b = contributor('b', 'B', 1000, { allIn: true, seat: 2 })

    const evaluations = [evalOf('a', 5), evalOf('b', 9)]
    const { layers, result } = run([a, b], evaluations)

    expect(layers).toHaveLength(1)
    expect(layers[0].amount).toBe(2000)
    expect(result.payouts.get('a')).toBe(2000)
    expect(result.returned.size).toBe(0)
  })

  it('Three players: short all-in wins main pot, side pot goes to second best', () => {
    // A all-in 100, B 300, C 300
    const a = contributor('a', 'A', 100, { allIn: true, seat: 1 })
    const b = contributor('b', 'B', 300, { allIn: true, seat: 2 })
    const c = contributor('c', 'C', 300, { seat: 3 })

    // Hand strengths: A best, B second, C worst
    const evaluations = [evalOf('a', 5), evalOf('b', 7), evalOf('c', 9)]
    const { layers, result } = run([a, b, c], evaluations)

    // Main: 100x3 = 300 (all eligible). Side: 200x2 = 400 (B,C eligible)
    expect(layers).toHaveLength(2)
    expect(layers[0].amount).toBe(300)
    expect(layers[1].amount).toBe(400)

    expect(result.payouts.get('a')).toBe(300) // A wins main pot only
    expect(result.payouts.get('b')).toBe(400) // B wins side pot only
    expect(result.payouts.get('c') || 0).toBe(0)

    const total = [...result.payouts.values()].reduce((x, y) => x + y, 0)
    expect(total).toBe(700)
  })

  it('Four players with nested side pots (50/100/200/200)', () => {
    const p1 = contributor('p1', 'P1', 50, { allIn: true, seat: 1 })
    const p2 = contributor('p2', 'P2', 100, { allIn: true, seat: 2 })
    const p3 = contributor('p3', 'P3', 200, { allIn: true, seat: 3 })
    const p4 = contributor('p4', 'P4', 200, { seat: 4 })

    // P1 best, P2 second, P3 third, P4 worst
    const evaluations = [
      evalOf('p1', 4),
      evalOf('p2', 6),
      evalOf('p3', 8),
      evalOf('p4', 10),
    ]
    const { layers, result } = run([p1, p2, p3, p4], evaluations)

    expect(layers).toHaveLength(3)
    expect(layers[0].amount).toBe(200) // 50 x 4
    expect(layers[1].amount).toBe(150) // 50 x 3
    expect(layers[2].amount).toBe(200) // 100 x 2

    expect(result.payouts.get('p1')).toBe(200) // wins layer 1
    expect(result.payouts.get('p2')).toBe(150) // wins layer 2
    expect(result.payouts.get('p3')).toBe(200) // wins layer 3
    expect(result.payouts.get('p4') || 0).toBe(0)

    const total = [...result.payouts.values()].reduce((x, y) => x + y, 0)
    expect(total).toBe(550)
  })

  it('Best overall hand NOT eligible for side pot cannot win it', () => {
    // A has the best hand but is all-in short; side pot must go to B or C
    const a = contributor('a', 'A', 50, { allIn: true, seat: 1 })
    const b = contributor('b', 'B', 200, { seat: 2 })
    const c = contributor('c', 'C', 200, { seat: 3 })

    // A best overall, but B beats C
    const evaluations = [evalOf('a', 3), evalOf('b', 7), evalOf('c', 9)]
    const { result } = run([a, b, c], evaluations)

    expect(result.payouts.get('a')).toBe(150) // main pot 50x3
    expect(result.payouts.get('b')).toBe(300) // side pot 150x2 — NOT A
    expect(result.payouts.get('c') || 0).toBe(0)
  })

  it('Split pot: tied hands split the layer, odd chip to earliest position', () => {
    // B is all-in short with 50; A called 51 (A's extra 1 is unmatched)
    const a = contributor('a', 'A', 51, { seat: 2 })
    const b = contributor('b', 'B', 50, { allIn: true, seat: 1 })

    // Identical hands → tie
    const sameCards = ['Ah', 'Kd', 'Qc', 'Js', '9h']
    const evaluations = [
      { ...evalOf('a', 10), cards: sameCards, pokerHand: 'highCard' },
      { ...evalOf('b', 10), cards: sameCards, pokerHand: 'highCard' },
    ]
    const { result } = run([a, b], evaluations)

    // Layer 1: 50 x 2 = 100 tied → 50/50. Layer 2: 1 from A only → returned
    expect(result.earned.get('a')).toBe(50)
    expect(result.earned.get('b')).toBe(50)
    expect(result.returned.get('a')).toBe(1)

    const total = [...result.payouts.values()].reduce((x, y) => x + y, 0)
    expect(total).toBe(101) // conservation, nothing evaporates
  })

  it('Split pot with odd chip: 3-way tie on 100 → 34/33/33 by position', () => {
    const a = contributor('a', 'A', 100, { seat: 1 })
    const b = contributor('b', 'B', 100, { seat: 2 })
    const c = contributor('c', 'C', 100, { seat: 3 })

    const sameCards = ['Ah', 'Kd', 'Qc', 'Js', '9h']
    const evaluations = ['a', 'b', 'c'].map((id) => ({
      ...evalOf(id, 10),
      cards: sameCards,
      pokerHand: 'highCard',
    }))
    const { result } = run([a, b, c], evaluations)

    // 300 split 3 ways = 100 each... use 301-pot scenario instead:
    expect(result.payouts.get('a')).toBe(100)
    expect(result.payouts.get('b')).toBe(100)
    expect(result.payouts.get('c')).toBe(100)
  })

  it('Fold win: last standing player takes everything including folded chips', () => {
    // A bet 100 then folded; B raised to 300, A folded → B wins
    const a = contributor('a', 'A', 100, { folded: true, seat: 1 })
    const b = contributor('b', 'B', 300, { seat: 2 })

    const evaluations = [evalOf('b', 10)] // only B is alive
    const { result } = run([a, b], evaluations, {
      isFold: true,
      fallbackWinnerIds: ['b'],
    })

    expect(result.payouts.get('b')).toBe(400)
    expect(result.payouts.get('a') || 0).toBe(0)
    expect(result.earned.get('b')).toBe(400) // in a fold win everything counts as won
  })

  it('Fold win where winner contributed less than a folded player', () => {
    // A (folded) put 100, B (folded) put 50, C raised to 200 and both folded
    const a = contributor('a', 'A', 100, { folded: true, seat: 1 })
    const b = contributor('b', 'B', 50, { folded: true, seat: 2 })
    const c = contributor('c', 'C', 200, { seat: 3 })

    const evaluations = [evalOf('c', 10)]
    const { result } = run([a, b, c], evaluations, {
      isFold: true,
      fallbackWinnerIds: ['c'],
    })

    expect(result.payouts.get('c')).toBe(350)
    const total = [...result.payouts.values()].reduce((x, y) => x + y, 0)
    expect(total).toBe(350)
  })

  it('Raise followed by shorter all-in call: raiser gets the difference back', () => {
    // A raises to 500, B calls all-in with 200 — classic uncalled bet
    const a = contributor('a', 'A', 500, { seat: 1 })
    const b = contributor('b', 'B', 200, { allIn: true, seat: 2 })

    const evaluations = [evalOf('a', 9), evalOf('b', 6)] // B wins
    const { result } = run([a, b], evaluations)

    expect(result.payouts.get('b')).toBe(400) // 200 matched x2
    expect(result.payouts.get('a')).toBe(300) // 300 uncalled, returned
    expect(result.returned.get('a')).toBe(300)

    const total = [...result.payouts.values()].reduce((x, y) => x + y, 0)
    expect(total).toBe(700)
  })

  it('Multiple all-ins same street, different stacks, chip conservation', () => {
    const p1 = contributor('p1', 'P1', 75, { allIn: true, seat: 1 })
    const p2 = contributor('p2', 'P2', 150, { allIn: true, seat: 2 })
    const p3 = contributor('p3', 'P3', 40, { allIn: true, seat: 3 })
    const p4 = contributor('p4', 'P4', 300, { allIn: true, seat: 4 })
    const players = [p1, p2, p3, p4]

    const evaluations = [
      evalOf('p1', 6),
      evalOf('p2', 4),
      evalOf('p3', 3),
      evalOf('p4', 8),
    ]
    const { layers, result } = run(players, evaluations)

    // Layers: 40x4=160 (all) | 35x3=105 (p1,p2,p4) | 75x2=150 (p2,p4) | 150x1=150 (p4 only → return)
    expect(layers).toHaveLength(4)

    expect(result.payouts.get('p3')).toBe(160) // best hand (rank 3), wins the only layer he covers
    expect(result.payouts.get('p2')).toBe(255) // rank 4: wins layer 2 (105, beats p1 & p4) + layer 3 (150, beats p4)
    expect(result.payouts.get('p1') || 0).toBe(0) // loses every layer
    expect(result.returned.get('p4')).toBe(150) // unmatched excess returns to P4
    expect(result.earned.get('p4') || 0).toBe(0) // P4 wins nothing

    const total = [...result.payouts.values()].reduce((x, y) => x + y, 0)
    expect(total).toBe(565) // 75+150+40+300
  })
})
