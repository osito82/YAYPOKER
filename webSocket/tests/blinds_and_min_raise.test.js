import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'
const { server } = require('../app')
const Torneo = require('../torneo')
const Match = require('../match')
const { MOCK_ACTIONS } = require('./fixtures')

// Regressions found in the production logs of 2026-10-09 / 2026-10-16:
// blinds went up after the first hand, a raise to 30 over a 20 big blind was
// accepted (min raise was BB - SB), and increased blinds came out as 13/25.
describe('Blinds and minimum raise', () => {
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

  const createClient = (name, secretCode, gameCode) => {
    const ws = new WebSocket(
      `ws://localhost:${port}?gameCode=${gameCode}&playerName=${name}&secretCode=${secretCode}`,
    )
    clients.push(ws)
    const responses = []
    ws.on('message', (data) => responses.push(JSON.parse(data.toString())))
    const opened = new Promise((r) => ws.on('open', r))

    const waitFor = (predicate, label, timeout = 5000) =>
      new Promise((resolve, reject) => {
        const start = Date.now()
        const check = setInterval(() => {
          const found = responses.find(predicate)
          if (found) {
            clearInterval(check)
            resolve(found)
          } else if (Date.now() - start > timeout) {
            clearInterval(check)
            reject(new Error(`Timeout waiting for ${label} (${name})`))
          }
        }, 25)
      })
    const waitAction = (action, timeout) =>
      waitFor((r) => r.message?.action === action, action, timeout)

    const send = (payload) => ws.send(JSON.stringify(payload))
    return { name, ws, responses, opened, waitFor, waitAction, send }
  }

  it('rejects a raise below one big blind and keeps blinds after hand one', async () => {
    const gameCode = 'BLINDS_' + Math.random().toString(36).slice(2, 7)
    const host = createClient('Host', '5151', gameCode)
    const guest = createClient('Guest', '6262', gameCode)
    await Promise.all([host.opened, guest.opened])
    host.send(MOCK_ACTIONS.SIGN_UP(1000))
    await host.waitAction('signUp')
    guest.send(MOCK_ACTIONS.SIGN_UP(1000))
    await guest.waitAction('signUp')
    host.send({ action: 'startGame' })

    await host.waitAction('blindsPosted')

    const match = Torneo.getMatch(gameCode)
    // Heads-up: the small blind acts first pre-flop
    await host.waitFor(
      (r) =>
        r.message?.action === 'bettingCore-firstBetting' &&
        r.message.type === 'private',
      'SB turn',
    )
    expect(match.dealer.getLastRaiseAmount()).toBe(20)

    // Raise to 30 is a raise of 10 < big blind 20: rejected
    host.send({ action: 'setRise', chipsToRiseBet: 30 })
    const rejected = await host.waitAction('actionRejected')
    expect(rejected.message.data.displayMsg).toContain('minimum raise is 40')

    // Raise to 40 is legal
    host.send({ action: 'setRise', chipsToRiseBet: 40 })
    await guest.waitFor(
      (r) => r.message?.action === 'setBet' && r.message.data?.bet === 40,
      'raise to 40',
    )

    // Guest folds: hand one ends without a blind increase
    await guest.waitFor(
      (r) =>
        r.message?.action === 'bettingCore-firstBetting' &&
        r.message.type === 'private' &&
        r.message.data?.maxBetOnTable === 40,
      'BB turn after raise',
    )
    guest.send({ action: 'fold' })
    await host.waitAction('winner')

    expect(match.blindLevel).toBe(1)
    expect(match.smallBlind).toBe(10)
    expect(match.bigBlind).toBe(20)
    expect(host.responses.some((r) => r.message?.action === 'blindsIncreased')).toBe(
      false,
    )
  }, 20000)

  it('raises blinds with the big blind at exactly twice the small blind', () => {
    const match = new Match('BLIND_LEVELS', 'g1')
    const levels = []
    for (let i = 0; i < 3; i++) {
      match.increaseBlinds()
      levels.push([match.smallBlind, match.bigBlind])
    }
    expect(levels).toEqual([
      [13, 26],
      [17, 34],
      [22, 44],
    ])
  })

  it('counts hands played from one', () => {
    const match = new Match('HANDS_PLAYED', 'g1')
    expect(match.handsPlayed()).toBe(1) // during/after the first hand (h0)
    match.handCount = 9
    expect(match.handsPlayed()).toBe(10) // blinds go up after the 10th hand
  })
})
