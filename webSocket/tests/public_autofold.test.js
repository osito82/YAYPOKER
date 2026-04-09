import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import WebSocket from 'ws'
const { server } = require('../app')
const { MOCK_PLAYERS, MOCK_ACTIONS } = require('./fixtures')
const { TIMEOUTS } = require('../constants')
const Torneo = require('../torneo')

describe('Public Table Auto-fold Tests', () => {
  let port
  let clients = []

  beforeAll(() => {
    // Clear Torneo state
    Torneo.getTorneos().clear()

    // Set manageable nextRound for test
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

        // Auto-reply to nextRound to keep the game moving
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

    const waitAction = (action, timeout = 60000, filterFn = null) => {
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

    return { name, ws, responses, waitAction }
  }

  it('First player should be disconnected after 2 consecutive autofolds', async () => {
    const gameCode = 'P_AUTO_' + Math.random().toString(36).substring(7)

    // No manual actions, just let them autofold
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])

    alice.ws.send(JSON.stringify(MOCK_ACTIONS.SIGN_UP(1000)))
    bob.ws.send(JSON.stringify(MOCK_ACTIONS.SIGN_UP(1000)))

    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])

    console.log('Match started. Letting Alice autofold twice...')

    // Alice joins first, so she will act first in Hand 1 and Hand 3.
    // Bob will act first in Hand 2.

    // We just wait for Alice to receive the 'disconnected' message
    const disconnectMsg = await alice.waitAction('disconnected', 120000)
    expect(disconnectMsg.message.data.reason).toBe('abandoned')
    console.log('Alice received disconnected message.')

    // Verify socket is closed
    await new Promise((resolve) => {
      if (alice.ws.readyState === WebSocket.CLOSED) resolve()
      else alice.ws.on('close', resolve)
    })
    expect(alice.ws.readyState).toBe(WebSocket.CLOSED)
    console.log('Alice socket closed successfully.')
  }, 150000)
})
