import { describe, it, expect, beforeAll, afterAll } from 'vitest'
const { server } = require('../app')
const Torneo = require('../torneo')
const { TIMEOUTS } = require('../constants')
import { createClientFactory, listen, sleep } from './helpers/tableClient'

// GAM-001: a disconnect keeps the seat, never pauses the table and never ends
// the tournament by itself.
describe('GAM-001 seat survives disconnects', () => {
  let instance
  const clients = []
  let createClient
  const saved = {}

  beforeAll(async () => {
    saved.disconnectedTurn = TIMEOUTS.disconnectedTurn
    saved.publicSeatRelease = TIMEOUTS.publicSeatRelease
    TIMEOUTS.disconnectedTurn = 300
    TIMEOUTS.publicSeatRelease = 200
    instance = await listen(server)
    createClient = createClientFactory(() => instance.address().port, clients)
  })

  afterAll(() => {
    Object.assign(TIMEOUTS, saved)
    clients.forEach((c) => c.readyState === 1 && c.close())
    return new Promise((resolve) => instance.close(resolve))
  })

  const code = (p) => p + Math.random().toString(36).slice(2, 7).toUpperCase()

  const seat = async (gameCode, names, opts = {}) => {
    const seated = []
    for (const [i, name] of names.entries()) {
      const c = createClient(name, String(7100 + i), gameCode, opts)
      await c.opened
      c.send({ action: 'signUp', totalChips: 1000 })
      await c.waitFor(
        (r) => r.message?.action === 'signUp' && r.message.type === 'private',
        'signUp',
      )
      seated.push(c)
    }
    return seated
  }

  it('AC-01/02: a disconnect does not pause; the seat stays and auto-acts', async () => {
    const gameCode = code('DISC_')
    const [alice, bob] = await seat(gameCode, ['Alice', 'Bob'])
    alice.send({ action: 'startGame' })

    // Heads-up: Alice (SB) acts first pre-flop
    await alice.waitMyTurn()
    const since = alice.mark()
    bob.ws.close()
    await alice.waitAction('playerDisconnected', { since })
    expect(alice.received('playerPaused', since)).toBe(false)

    const match = Torneo.getMatch(gameCode)
    const bobSeat = match.players.find((p) => p.name === 'Bob')
    expect(bobSeat).toBeDefined()
    expect(bobSeat.connected).toBe(false)
    expect(bobSeat.chips).toBe(980)

    // Alice calls, Bob (BB, disconnected) auto-checks after disconnectedTurn
    alice.autoAct = 'checkcall'
    alice.send({ action: 'setCall' })
    const check = await alice.waitFor(
      (r) =>
        r.message?.action === 'setCheck' &&
        r.message.players?.find((p) => p.name === 'Bob')?.lastAction ===
          'Check (timeout)',
      'Bob auto-check',
      { since, timeout: 3000 },
    )
    expect(check).toBeDefined()

    // The hand finishes and the next one starts with Bob still seated
    await alice.waitAction('winner', { since, timeout: 8000 })
    await alice.waitAction('gameRestarted', { since, timeout: 5000 })
    expect(alice.received('winnerTournament', since)).toBe(false)
    expect(match.players.some((p) => p.name === 'Bob')).toBe(true)
  }, 20000)

  it('AC-03: human vs bot, the human drops: no tournament win, table idles, resumes on reconnect', async () => {
    const gameCode = code('IDLE_')
    const [hugo, bot] = await seat(gameCode, ['Hugo', 'TicoMan_Bot'], {
      autoAct: 'checkcall',
    })
    hugo.autoAct = null
    hugo.send({ action: 'startGame' })
    await bot.waitFor(
      (r) => r.message?.action?.startsWith('bettingCore'),
      'first turn',
    )
    const since = bot.mark()
    hugo.ws.close()

    const idle = await bot.waitFor(
      (r) => r.message?.action === 'tableIdle',
      'tableIdle',
      { since, timeout: 10000 },
    )
    expect(idle.message.data.reason).toBe('NO_HUMANS')
    expect(bot.received('winnerTournament', since)).toBe(false)

    const afterIdle = bot.mark()
    await sleep(800)
    expect(bot.received('gameRestarted', afterIdle)).toBe(false)

    const hugo2 = createClient('Hugo', '7100', gameCode)
    await hugo2.opened
    hugo2.send({ action: 'signUp', totalChips: 1000 })
    await bot.waitAction('gameRestarted', { since: afterIdle, timeout: 5000 })
  }, 25000)

  it('AC-04: reconnecting during your turn does not restart the clock', async () => {
    const gameCode = code('CLOCK_')
    const [alice, bob] = await seat(gameCode, ['Alice', 'Bob'])
    const match = Torneo.getMatch(gameCode)
    match.autofoldDuration = 1500
    alice.send({ action: 'startGame' })

    await alice.waitMyTurn()
    const t0 = Date.now()
    const since = bob.mark()
    await sleep(600)
    alice.ws.close()
    const alice2 = createClient('Alice', '7100', gameCode)
    await alice2.opened
    alice2.send({ action: 'signUp', totalChips: 1000 })

    // SB facing the BB times out → fold, at the original deadline
    await bob.waitFor(
      (r) =>
        r.message?.action === 'fold' &&
        r.message.players?.find((p) => p.name === 'Alice')?.folded,
      'Alice timeout fold',
      { since, timeout: 5000 },
    )
    expect(Date.now() - t0).toBeLessThan(1500 + 450)
  }, 15000)

  it('AC-06: public table releases a seat disconnected longer than the limit, between hands', async () => {
    const gameCode = code('P_REL')
    const [ann, ben, cid] = await seat(gameCode, ['Ann', 'Ben', 'Cid'], {
      autoAct: 'checkcall',
    })
    const match = Torneo.getMatch(gameCode)
    await ann.waitFor(
      (r) => r.message?.action?.startsWith('bettingCore'),
      'first turn',
      { timeout: 8000 },
    )
    const since = ann.mark()
    cid.ws.close()
    await ann.waitAction('playerDisconnected', { since })
    expect(match.players.some((p) => p.name === 'Cid')).toBe(true)

    await ann.waitAction('gameRestarted', { since, timeout: 15000 })
    expect(match.players.some((p) => p.name === 'Cid')).toBe(false)
    expect(match.players.map((p) => p.name).sort()).toEqual(['Ann', 'Ben'])
    void ben
  }, 30000)
})
