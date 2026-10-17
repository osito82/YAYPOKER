import { describe, it, expect, beforeAll, afterAll } from 'vitest'
const { server } = require('../app')
const Torneo = require('../torneo')
import { createClientFactory, listen, sleep } from './helpers/tableClient'

// OPS-001: the server issues a session token; the PIN alone no longer controls
// a seat.
describe('OPS-001 session tokens', () => {
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

  const code = (p) => p + Math.random().toString(36).slice(2, 7).toUpperCase()

  const join = async (name, pin, gameCode, opts) => {
    const c = createClient(name, pin, gameCode, opts)
    await c.opened
    c.send({ action: 'signUp', totalChips: 1000 })
    return c
  }
  const privateSignUp = (c, opts) =>
    c.waitFor(
      (r) => r.message?.action === 'signUp' && r.message.type === 'private',
      'private signUp',
      opts,
    )

  const startedTable = async (gameCode) => {
    const alice = await join('Alice', '1234', gameCode)
    await privateSignUp(alice)
    const bob = await join('Bob', '5678', gameCode)
    await privateSignUp(bob)
    alice.send({ action: 'startGame' })
    await bob.waitAction('blindsPosted')
    return { alice, bob }
  }

  it('AC-01: two players with the same PIN both stay connected', async () => {
    const gameCode = code('SAMEPIN_')
    const alice = await join('Alice', '1234', gameCode)
    await privateSignUp(alice)
    const bob = await join('Bob', '1234', gameCode)
    const bobSignUp = await privateSignUp(bob)

    expect(bobSignUp.message.data.errorType).toBeUndefined()
    await sleep(200)
    expect(alice.ws.readyState).toBe(1)
    const match = Torneo.getMatch(gameCode)
    expect(match.players.map((p) => p.name).sort()).toEqual(['Alice', 'Bob'])
    expect(match.players.every((p) => p.connected)).toBe(true)
  })

  it('AC-02/05: the token reconnects while the old socket is open; it is never public', async () => {
    const gameCode = code('TOKEN_')
    const { alice, bob } = await startedTable(gameCode)
    expect(alice.sessionToken).toMatch(/^[0-9a-f-]{36}$/)

    const tab2 = await join('Alice', '1234', gameCode, {
      query: `&sessionToken=${alice.sessionToken}`,
    })
    const rejoin = await privateSignUp(tab2)
    expect(rejoin.message.data.errorType).toBeUndefined()
    await alice.closed
    expect(tab2.ws.readyState).toBe(1)

    const leaked = [...alice.responses, ...bob.responses, ...tab2.responses]
      .filter((r) => !(r.message?.action === 'signUp' && r.message.type === 'private'))
      .some((r) => JSON.stringify(r).includes(alice.sessionToken))
    expect(leaked).toBe(false)
    expect(
      bob.responses.some((r) => JSON.stringify(r).includes(alice.sessionToken)),
    ).toBe(false)
  }, 15000)

  it('AC-03: name + PIN recovers a disconnected seat and rotates the token', async () => {
    const gameCode = code('RECOVER_')
    const { alice } = await startedTable(gameCode)
    const firstToken = alice.sessionToken

    // Connected seat: name + PIN without the token is refused
    const early = await join('Alice', '1234', gameCode)
    const refused = await privateSignUp(early)
    expect(refused.message.data.errorType).toBe('NAME_TAKEN')

    alice.ws.close()
    await alice.closed
    await sleep(100)
    const phone = await join('Alice', '1234', gameCode)
    const recovered = await privateSignUp(phone)
    expect(recovered.message.data.errorType).toBeUndefined()
    expect(phone.sessionToken).toMatch(/^[0-9a-f-]{36}$/)
    expect(phone.sessionToken).not.toBe(firstToken)
    const match = Torneo.getMatch(gameCode)
    expect(match.players.find((p) => p.name === 'Alice').connected).toBe(true)
  }, 15000)

  it('AC-04: five wrong PINs lock PIN recovery for that seat', async () => {
    const gameCode = code('LOCK_')
    const { alice } = await startedTable(gameCode)
    alice.ws.close()
    await alice.closed

    for (let i = 0; i < 5; i++) {
      const guess = await join('Alice', String(9000 + i), gameCode)
      const res = await privateSignUp(guess)
      expect(res.message.data.errorType).toBe('NAME_TAKEN')
      guess.ws.close()
    }
    // Even the right PIN is refused now
    const right = await join('Alice', '1234', gameCode)
    const res = await privateSignUp(right)
    expect(res.message.data.errorType).toBe('TOO_MANY_ATTEMPTS')

    // The token still works
    const back = await join('Alice', '1234', gameCode, {
      query: `&sessionToken=${alice.sessionToken}`,
    })
    const ok = await privateSignUp(back)
    expect(ok.message.data.errorType).toBeUndefined()
  }, 20000)
})
