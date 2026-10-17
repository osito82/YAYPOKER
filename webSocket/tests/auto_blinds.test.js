import { describe, it, expect, beforeAll, afterAll } from 'vitest'
const { server } = require('../app')
const Torneo = require('../torneo')
import { createClientFactory, listen } from './helpers/tableClient'

// GAM-002: blinds and antes are posted by the server, action order follows the
// seats dealt into the hand, and an incomplete all-in raise does not reopen.
describe('GAM-002 automatic blinds, action order, incomplete raises', () => {
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

  // Disable the test helper's automatic blind answers: none must be needed
  const seat = async (gameCode, players) => {
    const seated = []
    for (const [i, [name, chips]] of players.entries()) {
      const c = createClient(name, String(9100 + i), gameCode)
      await c.opened
      c.send({ action: 'signUp', totalChips: chips })
      await c.waitFor(
        (r) => r.message?.action === 'signUp' && r.message.type === 'private',
        'signUp',
      )
      seated.push(c)
    }
    return seated
  }

  const turnOf = (client, player, action, since = 0) =>
    client.waitFor(
      (r) =>
        r.message?.type === 'public' &&
        r.message.action === action &&
        r.message.data?.messageForId === player.myId,
      `${action} for ${player.name}`,
      { timeout: 8000, since },
    )

  // Act, then wait for the next player's turn among the new messages only
  const act = async (observer, actor, payload, next, action) => {
    const since = observer.mark()
    actor.send(payload)
    if (next) await turnOf(observer, next, action, since)
  }

  it('AC-01: blinds are posted without any prompt', async () => {
    const gameCode = code('AUTOB_')
    const [alice, bob] = await seat(gameCode, [['Alice', 1000], ['Bob', 1000]])
    alice.send({ action: 'startGame' })

    const posted = await bob.waitAction('blindsPosted')
    expect(posted.message.data.posts).toEqual([
      expect.objectContaining({ playerId: alice.myId, type: 'SB', amount: 10, isAllIn: false }),
      expect.objectContaining({ playerId: bob.myId, type: 'BB', amount: 20, isAllIn: false }),
    ])
    expect(posted.message.data.bigBlind).toBe(20)

    const turn = await alice.waitMyTurn()
    expect(turn.message.data.maxBetOnTable).toBe(20)
    expect(alice.received('askForBlindBets')).toBe(false)
    expect(bob.received('askForBlindBets')).toBe(false)

    const match = Torneo.getMatch(gameCode)
    expect(match.players.map((p) => p.chips)).toEqual([990, 980])
    expect(match.dealer.getPot()).toBe(30)
  }, 15000)

  it('AC-01: short stacks post what they have and are all-in', async () => {
    const gameCode = code('SHORTB_')
    const [alice, bob] = await seat(gameCode, [['Alice', 1000], ['Bob', 15]])
    alice.send({ action: 'startGame' })

    const posted = await alice.waitAction('blindsPosted')
    const bb = posted.message.data.posts.find((p) => p.type === 'BB')
    expect(bb).toMatchObject({ playerId: bob.myId, amount: 15, isAllIn: true })
    const match = Torneo.getMatch(gameCode)
    expect(match.dealer.getCurrentHighestBet()).toBe(15)
  }, 15000)

  it('AC-02: the ante is collected from every player when set', async () => {
    const gameCode = code('ANTE_')
    const [alice, bob] = await seat(gameCode, [['Alice', 1000], ['Bob', 1000]])
    alice.send({ action: 'startGame', ante: 5 })

    const posted = await bob.waitAction('blindsPosted')
    expect(posted.message.data.ante).toBe(5)
    expect(posted.message.data.posts.filter((p) => p.type === 'ANTE')).toHaveLength(2)
    await alice.waitMyTurn()
    const match = Torneo.getMatch(gameCode)
    expect(match.dealer.getPot()).toBe(40)
    expect(match.players.map((p) => p.chips)).toEqual([985, 975])
    // The ante is dead money: the call is still the big blind
    expect(match.dealer.getCurrentHighestBet()).toBe(20)
  }, 15000)

  it('AC-05: three players, post-flop starts with the small blind', async () => {
    const gameCode = code('ORDER3_')
    const [alice, bob, charlie] = await seat(gameCode, [
      ['Alice', 1000],
      ['Bob', 1000],
      ['Charlie', 1000],
    ])
    alice.send({ action: 'startGame' })

    // Pre-flop: UTG (Charlie) first
    await turnOf(alice, charlie, 'bettingCore-firstBetting')
    charlie.send({ action: 'setCall' })
    await turnOf(alice, alice, 'bettingCore-firstBetting')
    alice.send({ action: 'setCall' })
    await turnOf(alice, bob, 'bettingCore-firstBetting')
    bob.send({ action: 'setCheck' })

    // Flop: first live seat after the button = small blind (Alice)
    const flopTurn = await alice.waitFor(
      (r) => r.message?.type === 'public' && r.message.action === 'bettingCore-flopBetting',
      'first flop turn',
      { timeout: 8000 },
    )
    expect(flopTurn.message.data.messageForId).toBe(alice.myId)
  }, 20000)

  it('AC-05: heads-up, post-flop starts with the big blind', async () => {
    const gameCode = code('ORDER2_')
    const [alice, bob] = await seat(gameCode, [['Alice', 1000], ['Bob', 1000]])
    alice.send({ action: 'startGame' })

    await turnOf(bob, alice, 'bettingCore-firstBetting')
    alice.send({ action: 'setCall' })
    await turnOf(alice, bob, 'bettingCore-firstBetting')
    bob.send({ action: 'setCheck' })

    const flopTurn = await alice.waitFor(
      (r) => r.message?.type === 'public' && r.message.action === 'bettingCore-flopBetting',
      'first flop turn',
      { timeout: 8000 },
    )
    expect(flopTurn.message.data.messageForId).toBe(bob.myId)
  }, 20000)

  it('AC-04: an incomplete all-in raise does not reopen raising', async () => {
    const gameCode = code('REOPEN_')
    const [alice, bob, charlie] = await seat(gameCode, [
      ['Alice', 1000],
      ['Bob', 1000],
      ['Charlie', 130],
    ])
    alice.send({ action: 'startGame' })
    const pre = 'bettingCore-firstBetting'

    await turnOf(alice, charlie, pre)
    await act(alice, charlie, { action: 'setCall' }, alice, pre)
    // Alice: full raise of 80 to 100
    await act(alice, alice, { action: 'setRise', chipsToRiseBet: 100 }, bob, pre)
    await act(alice, bob, { action: 'setCall' }, charlie, pre)
    const since = alice.mark()
    charlie.send({ action: 'setRise', chipsToRiseBet: 130 }) // all-in, raise of 30

    const prompt = await alice.waitFor(
      (r) =>
        r.message?.type === 'private' &&
        r.message.action === 'bettingCore-firstBetting',
      'Alice faces the short all-in',
      { since, timeout: 8000 },
    )
    expect(prompt.message.data.action).toEqual(['fold', 'call'])

    const sinceRaise = alice.mark()
    alice.send({ action: 'setRise', chipsToRiseBet: 300 })
    const rejected = await alice.waitAction('actionRejected', { since: sinceRaise })
    expect(rejected.message.data.displayMsg).toContain('only call or fold')
  }, 20000)
})
