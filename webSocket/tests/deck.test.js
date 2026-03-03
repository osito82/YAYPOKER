import { describe, it, expect } from 'vitest'
const Deck = require('../deck')

describe('Deck Class', () => {

  it('should have 52 cards in static cards', () => {
    expect(Deck.cards.length).toBe(52)
  })

  it('should contain unique cards only', () => {
    const uniqueCards = new Set(Deck.cards)
    expect(uniqueCards.size).toBe(52)
  })

  it('originalDeck should be a shuffled copy of cards', () => {
    expect(Deck.originalDeck).not.toBe(Deck.cards) 
    expect(Deck.originalDeck.sort()).toEqual(Deck.cards.sort()) // mismas cartas
  })

  describe('shuffleDeck', () => {
    it('should return a new array', () => {
      const shuffled = Deck.shuffleDeck(Deck.cards)
      expect(shuffled).not.toBe(Deck.cards)
      expect(shuffled.length).toBe(52)
    })

    it('should not lose or duplicate cards after shuffling', () => {
      const shuffled = Deck.shuffleDeck(Deck.cards)
      const sortedOriginal = [...Deck.cards].sort()
      const sortedShuffled = [...shuffled].sort()
      expect(sortedShuffled).toEqual(sortedOriginal)
    })

    it('should shuffle differently on consecutive calls', () => {
      const shuffled1 = Deck.shuffleDeck(Deck.cards)
      const shuffled2 = Deck.shuffleDeck(Deck.cards)
      // Podría teóricamente ser igual, pero improbable, así que usamos algún criterio
      const identical = shuffled1.every((c, i) => c === shuffled2[i])
      expect(identical).toBe(false)
    })

    it('should shuffle multiple times when times > 1', () => {
      const times = 3
      const shuffled = Deck.shuffleDeck(Deck.cards, times)
      expect(shuffled.length).toBe(52)
      expect([...new Set(shuffled)].length).toBe(52)
    })

    it('should not change the original deck array', () => {
      const originalCopy = [...Deck.cards]
      Deck.shuffleDeck(Deck.cards)
      expect(Deck.cards).toEqual(originalCopy)
    })
  })
})