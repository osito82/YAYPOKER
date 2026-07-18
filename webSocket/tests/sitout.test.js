import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'
const { server } = require('../app')
const { MOCK_PLAYERS, MOCK_ACTIONS } = require('./fixtures')
const { TIMEOUTS } = require('../constants')
const Torneo = require('../torneo')

describe('Sit Out System Integration Tests', () => {
  let port
  let clients = []

  beforeAll(() => {
    Torneo.getTorneos().clear()
    TIMEOUTS.nextRound = 500

    return new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port
        console.log(`Test server running on port ${port}`)
        resolve()
      })
    })
  })

  afterAll(() => {
    clients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN) c.close()
    })
    return new Promise((resolve) => server.close(resolve))
  })

  const createClient = (playerData, gameCode) => {
    const { name, secretCode } = playerData
    const ws = new WebSocket(
      `ws://localhost:${port}?gameCode=${gameCode}&playerName=${name}&secretCode=${secretCode}`,
    )
    clients.push(ws)

    const responses = []
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())
        responses.push(msg)

        const action = msg.message?.action
        if (
          action === 'winner' ||
          action === 'showDown' ||
          action === 'tournamentWinner' ||
          action === 'gameRestarted'
        ) {
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ action: 'nextRound' }))
            }
          }, 100)
        }
      } catch (e) {}
    })

    const waitAction = (action, timeout = 10000, filterFn = null) => {
      return new Promise((resolve, reject) => {
        const start = Date.now()
        const check = setInterval(() => {
          const found = responses.find((r) => {
            if (!r.message || r.message.action !== action) return false
            if (filterFn) return filterFn(r)
            return true
          })
          if (found) {
            clearInterval(check)
            resolve(found)
          }
          if (Date.now() - start > timeout) {
            clearInterval(check)
            reject(new Error(`Timeout waiting for ${action} for ${name}`))
          }
        }, 100)
      })
    }

    const send = (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data))
      }
    }

    return { name, ws, responses, waitAction, send }
  }

  it('Should handle manual Sit Out, auto-acting check/fold, and manual Sit In', async () => {
    const gameCode = 'sitout-test-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])

    // Sign up
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])

    // Start Game
    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    // Wait for blinds
    await alice.waitAction('askForBlindBets')

    // Alice posts Small Blind (10)
    alice.send({ action: 'setBet', chipsToBet: 10 })

    // Wait for Bob Big Blind
    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )

    // Bob sets himself to Sit Out
    bob.send({ action: 'setSitOut', isSittingOut: true })

    // Verify Bob gets marked as sitting out (check response for Sit Out broadcast)
    const sitOutMsg = await alice.waitAction('playerSitOut')
    expect(sitOutMsg.message.data.isSittingOut).toBe(true)
    expect(sitOutMsg.message.data.displayMsg).toContain('Bob')

    // Since Bob is in Sit Out mode and it is his turn to post BB, he should auto-fold
    // Let's verify the winner is declared immediately (Alice wins because Bob auto-folds)
    const winnerMsg = await alice.waitAction('winner', 5000)
    expect(winnerMsg.message.data.winners[0].name).toBe('Alice')
    expect(winnerMsg.message.data.isFold).toBe(true)

    // Siting Bob back in
    bob.send({ action: 'setSitOut', isSittingOut: false })

    const sitInMsg = await alice.waitAction(
      'playerSitOut',
      5000,
      (r) => r.message.data.isSittingOut === false,
    )
    expect(sitInMsg.message.data.isSittingOut).toBe(false)
  })

  it('Should put player in Sit Out mode automatically after consecutive autofolds', async () => {
    const gameCode = 'sitout-auto-' + Math.random().toString(36).substring(7)
    // Reduce timeouts slightly for faster tests
    TIMEOUTS.autofold = 1000

    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])

    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])

    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    // Round 1
    await alice.waitAction('askForBlindBets')
    alice.send({ action: 'setBet', chipsToBet: 10 })

    // Bob times out once (autofold 1)
    const winner1 = await alice.waitAction('winner', 6000)
    expect(winner1.message.data.winners[0].name).toBe('Alice')

    // Wait for next round to start
    await alice.waitAction('gameRestarted')
    await alice.waitAction('askForBlindBets')

    // Post blinds for new hand
    alice.send({ action: 'setBet', chipsToBet: 10 })

    // Bob times out second time (autofold 2)
    // He should now trigger the sitOut automatically!
    const sitOutMsg = await alice.waitAction('playerSitOut', 8000)
    expect(sitOutMsg.message.data.isSittingOut).toBe(true)
    expect(sitOutMsg.message.data.displayMsg).toContain('Bob')
  })
})
