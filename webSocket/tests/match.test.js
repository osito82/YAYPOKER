import { describe, it, expect, beforeEach, vi } from 'vitest'

// 🔥 Mocks de dependencias
vi.mock('../player', () => {
  const PlayerMock = vi
    .fn()
    .mockImplementation((gameId, name, secretCode, totalChips, cards, id) => {
      return {
        id,
        name,
        secretCode,
        totalChips,
        cards: [],
        connected: true,
        currentBet: 0,
        handContribution: 0,
        isStarted: false,
        isAllIn: false,
        setStarted: vi.fn(function (status) {
          this.isStarted = !!status
        }),
        setConnected: vi.fn(),
        setBet: vi.fn((amount) => amount > 0),
        getCurrentBet: vi.fn(function () {
          return this.currentBet
        }),
        setCurrentBet: vi.fn(function (amount) {
          this.currentBet = amount
        }),
        setTotalBet: vi.fn(function (amount) {
          this.currentBet = amount
          return true
        }),
        getHandContribution: vi.fn(function () {
          return this.handContribution
        }),
        setHandContribution: vi.fn(function (amount) {
          this.handContribution = amount
        }),
        getPlayerName: vi.fn(() => name),
        getPlayerId: vi.fn(() => id),
        checkPrize: vi.fn(() => ({})),
        setCurrentPrize: vi.fn(),
        getCurrentPrize: vi.fn(() => ({})),
        toJson: vi.fn(() => ({ name, id, secretCode })),
        setFolded: vi.fn(),
        setLastAction: vi.fn(),
        getCards: vi.fn(() => []),
        countCards: vi.fn(() => 0),
      }
    })
  return PlayerMock
})

vi.mock('../dealer', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      talkToAllPlayersOnTable: vi.fn(),
      talkToPLayerById: vi.fn(),
      talkToSocketById: vi.fn(),
      talkToPlayerBUTid: vi.fn(),
      dealCardsEachPlayer: vi.fn(),
      dealCardsDealer: vi.fn(),
      setPot: vi.fn(),
      getPot: vi.fn(() => 100),
      hasMinimumPlayers: vi.fn(() => true),
      hasPlayerBetByNumber: vi.fn(() => true),
      getPlayerByNumber: vi.fn(() => ({ id: '1', name: 'P1' })),
      hasAllPlayersBet: vi.fn(() => false),
      hasPlayerBet: vi.fn(() => false),
      getDealerCards: vi.fn(() => ['A', 'K', 'Q']),
      allPlayersCheck: vi.fn(() => false),
      clearActedPlayers: vi.fn(),
      getFinalHands: vi.fn(() => []),
      setFinalHands: vi.fn(),
      getChipsFromPlayers: vi.fn(),
      updatePlayerId: vi.fn(),
      getCurrentHighestBet: vi.fn(() => 0),
    })),
  }
})

vi.mock('../stepChecker', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkStep: vi.fn(() => false),
      grantStep: vi.fn(),
      revokeStep: vi.fn(),
      getChecker: vi.fn(() => ({})),
      gameFlow: {},
    })),
  }
})

vi.mock('../communicator', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      msgBuilder: vi.fn(),
      getMsg: vi.fn(() => 'mock-msg'),
      getFullInfo: vi.fn(() => ({})),
    })),
  }
})

vi.mock('../winnerCore', () => ({
  WinnerCore: {
    Winner: vi.fn(() => 'Player1'),
  },
}))

vi.mock('radash', () => ({
  isEmpty: vi.fn(() => false),
  generateUniqueId: vi.fn(() => 'unique-id'),
}))

vi.mock('osolog', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      Template: vi.fn().mockReturnThis(),
      R: vi.fn(),
    })),
  }
})

vi.mock('../sockets', () => ({
  sendToPlayer: vi.fn(),
  broadcastToTorneo: vi.fn(),
}))

const Match = require('../match')
const Socket = require('../sockets')

describe('Match Class', () => {
  let match
  const torneoId = 'T1'
  const gameId = 'G1'

  beforeEach(() => {
    match = new Match(torneoId, gameId)
    vi.clearAllMocks()
  })

  it('should initialize correctly', () => {
    expect(match.torneoId).toBe(torneoId)
    expect(match.gameId).toBe(gameId)
    expect(match.players).toEqual([])
  })

  describe('signUp', () => {
    it('should add a new player', () => {
      const data = { name: 'Alice', totalChips: 1000, secretCode: '1234' }
      const thisSocket = { id: 'S1', name: 'Alice', secretCode: '1234' }

      match.lobby.signUp(data, thisSocket)

      expect(match.players.length).toBe(1)
      expect(match.players[0].name).toBe('Alice')
      expect(match.players[0].secretCode).toBe('1234')
    })

    it('should handle name collision by appending a number', () => {
      const p1Data = { name: 'Alice', totalChips: 1000, secretCode: '1111' }
      const p1Socket = { id: 'S1', name: 'Alice', secretCode: '1111' }
      match.lobby.signUp(p1Data, p1Socket)

      const p2Data = { name: 'Alice', totalChips: 1000, secretCode: '2222' }
      const p2Socket = { id: 'S2', name: 'Alice', secretCode: '2222' }
      match.lobby.signUp(p2Data, p2Socket)

      expect(match.players.length).toBe(2)
      expect(match.players[0].name).toBe('Alice')
      expect(match.players[1].name).toBe('Alice-1')
    })

    it('should reconnect an existing player by secretCode', () => {
      const data = { name: 'Alice', totalChips: 1000, secretCode: '1234' }
      const s1 = { id: 'S1', name: 'Alice', secretCode: '1234' }
      match.lobby.signUp(data, s1)

      const s2 = { id: 'S2', name: 'Alice', secretCode: '1234' }
      match.lobby.signUp(data, s2)

      expect(match.players.length).toBe(1)
      expect(match.players[0].id).toBe('S2')
      // Note: setConnected(true) is called, verified by logs in Match.signUp
    })
  })

  describe('fold', () => {
    it('should allow a player to fold on their turn', () => {
      const socket = { id: 'S1', name: 'Alice', secretCode: '1234' }
      const player = {
        id: 'S1',
        name: 'Alice',
        folded: false,
        setLastAction: vi.fn(),
        setFolded: vi.fn(),
        setConnected: vi.fn(),
        setStarted: vi.fn(),
        getHandContribution: vi.fn(() => 0),
        setHandContribution: vi.fn(),
        toJson: vi.fn(() => ({ name: 'Alice', id: 'S1' })),
        getCards: vi.fn(() => []),
      }
      match.players.push(player)
      match.activePlayerId = 'S1'

      match.actions.fold(socket)

      expect(player.setFolded).toHaveBeenCalledWith(true)
      expect(match.playersFold).toContain('Alice')
    })

    it('should not allow folding if it is not the players turn', () => {
      const socket = { id: 'S1', name: 'Alice' }
      const player = {
        id: 'S1',
        name: 'Alice',
        folded: false,
        setFolded: vi.fn(),
      }
      match.players.push(player)
      match.activePlayerId = 'S2'

      match.actions.fold(socket)

      expect(player.setFolded).not.toHaveBeenCalled()
    })
  })
})
