import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import WebSocket from 'ws'
const { server, validateAction } = require('../app')
const Torneo = require('../torneo')
const Match = require('../match')
const Player = require('../player')
const { MOCK_ACTIONS } = require('./fixtures')

// Guardrails against client messages the server must not obey, plus the
// timeout and spectator rules (see .agents/rules/game-engine.md).
describe('Client guardrails', () => {
  let port
  let serverInstance
  const clients = []

  beforeAll(() => {
    return new Promise((resolve) => {
      serverInstance = server.listen(0, () => {
        port = serverInstance.address().port
        resolve()
      })
    })
  })

  afterAll(() => {
    clients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN) c.close()
    })
    return new Promise((resolve) => serverInstance.close(resolve))
  })

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  const createClient = (name, secretCode, gameCode, extra = '') => {
    const ws = new WebSocket(
      `ws://localhost:${port}?gameCode=${gameCode}&playerName=${name}&secretCode=${secretCode}${extra}`,
    )
    clients.push(ws)
    const responses = []
    ws.on('message', (data) => responses.push(JSON.parse(data.toString())))
    const opened = new Promise((r) => ws.on('open', r))

    const waitAction = (action, timeout = 5000) =>
      new Promise((resolve, reject) => {
        const start = Date.now()
        const check = setInterval(() => {
          const found = responses.find((r) => r.message?.action === action)
          if (found) {
            clearInterval(check)
            resolve(found)
          } else if (Date.now() - start > timeout) {
            clearInterval(check)
            reject(new Error(`Timeout waiting for ${action} (${name})`))
          }
        }, 25)
      })

    const send = (payload) => ws.send(JSON.stringify(payload))
    return { name, ws, responses, opened, waitAction, send }
  }

  const startHeadsUp = async (gameCode, startPayload = {}) => {
    const host = createClient('Host', '1111', gameCode)
    const guest = createClient('Guest', '2222', gameCode)
    await Promise.all([host.opened, guest.opened])
    host.send(MOCK_ACTIONS.SIGN_UP(1000))
    await host.waitAction('signUp')
    guest.send(MOCK_ACTIONS.SIGN_UP(1000))
    await guest.waitAction('signUp')
    host.send({ action: 'startGame', ...startPayload })
    return { host, guest, match: Torneo.getMatch(gameCode) }
  }

  it('ignores a client dealtPrivateCards (no re-deal mid hand)', async () => {
    const gameCode = 'GUARD_DEAL_' + Math.random().toString(36).slice(2, 7)
    const { host, guest, match } = await startHeadsUp(gameCode)
    await host.waitAction('blindsPosted')
    await sleep(100)
    await host.waitAction('dealtPrivateCards')

    const before = match.players.map((p) => [...p.cards])
    guest.send({ action: 'dealtPrivateCards' })
    await sleep(300)

    expect(match.players.map((p) => p.cards)).toEqual(before)
    match.players.forEach((p) => expect(p.cards).toHaveLength(2))
  }, 15000)

  it('lets the host set blinds and initial stack only before the start', async () => {
    const gameCode = 'GUARD_SET_' + Math.random().toString(36).slice(2, 7)
    const { host, guest, match } = await startHeadsUp(gameCode, {
      smallBlind: 25,
      bigBlind: 50,
      initialStack: 3000,
    })
    await host.waitAction('blindsPosted')

    expect(match.smallBlind).toBe(25)
    expect(match.bigBlind).toBe(50)
    // Blinds are already posted (GAM-002): stack + blind = initial stack
    expect(match.players.map((p) => p.chips + p.currentBet)).toEqual([3000, 3000])

    // Mid game, neither the host nor another player can change the table
    host.send({ action: 'startGame', smallBlind: 1, bigBlind: 2 })
    guest.send({ action: 'startGame', bigBlind: 999999 })
    await sleep(300)
    expect(match.smallBlind).toBe(25)
    expect(match.bigBlind).toBe(50)
  }, 15000)

  it('rejects malformed table settings', () => {
    expect(validateAction('startGame', { smallBlind: 'x' })).not.toBeNull()
    expect(validateAction('startGame', { bigBlind: -5 })).not.toBeNull()
    expect(validateAction('startGame', { smallBlind: 40, bigBlind: 20 })).toContain(
      'Big blind must be >= small blind',
    )
    expect(validateAction('startGame', { initialStack: 10 })).not.toBeNull()
    expect(validateAction('startGame', { bots: 2, initialStack: 2000 })).toBeNull()
  })

  it('ignores nextRound from clients unless a tournament just ended', async () => {
    const gameCode = 'GUARD_NEXT_' + Math.random().toString(36).slice(2, 7)
    const { host, match } = await startHeadsUp(gameCode)
    await host.waitAction('blindsPosted')

    match.waitingForNextRound = true
    host.send({ action: 'nextRound' })
    await sleep(200)
    expect(match.waitingForNextRound).toBe(true)
    match.waitingForNextRound = false
  }, 15000)

  it('keeps spectators out of the seats and does not disconnect players', async () => {
    const gameCode = 'GUARD_SPEC_' + Math.random().toString(36).slice(2, 7)
    const player = createClient('Seated', '3333', gameCode)
    await player.opened
    player.send(MOCK_ACTIONS.SIGN_UP(1000))
    await player.waitAction('signUp')

    const specA = createClient('Spectator_1', 'spectator', gameCode, '&role=guest')
    const specB = createClient('Spectator_2', 'spectator', gameCode, '&role=guest')
    await Promise.all([specA.opened, specB.opened])
    specA.send(MOCK_ACTIONS.SIGN_UP(1000))
    specB.send(MOCK_ACTIONS.SIGN_UP(1000))
    await sleep(300)

    const match = Torneo.getMatch(gameCode)
    expect(match.players.map((p) => p.name)).toEqual(['Seated'])

    // Both spectators keep receiving table broadcasts
    const late = createClient('Late', '4444', gameCode)
    await late.opened
    late.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([specA.waitAction('signUp'), specB.waitAction('signUp')])
  }, 15000)

  it('ignores client stacks outside tests', () => {
    const match = new Match('STACK_TEST', 'g1')
    const original = process.env.NODE_ENV
    try {
      process.env.NODE_ENV = 'production'
      expect(match.lobby.startingStack({ totalChips: 1e9 })).toBe(1000)
      process.env.NODE_ENV = 'test'
      expect(match.lobby.startingStack({ totalChips: 300 })).toBe(300)
    } finally {
      process.env.NODE_ENV = original
    }
  })
})

