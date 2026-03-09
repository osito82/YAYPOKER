import { describe, it, expect, beforeEach, vi } from 'vitest'

// 🔹 Mock de osolog
vi.mock('osolog', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      Template: () => ({
        R: () => {},
      }),
    })),
  }
})

const Dealer = require('../dealer')

vi.mock('../sockets', () => ({
  getSocketsByTorneo: vi.fn(),
  getSocket: vi.fn(),
}))

const Socket = require('../sockets')

describe('Dealer Class', () => {
  let dealer
  let players
  let deck

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()
    deck = ['A♠', 'K♠', 'Q♠', 'J♠', '10♠']

    players = [
      createMockPlayer('p1', true, false),
      createMockPlayer('p2', true, false),
    ]

    dealer = new Dealer('game1', players, deck, 'torneo1', 0, [])
  })

  function createMockPlayer(id, connected = true, folded = false) {
    return {
      id,
      name: id,
      gameId: 'game1',
      chips: 100,
      connected,
      folded,
      currentBet: 0,
      cards: [],
      getCurrentBet() {
        return this.currentBet
      },
      getCurrentPrize: vi.fn(() => ({ hand: 'pair' })),
      giveChipsToDealer: vi.fn(),
      countCards() {
        return this.cards.length
      },
      setCard(card) {
        this.cards.push(card)
      },
    }
  }

  // ================================
  // 🟢 BET STATE
  // ================================

  it('should set and get current highest bet', () => {
    dealer.setCurrentHighestBet(200)
    expect(dealer.getCurrentHighestBet()).toBe(200)
  })

  it('should set and get last raiser', () => {
    dealer.setLastRaiser('p1')
    expect(dealer.getLastRaiser()).toBe('p1')
  })

  // ================================
  // 🟢 POT
  // ================================

  it('should add chips to pot', () => {
    dealer.setPot(100)
    dealer.setPot(50)
    expect(dealer.getPot()).toBe(150)
  })

  // ================================
  // 🟢 CHECK LOGIC
  // ================================

  it('should mark player as acted', () => {
    dealer.setPlayerActed('p1')
    expect(dealer.getPlayersActed()).toContain('p1')
  })

  it('should detect when all players acted with same bet', () => {
    players[0].currentBet = 100
    players[1].currentBet = 100

    dealer.setPlayerActed('p1')
    dealer.setPlayerActed('p2')

    expect(dealer.allPlayersCheck()).toBe(true)
  })

  it('should return false if not all players checked', () => {
    players[0].currentBet = 100
    players[1].currentBet = 100

    dealer.setPlayerActed('p1')

    expect(dealer.allPlayersCheck()).toBe(false)
  })

  // ================================
  // 🟢 DEAL CARDS
  // ================================

  it('should deal cards to players', () => {
    dealer.dealCardsEachPlayer(1)

    expect(players[0].cards.length).toBe(1)
    expect(players[1].cards.length).toBe(1)
    expect(deck.length).toBe(3)
  })

  it('should deal cards to dealer table', () => {
    dealer.dealCardsDealer(2)

    expect(dealer.getDealerCards().length).toBe(2)
    expect(deck.length).toBe(3)
  })

  // ================================
  // 🟢 FINAL HANDS
  // ================================

  it('should build final hands', () => {
    dealer.setFinalHands()
    const finalHands = dealer.getFinalHands()

    expect(finalHands.length).toBe(2)
    expect(finalHands[0]).toHaveProperty('name', 'p1')
    expect(finalHands[0]).toHaveProperty('chips', 100)
  })

  // ================================
  // 🟢 PLAYERS
  // ================================

  it('should return player by number', () => {
    expect(dealer.getPlayerByNumber(1).id).toBe('p1')
  })

  it('should return player by id', () => {
    expect(dealer.getPlayerById('p2').id).toBe('p2')
  })

  it('should detect minimum players', () => {
    expect(dealer.hasMinimumPlayers()).toBe(true)
  })

  it('should detect if all players bet', () => {
    players[0].currentBet = 50
    players[1].currentBet = 100

    expect(dealer.hasAllPlayersBet()).toBe(true)
  })

  // ================================
  // 🟢 SOCKET COMMUNICATION
  // ================================
  it('should send message to all sockets', () => {
    const sendMock = vi.fn()

    // Definimos el comportamiento del mock específicamente para este test
    vi.spyOn(Socket, 'getSocketsByTorneo').mockReturnValue(
      new Map([
        ['p1', { socket: { send: sendMock, readyState: 1 } }],
        ['p2', { socket: { send: sendMock, readyState: 1 } }],
      ]),
    )

    dealer.talkToAllSockets('hello')

    expect(Socket.getSocketsByTorneo).toHaveBeenCalledWith('torneo1')
    expect(sendMock).toHaveBeenCalledTimes(2)
    expect(sendMock).toHaveBeenCalledWith(JSON.stringify({ message: 'hello' }))
  })

  it('should send message to a specific socket by id', () => {
    const sendMock = vi.fn()
    vi.spyOn(Socket, 'getSocket').mockReturnValue({
      socket: { send: sendMock, readyState: 1 },
    })

    dealer.talkToSocketById('p1', 'direct message')

    expect(Socket.getSocket).toHaveBeenCalledWith('torneo1', 'p1')
    expect(sendMock).toHaveBeenCalledWith(
      JSON.stringify({ message: 'direct message' }),
    )
  })

  // ================================
  // 🟢 jugadores folded / disconnected
  // ================================

  it('should NOT deal cards to folded or disconnected players', () => {
    const deck = ['A♠', 'K♠', 'Q♠']

    const players = [
      createMockPlayer('active', true, false),
      createMockPlayer('folded', true, true),
      createMockPlayer('offline', false, false),
    ]

    const dealer = new Dealer('game1', players, deck, 'torneo1', 0, [])

    dealer.dealCardsEachPlayer(1)

    expect(players[0].cards.length).toBe(1) // activo recibe carta
    expect(players[1].cards.length).toBe(0) // folded NO recibe
    expect(players[2].cards.length).toBe(0) // disconnected NO recibe
  })

  it('should ignore folded and disconnected players in allPlayersCheck', () => {
    const players = [
      createMockPlayer('p1', true, false),
      createMockPlayer('p2', true, true), // folded
      createMockPlayer('p3', false, false), // disconnected
    ]

    players[0].currentBet = 100

    const dealer = new Dealer('game1', players, [], 'torneo1', 0, [])

    dealer.setPlayerActed('p1')

    expect(dealer.allPlayersCheck()).toBe(true)
  })

  it('should ignore folded and disconnected players in hasAllPlayersBet', () => {
    const players = [
      createMockPlayer('p1', true, false),
      createMockPlayer('p2', true, true), // folded
      createMockPlayer('p3', false, false), // disconnected
    ]

    players[0].currentBet = 50

    const dealer = new Dealer('game1', players, [], 'torneo1', 0, [])

    expect(dealer.hasAllPlayersBet()).toBe(true)
  })

  it('should require at least 2 connected players', () => {
    const players = [
      createMockPlayer('p1', true, false),
      createMockPlayer('p2', false, false),
    ]

    const dealer = new Dealer('game1', players, [], 'torneo1', 0, [])

    expect(dealer.hasMinimumPlayers()).toBe(false)
  })
