import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
const { server } = require('../app')
const Torneo = require('../torneo')
const Match = require('../match')
const Player = require('../player')
const Socket = require('../sockets')
const WinnerCertificate = require('../winnerCertificate')
import { createClientFactory, listen } from './helpers/tableClient'

// GAM-003: cards are revealed only at a real showdown; certificates only for
// human winners and counting every entrant.
describe('GAM-003 reveal rules', () => {
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

  const seat = async (gameCode, names) => {
    const seated = []
    for (const [i, name] of names.entries()) {
      const c = createClient(name, String(6100 + i), gameCode)
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

  it('AC-01/03: a fold win reveals no cards; the folded cards stay for the log', async () => {
    const gameCode = 'REVEAL_' + Math.random().toString(36).slice(2, 7)
    const [alice, bob] = await seat(gameCode, ['Alice', 'Bob'])
    alice.send({ action: 'startGame' })
    const match = Torneo.getMatch(gameCode)

    await alice.waitMyTurn()
    alice.send({ action: 'setRise', chipsToRiseBet: 60 })
    await bob.waitMyTurn({ since: 0 })
    await bob.waitFor(
      (r) => r.message?.type === 'private' && r.message.data?.maxBetOnTable === 60,
      'Bob faces the raise',
    )
    bob.send({ action: 'fold' })

    const win = await bob.waitAction('winner', { timeout: 5000 })
    expect(win.message.data.isFold).toBe(true)
    for (const p of win.message.players) expect(p.cards).toBeUndefined()

    const bobSeat = match.players.find((p) => p.name === 'Bob')
    expect(bobSeat.muckedCards).toHaveLength(2)
    expect([...match.entrants].sort()).toEqual(['Alice', 'Bob'])
  }, 15000)

  it('AC-02: at showdown only the players who did not fold show their cards', async () => {
    const gameCode = 'SHOW_' + Math.random().toString(36).slice(2, 7)
    const [alice, bob, charlie] = await seat(gameCode, ['Alice', 'Bob', 'Charlie'])
    // UTG folds, the blinds check it down
    alice.send({ action: 'startGame' })

    await charlie.waitMyTurn({ timeout: 8000 })
    charlie.send({ action: 'fold' })
    alice.autoAct = 'checkcall'
    bob.autoAct = 'checkcall'

    const show = await alice.waitAction('showDown', { timeout: 15000 })
    const hands = Object.fromEntries(
      show.message.data.showDown.map((h) => [h.name, h.playerCards]),
    )
    expect(hands.Alice).toHaveLength(2)
    expect(hands.Bob).toHaveLength(2)
    expect(hands.Charlie).toEqual([])

    const win = await alice.waitAction('winner', { timeout: 8000 })
    const byName = Object.fromEntries(win.message.players.map((p) => [p.name, p]))
    expect(byName.Alice.cards).toHaveLength(2)
    expect(byName.Bob.cards).toHaveLength(2)
    expect(byName.Charlie.cards).toBeUndefined()
  }, 25000)
})

describe('GAM-003 tournament certificates', () => {
  afterEach(() => vi.restoreAllMocks())

  const makeMatch = (names) => {
    const match = new Match('CERT_' + Math.random().toString(36).slice(2, 7), 'g1')
    names.forEach((name, i) => {
      const p = new Player('g1', name, String(1000 + i), 1000, [], `id-${i}`, i + 1)
      match.players.push(p)
    })
    return match
  }

  it('AC-04: a bot winner gets no certificate and nothing is stored', () => {
    const register = vi.spyOn(WinnerCertificate, 'registerWinner')
    const broadcast = vi.spyOn(Socket, 'broadcastToTorneo').mockImplementation(() => {})
    const match = makeMatch(['TicoMan_Bot'])
    match.actions.winnerTournament([{ name: 'TicoMan_Bot', playerId: 'id-0' }])

    expect(register).not.toHaveBeenCalled()
    const msg = broadcast.mock.calls.at(-1)[1]
    expect(msg.action).toBe('winnerTournament')
    expect(msg.data.certificate).toBeNull()
    vi.restoreAllMocks()
  })

  it('AC-05: a human winner certificate counts every entrant', () => {
    const register = vi
      .spyOn(WinnerCertificate, 'registerWinner')
      .mockImplementation((torneoId, winner, totalPlayers) => ({
        code: '0000',
        torneoId,
        date: 'd',
        totalPlayers,
      }))
    vi.spyOn(Socket, 'broadcastToTorneo').mockImplementation(() => {})
    const match = makeMatch(['Alice'])
    match.entrants = new Set(['Alice', 'Bob', 'Charlie', 'Dana'])
    match.actions.winnerTournament([{ name: 'Alice', playerId: 'id-0' }])

    expect(register).toHaveBeenCalledTimes(1)
    expect(register.mock.calls[0][2]).toBe(4)
    vi.restoreAllMocks()
  })
})