describe('Turn timeout', () => {
  const setupTurn = ({ highestBet, playerBet }) => {
    const match = new Match('TIMEOUT_' + Math.random(), 'g1')
    match.removeAllListeners('CONTINUE')
    const a = new Player('g1', 'A', '1', 1000, [], 'id-a', 1)
    const b = new Player('g1', 'B', '2', 1000, [], 'id-b', 2)
    ;[a, b].forEach((p) => {
      p.setConnected(true)
      p.setStarted(true)
      p.currentBet = 0
    })
    match.players.push(a, b)
    match.stepChecker.grantStep('startGame')
    match.stepChecker.grantStep('blindsBetting')
    match.dealer.setCurrentHighestBet(highestBet)
    a.currentBet = playerBet
    match.activePlayerId = a.id
    return { match, a }
  }

  it('auto-checks when there is nothing to call', () => {
    const { match, a } = setupTurn({ highestBet: 0, playerBet: 0 })
    match.actions.autofold()
    expect(a.folded).toBe(false)
    expect(a.lastAction).toBe('Check (timeout)')
    expect(a.consecutiveAutofolds).toBe(1)
  })

  it('auto-folds when facing a bet', () => {
    const { match, a } = setupTurn({ highestBet: 50, playerBet: 0 })
    match.actions.autofold()
    expect(a.folded).toBe(true)
  })
})

describe('Idle table', () => {
  it('deals no hand while everyone sits out and resumes when one returns', () => {
    vi.useFakeTimers()
    try {
      const match = new Match('IDLE_' + Math.random(), 'g1')
      const a = new Player('g1', 'A', '1', 1000, [], 'id-a', 1)
      const b = new Player('g1', 'B', '2', 1000, [], 'id-b', 2)
      ;[a, b].forEach((p) => {
        p.setConnected(true)
        p.isSittingOut = true
      })
      match.players.push(a, b)

      match.waitingForNextRound = true
      match.nextRound()
      expect(match.idleAllSittingOut).toBe(true)
      expect(match.handCount).toBe(0)

      match.actions.setSitOut({ id: 'id-a' }, false)
      expect(match.idleAllSittingOut).toBe(false)
      expect(match.handCount).toBe(1)
    } finally {
      vi.clearAllTimers()
      vi.useRealTimers()
    }
  })
})
