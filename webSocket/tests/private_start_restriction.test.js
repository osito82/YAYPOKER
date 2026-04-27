import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'
const { server } = require('../app')
const { MOCK_PLAYERS, MOCK_ACTIONS } = require('./fixtures')

describe('Private Match Start Restriction', () => {
  let port
  let serverInstance
  let clients = []

  beforeAll(() => {
    return new Promise((resolve) => {
      serverInstance = server.listen(0, () => {
        port = serverInstance.address().port
        console.log(`Test server running on port ${port}`)
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

  const createClient = (playerData, gameCode) => {
    const { name, secretCode } = playerData
    const ws = new WebSocket(
      `ws://localhost:${port}?gameCode=${gameCode}&playerName=${name}&secretCode=${secretCode}`,
    )
    clients.push(ws)

    const responses = []
    ws.on('message', (data) => {
      responses.push(JSON.parse(data.toString()))
    })

    const waitAction = (action, timeout = 5000, filterFn = null) => {
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
            reject(new Error(`Timeout esperando: ${action} para ${name}`))
          }
        }, 50)
      })
    }

    const send = (actionPayload) => {
      const data = typeof actionPayload === 'function' ? actionPayload() : actionPayload
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data))
      } else {
        ws.once('open', () => ws.send(JSON.stringify(data)))
      }
    }

    return { name, ws, responses, waitAction, send }
  }

  it('Should ONLY start when host triggers startGame, even if all players are ready', async () => {
    const gameCode = 'PRIV_START_' + Math.random().toString(36).substring(7)
    
    // Alice is host (joined first)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])

    // 1. Both signup
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])

    // 2. Both mark as ready
    alice.send(MOCK_ACTIONS.PLAYER_READY)
    bob.send(MOCK_ACTIONS.PLAYER_READY)
    
    // Wait a bit to ensure NO auto-start happens
    await new Promise(r => setTimeout(r, 1000))
    
    const dealtMsg = alice.responses.find(r => r.message?.action === 'dealtPrivateCards')
    expect(dealtMsg).toBeUndefined()
    
    // 3. Bob (non-host) tries to start the game
    bob.send(MOCK_ACTIONS.START_GAME)
    
    // Bob should get a lobbyError saying only host can start
    const errorMsg = await bob.waitAction('lobbyError')
    expect(errorMsg.message.data.displayMsg).toContain('Only the host can start')
    
    // Verify game STILL hasn't started
    await new Promise(r => setTimeout(r, 500))
    const dealtMsg2 = alice.responses.find(r => r.message?.action === 'dealtPrivateCards')
    expect(dealtMsg2).toBeUndefined()

    // 4. Alice (host) starts the game
    alice.send(MOCK_ACTIONS.START_GAME)
    
    // In current logic, game asks for blinds BEFORE dealing private cards
    await alice.waitAction('askForBlindBets')
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    
    await bob.waitAction('askForBlindBets')
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))

    // Game should start now
    await alice.waitAction('dealtPrivateCards')
    const dealtMsg3 = alice.responses.find(r => r.message?.action === 'dealtPrivateCards')
    expect(dealtMsg3).toBeDefined()
    
    console.log('Test Passed: Private match start restriction validated.')
  }, 20000)
})
