const PokerCore = require('./pokerCore')
const { WinnerCore } = require('./winnerCore')
const { shuffle } = require('./utils')

class PokerOddsCalculator {
  constructor(deckSize = 52) {
    this.suits = ['h', 'd', 'c', 's']
    this.ranks = [
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'T',
      'J',
      'Q',
      'K',
      'A',
    ]
    this.deckSize = deckSize
  }

  // Genera un mazo completo
  generateDeck() {
    const deck = []
    for (const r of this.ranks) {
      for (const s of this.suits) {
        deck.push(r + s)
      }
    }
    return deck
  }

  // Elimina cartas usadas del mazo
  removeUsedCards(deck, usedCards) {
    const usedSet = new Set(usedCards)
    return deck.filter((c) => !usedSet.has(c))
  }

  // Calcula probabilidades usando Monte Carlo
  calculateOdds(playerHands, boardCards = [], simulations = 500) {
    let originalDeck = this.generateDeck()
    const currentBoard = [...boardCards]
    const usedCards = [...currentBoard, ...playerHands.flat()]
    originalDeck = this.removeUsedCards(originalDeck, usedCards)

    const wins = Array(playerHands.length).fill(0)
    let ties = 0

    for (let i = 0; i < simulations; i++) {
      const remainingDeck = shuffle([...originalDeck])

      // Completa el board hasta 5 cartas
      const simBoard = [...currentBoard]
      while (simBoard.length < 5) {
        simBoard.push(remainingDeck.pop())
      }

      // Evalúa manos
      const evaluatedHands = playerHands.map((hand, idx) => {
        const best = PokerCore.betterHand(simBoard, hand)
        return { ...best, playerId: idx }
      })

      const winnerData = WinnerCore.Winner(evaluatedHands)

      if (!winnerData) {
        ties++
      } else if (Array.isArray(winnerData)) {
        if (winnerData.length === 1) {
          wins[winnerData[0].playerId]++
        } else {
          ties++
        }
      } else {
        wins[winnerData.playerId]++
      }
    }

    return {
      winProbabilities: wins.map((w) => ((w / simulations) * 100).toFixed(1)),
      tieProbability: ((ties / simulations) * 100).toFixed(1),
    }
  }
}

module.exports = PokerOddsCalculator
