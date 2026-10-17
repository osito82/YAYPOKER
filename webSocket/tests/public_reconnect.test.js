import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import WebSocket from 'ws'
const { server } = require('../app')
const { MOCK_PLAYERS, MOCK_ACTIONS } = require('./fixtures')
const { TIMEOUTS, GAME_RULES } = require('../constants')
const Torneo = require('../torneo')

describe('Public Table Disconnect/Reconnect Tests', () => {
  let port
  let clients = []

  beforeAll(() => {
    Torneo.getTorneos().clear()
    // Make sure we have a short pause timeout but long enough to reconnect
    TIMEOUTS.pause = 3000
    // Shorter timeouts for testing
    TIMEOUTS.nextRound = 500
    TIMEOUTS.publicEmptyGrace = 3000

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

    const waitAction = (action, timeout = 15000, filterFn = null) => {
      const startIndex = responses.length
      return new Promise((resolve, reject) => {
        const start = Date.now()
        const check = setInterval(() => {
          for (let i = startIndex; i < responses.length; i++) {
            const r = responses[i]
            if (r.message && r.message.action === action) {
              if (!filterFn || filterFn(r)) {
                clearInterval(check)
                resolve(r)
                return
              }
            }
          }
          if (Date.now() - start > timeout) {
            clearInterval(check)
            reject(new Error(`Timeout waiting for ${action} for ${name}`))
          }
        }, 100)
      })
    }

    return { name, secretCode, ws, responses, waitAction, gameCode }
  }

  it('Player keeps the seat (no pause, no kick) when disconnecting in a public match and reconnects to the same table', async () => {
    const gameCode = 'P_RECONN_' + Math.random().toString(36).substring(7)

    let alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    let bob = createClient(MOCK_PLAYERS.BOB, gameCode)

    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])

    alice.ws.send(JSON.stringify(MOCK_ACTIONS.SIGN_UP(1000)))
    bob.ws.send(JSON.stringify(MOCK_ACTIONS.SIGN_UP(1000)))

    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])

    // Wait for the game to start (public registration takes ~3s)
    await new Promise((r) => setTimeout(r, 4000))

    console.log('Match started. Alice disconnects...')

    // Alice disconnects
    alice.ws.close()

    // GAM-001: Bob is told Alice disconnected; the table is not paused
    const disconnectMsg = await bob.waitAction('playerDisconnected', 5000)
    expect(disconnectMsg.message.data.displayMsg).toContain('disconnected')
    expect(disconnectMsg.message.data.displayMsg).not.toContain('paused')

    console.log('Bob saw Alice get paused. Alice reconnecting...')

    // Alice reconnects within grace period
    const newAlice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    await new Promise((r) => newAlice.ws.on('open', r))

    newAlice.ws.send(JSON.stringify(MOCK_ACTIONS.SIGN_UP(1000)))

    // Alice should successfully sign up (reconnect)
    const signUpMsg = await newAlice.waitAction('signUp', 5000)
    expect(signUpMsg).toBeDefined()
    // GAM-001 AC-07: back to her own table, not redirected to another one
    expect(signUpMsg.message.torneoId).toBe(gameCode)

    console.log('Alice successfully reconnected. Game continues.')
  }, 30000)
})
