// pokerOddsCalculator.test.js
import { describe, it, expect } from 'vitest'
import PokerOddsCalculator from '../pokerOdds'

describe('PokerOddsCalculator', () => {
  const poker = new PokerOddsCalculator()

  it('should calculate odds for a simple scenario against random hands', () => {
    const myHand = ['Ah', 'Ad']
    const board = ['As', '5h', '9c']

    // Aces should have a very high win probability here against 1 random hand
    const result = poker.calculateOddsForPlayer(myHand, 2, board, 100)

    expect(Number(result.win)).toBeGreaterThan(80)
  })

  it('should handle a split pot scenario', () => {
    const myHand = ['Ad', '2d']
    const board = ['Ah', 'Kh', 'Qh', 'Jh', 'Th'] // Royal Flush on board

    const result = poker.calculateOddsForPlayer(myHand, 2, board, 10)

    // Everyone ties because board is a Royal Flush (the absolute best hand)
    expect(Number(result.tie)).toBe(100)
  })
})
