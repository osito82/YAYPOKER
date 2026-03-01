// pokerOddsCalculator.test.js
import { describe, it, expect } from 'vitest'
import PokerOddsCalculator from '../pokerOdds'

describe('PokerOddsCalculator', () => {
  const poker = new PokerOddsCalculator()

  it('should calculate odds for a simple scenario', () => {
    const playerHands = [
      ['Ah', 'Ad'],
      ['2h', '7d'],
    ]
    const board = ['As', '5h', '9c']

    // Aces should have a very high win probability here
    const result = poker.calculateOdds(playerHands, board, 100)

    expect(Number(result.winProbabilities[0])).toBeGreaterThan(80)
    expect(Number(result.winProbabilities[1])).toBeLessThan(20)
  })

  it('should handle a split pot scenario', () => {
    const playerHands = [
      ['Ad', '2d'],
      ['As', '3d'],
    ] // No hearts here
    const board = ['Kh', 'Qh', 'Jh', 'Th', '9h'] // Straight Flush on board

    const result = poker.calculateOdds(playerHands, board, 10)

    // Everyone ties because board is the best hand for both
    expect(Number(result.tieProbability)).toBe(100)
  })
})
