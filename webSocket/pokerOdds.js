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

  // Calcula probabilidades para un jugador contra oponentes con cartas aleatorias (desconocidas)
  calculateOddsForPlayer(
    myHand,
    totalActivePlayers,
    boardCards = [],
    simulations = 500,
  ) {
    if (!myHand || myHand.length < 2) {
      return { win: '0.0', tie: '0.0' }
    }
    const opponentCount = totalActivePlayers - 1
    if (opponentCount <= 0) {
      return { win: '100.0', tie: '0.0' }
    }

    let originalDeck = this.generateDeck()
    const currentBoard = [...boardCards]
    const usedCards = [...currentBoard, ...myHand]
    originalDeck = this.removeUsedCards(originalDeck, usedCards)

    let wins = 0
    let ties = 0

    for (let i = 0; i < simulations; i++) {
      const remainingDeck = shuffle([...originalDeck])

      // Completa el board hasta 5 cartas
      const simBoard = [...currentBoard]
      while (simBoard.length < 5) {
        simBoard.push(remainingDeck.pop())
      }

      // Reparte 2 cartas aleatorias del mazo restante a cada oponente
      const simulatedHands = [myHand]
      for (let j = 0; j < opponentCount; j++) {
        simulatedHands.push([remainingDeck.pop(), remainingDeck.pop()])
      }

      // Evalúa manos
      const evaluatedHands = simulatedHands.map((hand, idx) => {
        const best = PokerCore.betterHand(simBoard, hand)
        return { ...best, playerId: idx }
      })

      const winnerData = WinnerCore.Winner(evaluatedHands)

      if (!winnerData) {
        ties++
      } else if (Array.isArray(winnerData)) {
        if (winnerData.length === 1 && winnerData[0].playerId === 0) {
          wins++
        } else if (
          winnerData.length > 1 &&
          winnerData.some((w) => w.playerId === 0)
        ) {
          ties++
        }
      } else {
        if (winnerData.playerId === 0) {
          wins++
        }
      }
    }

    return {
      win: ((wins / simulations) * 100).toFixed(1),
      tie: ((ties / simulations) * 100).toFixed(1),
    }
  }
}

module.exports = PokerOddsCalculator
