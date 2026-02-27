import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as utils from '../utils'
import PokerCore from '../pokerCore'

// Mock the utils module
vi.mock('../utils', () => ({
  cardsToSingleNumValsArray: vi.fn(),
  numberToCard: vi.fn(),
}))

describe('PokerCore Hand Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ----------------------
  // 🔹 Royal Flush
  // ----------------------
  it('detects a royal flush', () => {
    const cards = ['10H', 'JH', 'QH', 'KH', 'AH']
    vi.mocked(utils.cardsToSingleNumValsArray).mockReturnValue([
      10, 11, 12, 13, 14,
    ])
    vi.mocked(utils.numberToCard).mockImplementation((n) => {
      const map = { 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }
      return map[n]
    })

    const result = PokerCore.betterHand([], cards)
    expect(result.pokerHand).toBe('royalFlush')
    expect(result.prizeRank).toBe(1)
  })

  // ----------------------
  // 🔹 Straight Flush
  // ----------------------
  it('detects a straight flush', () => {
    const cards = ['5H', '6H', '7H', '8H', '9H']
    vi.mocked(utils.cardsToSingleNumValsArray).mockReturnValue([5, 6, 7, 8, 9])

    const result = PokerCore.betterHand([], cards)
    expect(result.pokerHand).toBe('straightFlush')
    expect(result.prizeRank).toBe(2)
  })

  // ----------------------
  // 🔹 Four of a Kind
  // ----------------------
  it('detects four of a kind', () => {
    const cards = ['9H', '9D', '9S', '9C', '2H']
    const result = PokerCore.betterHand([], cards)
    expect(result.pokerHand).toBe('fourOfaKind')
    expect(result.show.length).toBe(4)
  })

  // ----------------------
  // 🔹 Full House
  // ----------------------
  it('detects full house', () => {
    const cards = ['10H', '10D', '10S', '9C', '9D']
    const result = PokerCore.betterHand([], cards)
    expect(result.pokerHand).toBe('fullHouse')
  })

  // ----------------------
  // 🔹 Flush
  // ----------------------
  it('detects flush', () => {
    const cards = ['2H', '5H', '8H', 'JH', 'KH']
    const result = PokerCore.betterHand([], cards)
    expect(result.pokerHand).toBe('flush')
    expect(result.prizeRank).toBe(5)
  })

  // ----------------------
  // 🔹 Straight
  // ----------------------
  it('detects straight', () => {
    const cards = ['3H', '4D', '5S', '6C', '7H']
    vi.mocked(utils.cardsToSingleNumValsArray).mockReturnValue([3, 4, 5, 6, 7])
    const result = PokerCore.betterHand([], cards)
    expect(result.pokerHand).toBe('straight')
    expect(result.prizeRank).toBe(6)
  })

  // ----------------------
  // 🔹 Three of a Kind
  // ----------------------
  it('detects three of a kind', () => {
    const cards = ['QH', 'QD', 'QS', '2C', '5H']
    const result = PokerCore.betterHand([], cards)
    expect(result.pokerHand).toBe('threeOfAKind')
    expect(result.show.length).toBe(3)
  })

  // ----------------------
  // 🔹 Two Pairs
  // ----------------------
  it('detects two pairs', () => {
    const cards = ['KH', 'KD', '5S', '5C', '2H']
    const result = PokerCore.betterHand([], cards)
    expect(result.pokerHand).toBe('twoPairs')
    expect(result.show.length).toBe(2)
  })

  // ----------------------
  // 🔹 One Pair
  // ----------------------
  it('detects one pair', () => {
    const cards = ['AH', 'AD', '7S', '3C', '2H']
    const result = PokerCore.betterHand([], cards)
    expect(result.pokerHand).toBe('pairs')
    expect(result.show.length).toBe(2)
  })

  // ----------------------
  // 🔹 High Card
  // ----------------------
  it('detects high card', () => {
    const cards = ['2H', '4D', '6S', '8C', 'KH']
    vi.mocked(utils.cardsToSingleNumValsArray).mockReturnValue([2, 4, 6, 8, 13])
    vi.mocked(utils.numberToCard).mockReturnValue('K')
    const result = PokerCore.betterHand([], cards)
    expect(result.pokerHand).toBe('highCard')
    expect(result.show).toBe('KH')
  })

  // ----------------------
  // 🔹 Multiple hands scenario
  // ----------------------
  it('chooses the best hand among all combinations', () => {
    const dealerCards = ['10H', 'JH']
    const playerCards = ['QH', 'KH', 'AH']
    vi.mocked(utils.cardsToSingleNumValsArray).mockReturnValue([
      10, 11, 12, 13, 14,
    ])
    vi.mocked(utils.numberToCard).mockReturnValue('A')

    const result = PokerCore.betterHand(dealerCards, playerCards)
    expect(result.pokerHand).toBe('royalFlush')
    expect(result.prizeRank).toBe(1)
  })
})