// ================================
// 🟢 DEALING ORDER AND MULTIPLE GAMES
// ================================

describe('Card dealing logic', () => {

  // --------------------------------
  // 1 PLAYER
  // --------------------------------
  it('deals two cards to a single player in order', () => {
    const players = [createMockPlayer('p1')]
    const deck = ['C1', 'C2', 'C3', 'C4']

    const dealer = new Dealer('game1', players, deck, 'torneo1', 0, [])

    dealer.dealCardsEachPlayer(2)

    // Player should simply receive the first two cards
    expect(players[0].cards).toEqual(['C1', 'C2'])
  })

  // --------------------------------
  // 5 PLAYERS
  // --------------------------------
  it('deals cards in round-robin order with 5 players', () => {
    const players = Array.from({ length: 5 }, (_, i) =>
      createMockPlayer(`p${i + 1}`)
    )

    const deck = Array.from({ length: 52 }, (_, i) => `C${i + 1}`)

    const dealer = new Dealer('game1', players, deck, 'torneo1', 0, [])

    dealer.dealCardsEachPlayer(2)

    // First round
    expect(players[0].cards[0]).toBe('C1')
    expect(players[1].cards[0]).toBe('C2')
    expect(players[2].cards[0]).toBe('C3')
    expect(players[3].cards[0]).toBe('C4')
    expect(players[4].cards[0]).toBe('C5')

    // Second round
    expect(players[0].cards[1]).toBe('C6')
    expect(players[1].cards[1]).toBe('C7')
  })

  // --------------------------------
  // 9 PLAYERS
  // --------------------------------
  it('deals cards correctly with a full table of 9 players', () => {
    const players = Array.from({ length: 9 }, (_, i) =>
      createMockPlayer(`p${i + 1}`)
    )

    const deck = Array.from({ length: 52 }, (_, i) => `C${i + 1}`)

    const dealer = new Dealer('game1', players, deck, 'torneo1', 0, [])

    dealer.dealCardsEachPlayer(2)

    // First player should receive card 1 and card 10
    expect(players[0].cards).toEqual(['C1', 'C10'])

    // Second player should receive card 2 and card 11
    expect(players[1].cards).toEqual(['C2', 'C11'])
  })

  // --------------------------------
  // DEALER COMMUNITY CARDS
  // --------------------------------
  it('deals community cards in correct order (flop, turn, river)', () => {
    const deck = ['D1', 'D2', 'D3', 'D4', 'D5']

    const dealer = new Dealer('game1', [], deck, 'torneo1', 0, [])

    // Flop
    dealer.dealCardsDealer(3)
    expect(dealer.getDealerCards()).toEqual(['D1', 'D2', 'D3'])

    // Turn
    dealer.dealCardsDealer(1)
    expect(dealer.getDealerCards()).toEqual(['D1', 'D2', 'D3', 'D4'])

    // River
    dealer.dealCardsDealer(1)
    expect(dealer.getDealerCards()).toEqual(['D1', 'D2', 'D3', 'D4', 'D5'])
  })

  // --------------------------------
  // MULTIPLE GAMES CONSISTENCY
  // --------------------------------
  it('keeps dealing logic consistent across multiple games', () => {
    const players = [createMockPlayer('p1'), createMockPlayer('p2')]

    for (let game = 1; game <= 5; game++) {

      const deck = Array.from(
        { length: 20 },
        (_, i) => `G${game}-C${i + 1}`
      )

      const dealer = new Dealer(
        `game${game}`,
        players,
        deck,
        'torneo1',
        0,
        []
      )

      // reset player cards
      players.forEach((p) => (p.cards = []))

      dealer.dealCardsEachPlayer(2)

      expect(players[0].cards).toEqual([
        `G${game}-C1`,
        `G${game}-C3`,
      ])

      expect(players[1].cards).toEqual([
        `G${game}-C2`,
        `G${game}-C4`,
      ])

      dealer.dealCardsDealer(3)

      expect(dealer.getDealerCards()).toEqual([
        `G${game}-C5`,
        `G${game}-C6`,
        `G${game}-C7`,
      ])
    }
  })

})
})
