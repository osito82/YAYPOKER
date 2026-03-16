import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePokerStore } from '../store/pokerStore'

describe('Poker Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default state', () => {
    const store = usePokerStore()
    expect(store.connected).toBe(false)
    expect(store.players).toEqual([])
    expect(store.pot).toBe(0)
    expect(store.activePlayerId).toBe(null)
    expect(store.bettingOptions).toEqual([])
  })

  it('updates state from socket messages (bettingCore)', () => {
    const store = usePokerStore()
    const message = JSON.stringify({
      message: {
        action: 'bettingCore-firstBetting',
        pot: 100,
        currentHighestBet: 20,
        data: {
          messageForId: 'player-1',
          action: ['call', 'raise', 'fold'],
        },
      },
    })

    store.setSocketMessage(message)

    expect(store.pot).toBe(100)
    expect(store.currentHighestBet).toBe(20)
    expect(store.activePlayerId).toBe('player-1')
    expect(store.bettingOptions).toEqual(['call', 'raise', 'fold'])
  })

  it('preserves turn when receiving non-action messages (like oddsUpdate)', () => {
    const store = usePokerStore()

    // Set initial turn
    store.setSocketMessage(
      JSON.stringify({
        message: {
          action: 'bettingCore-firstBetting',
          data: {
            messageForId: 'my-id',
            action: ['check', 'bet'],
          },
        },
      }),
    )

    expect(store.activePlayerId).toBe('my-id')

    // Receive oddsUpdate which is NOT in the clearing list
    store.setSocketMessage(
      JSON.stringify({
        message: {
          action: 'oddsUpdate',
          data: {
            odds: { win: 0.5, tie: 0.1 },
          },
        },
      }),
    )

    // Should still be my turn
    expect(store.activePlayerId).toBe('my-id')
    expect(store.bettingOptions).toEqual(['check', 'bet'])
  })

  it('clears turn when receiving public action confirmations without next turn info', () => {
    const store = usePokerStore()

    store.setSocketMessage(
      JSON.stringify({
        message: {
          action: 'bettingCore-firstBetting',
          data: {
            messageForId: 'my-id',
            action: ['check', 'bet'],
          },
        },
      }),
    )

    // Receive a public setBet message (no messageForId)
    store.setSocketMessage(
      JSON.stringify({
        message: {
          action: 'setBet',
          data: { displayMsg: 'Someone bet' },
        },
      }),
    )

    // It SHOULD clear because an action happened and we don't know who is next yet
    expect(store.activePlayerId).toBe(null)
    expect(store.bettingOptions).toEqual([])
  })

  it('updates winner info and clears turn', () => {
    const store = usePokerStore()
    store.activePlayerId = 'player-1'

    const winnerData = {
      winners: [{ name: 'Mimoso', amount: 500 }],
    }

    store.setSocketMessage(
      JSON.stringify({
        message: {
          action: 'winner',
          data: winnerData,
        },
      }),
    )

    expect(store.winnerInfo).toEqual(winnerData)
    expect(store.activePlayerId).toBe(null)
    expect(store.bettingOptions).toEqual([])
  })

  it('handles gameRestarted correctly', () => {
    const store = usePokerStore()
    store.pot = 500
    store.communityCards = ['Ah', 'Kh']
    store.currentHighestBet = 100

    store.setSocketMessage(
      JSON.stringify({
        message: {
          action: 'gameRestarted',
          data: { newGameId: 'new-id' },
        },
      }),
    )

    expect(store.pot).toBe(0)
    expect(store.communityCards).toEqual([])
    expect(store.currentHighestBet).toBe(0)
  })
})
