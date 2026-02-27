import { describe, it, expect } from 'vitest'

const {
  WinnerCore,
  selectBestRankHands,
  betterPair,
  betterStraight,
  betterThreeOfAKind,
  betteraFourOfaKind,
  betterFullHouse,
  betterTwoPairs,
} = require('../winnerCore')

// Datos de prueba
const handHighCard = {
  pokerHand: 'highCard',
  prizeRank: 10,
  cards: [['2H'], ['5D'], ['7S'], ['9C'], ['KH']],
  show: [['2H'], ['5D'], ['7S'], ['9C'], ['KH']],
}

const handPair = {
  pokerHand: 'pairs',
  prizeRank: 2,
  cards: [['5H'], ['5D'], ['7S'], ['9C'], ['KH']],
  show: [['5H', '5D']],
}

const handTwoPairs = {
  pokerHand: 'twoPairs',
  prizeRank: 3,
  cards: [['5H'], ['5D'], ['KH'], ['KC'], ['2S']],
  show: [
    ['5H', '5D'],
    ['KH', 'KC'],
  ],
}

const handThreeOfAKind = {
  pokerHand: 'threeOfAKind',
  prizeRank: 4,
  cards: [['7H'], ['7D'], ['7S'], ['9C'], ['KH']],
  show: [['7H', '7D', '7S']],
}

const handFourOfAKind = {
  pokerHand: 'fourOfaKind',
  prizeRank: 1,
  cards: [['QH'], ['QD'], ['QS'], ['QC'], ['2H']],
  show: [['QH', 'QD', 'QS', 'QC']],
}

describe('WinnerCore - Funciones auxiliares', () => {
  it('selectBestRankHands devuelve la mano con menor prizeRank', () => {
    const hands = [handHighCard, handPair, handFourOfAKind]
    const result = selectBestRankHands(hands)
    expect(result).toEqual([handFourOfAKind])
  })

  it('betterPair devuelve el valor más alto de un par', () => {
    const result = betterPair([['5H', '5D']])
    expect(result).toBe(5)
    const result2 = betterPair([['8H', '5D']])
    expect(result2).toBe(8)
    const result3 = betterPair([['KH', '2D']])
    expect(result3).toBe(13)
  })

  it('betterStraight devuelve la secuencia más alta', () => {
    const hands = [
      ['2H', '3D', '4S', '5C', '6H'],
      ['3H', '4D', '5S', '6C', '7H'],
    ]
    const result = betterStraight(hands)
    expect(result).toEqual(['7', '6', '5', '4', '3'])
  })

  it('betterThreeOfAKind devuelve los 3 mismos valores de la mejor tríada', () => {
    const hands = [['7H', '7D', '7S']]
    const result = betterThreeOfAKind(hands)
    expect(result).toEqual(['7', '7', '7'])
  })

  it('betteraFourOfaKind devuelve los 4 mismos valores de la mejor cuadra', () => {
    const hands = [['QH', 'QD', 'QS', 'QC']]
    const result = betteraFourOfaKind(hands)
    expect(result).toEqual(['Q', 'Q', 'Q', 'Q'])
  })

  it('betterFullHouse devuelve la mejor mano de full house', () => {
    const hands = [
      [
        ['7H', '7D', '7S'],
        ['KH', 'KC'],
      ],
      [
        ['6H', '6D', '6S'],
        ['AH', 'AC'],
      ],
    ]
    const result = betterFullHouse(hands)
    expect(result).toEqual(['7', '7', '7', 'K', 'K'])
  })

  it('betterTwoPairs devuelve la mejor mano de dos pares', () => {
    const pairs = [
      [
        ['5H', '5D'],
        ['KH', 'KC'],
      ],
      [
        ['3H', '3D'],
        ['AH', 'AC'],
      ],
    ]
    const result = betterTwoPairs(...pairs)

    expect(result).toEqual(['A', 'A', '3', '3'])
  })
})

describe('WinnerCore - Método Winner', () => {
  it('devuelve la mano ganadora cuando hay una sola mejor mano', () => {
    const result = WinnerCore.Winner([handHighCard, handFourOfAKind])
    expect(result).toEqual([handFourOfAKind])
  })

  it('resuelve empate con pares correctamente', () => {
    const pair1 = {
      pokerHand: 'pairs',
      prizeRank: 2,
      cards: [['5H'], ['5D'], ['7S'], ['9C'], ['KH']],
      show: [['5H', '5D']],
    }

    const pair2 = {
      pokerHand: 'pairs',
      prizeRank: 2,
      cards: [['6H'], ['6D'], ['7S'], ['9C'], ['KH']],
      show: [['6H', '6D']],
    }

    const result = WinnerCore.Winner([pair1, pair2])
    expect(result.show).toEqual([['6H', '6D']])
  })
})
