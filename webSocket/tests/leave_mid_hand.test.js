import { describe, it, expect, beforeAll, afterAll } from 'vitest'
const { server } = require('../app')
const Torneo = require('../torneo')
import { createClientFactory, listen, sleep, totalChips } from './helpers/tableClient'

// GAM-001 R-09: leaving mid-hand folds the player and keeps their chips in the pot.
describe('GAM-001 leave mid-hand', () => {
  let instance
  const clients = []
  let createClient

  beforeAll(async () => {
    instance = await listen(server)
    createClient = createClientFactory(() => instance.address().port, clients)
  })

  afterAll(() => {
    clients.forEach((c) => c.readyState === 1 && c.close())
    return new Promise((resolve) => instance.close(resolve))
  })

  it('AC-05: private table, the big blind leaves after a raise; chips are conserved', async () => {
    const gameCode = 'LEAVE_' + Math.random().toString(36).slice(2, 7).toUpperCase()
    const seated = []
    for (const [i, name] of ['Alice', 'Bob', 'Charlie'].entries()) {
      const c = createClient(name, String(8100 + i), gameCode)
      await c.opened
      c.send({ action: 'signUp', totalChips: 1000 })
      await c.waitFor(
        (r) => r.message?.action === 'signUp' && r.message.type === 'private',
        'signUp',
      )
      seated.push(c)
    }
    const [alice, bob, charlie] = seated
    alice.send({ action: 'startGame' })
    const match = Torneo.getMatch(gameCode)

    // 3 players: Alice SB, Bob BB, Charlie UTG acts first
    await charlie.waitMyTurn({ timeout: 8000 })
    expect(totalChips(match)).toBe(3000)
    charlie.send({ action: 'setRise', chipsToRiseBet: 200 })
    await alice.waitMyTurn()
    alice.send({ action: 'setCall' })
    await bob.waitMyTurn()
    const since = alice.mark()
    bob.send({ action: 'close' })

    alice.autoAct = 'checkcall'
    charlie.autoAct = 'checkcall'
    await alice.waitAction('winner', { since, timeout: 10000 })
    await sleep(50)

    const stacks = Object.fromEntries(match.players.map((p) => [p.name, p.chips]))
    // Pot = 200 + 200 + Bob's 20 big blind: nothing is lost
    expect(stacks.Alice + stacks.Charlie).toBe(800 + 800 + 420)

    await alice.waitAction('gameRestarted', { since, timeout: 8000 })
    expect(match.players.some((p) => p.name === 'Bob')).toBe(false)
  }, 25000)
})
