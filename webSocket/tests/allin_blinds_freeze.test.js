import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'
const { server } = require('../app')

describe('All-In Blinds Freeze Test', () => {
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
      const r = JSON.parse(data.toString())
      responses.push(r)

      // Auto-responder for blinds
      if (
        r.message?.action === 'askForBlindBets' &&
        r.message?.data?.displayMsg.includes(name)
      ) {
        // Player tries to bet the required blind amount.
        // If they don't have enough, the server converts it to ALL-IN.
        ws.send(
          JSON.stringify({
            action: 'setBet',
            chipsToBet: r.message.data.blindAmount,
          }),
        )
      }
    })

    const waitAction = (action, timeout = 10000, filterFn = null) => {
      return new Promise((resolve, reject) => {
        const start = Date.now()
        const check = setInterval(() => {
          const found = responses.find((r) => {
            const act = r.message?.action || r.message?.method || r.action
            if (act !== action) return false
            if (filterFn) return filterFn(r)
            return true
          })
          if (found) {
            clearInterval(check)
            resolve(found)
          }
          if (Date.now() - start > timeout) {
            clearInterval(check)
            reject(new Error(`Timeout waiting for: ${action} for ${name}`))
          }
        }, 100)
      })
    }

    const send = (actionPayload) => {
      if (ws.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify(actionPayload))
      else ws.once('open', () => ws.send(JSON.stringify(actionPayload)))
    }

    return { name, secretCode, ws, responses, waitAction, send }
  }

  it('Should continue the game without freezing if a player goes all-in posting blinds', async () => {
    const gameCode = 'P_BLINDS_FIX_' + Date.now()

    // P1 has enough for small blind, P2 only has 3 chips for the big blind of 32
    const p1 = createClient({ name: 'P1', secretCode: '1111' }, gameCode)
    const p2 = createClient({ name: 'P2', secretCode: '2222' }, gameCode)

    await Promise.all([
      new Promise((r) => p1.ws.on('open', r)),
      new Promise((r) => p2.ws.on('open', r)),
    ])

    // 1. SignUp with specific stacks
    p1.send({ action: 'signUp', totalChips: 100, isReady: true })
    p2.send({ action: 'signUp', totalChips: 3, isReady: true }) // Only 3 chips!
    await Promise.all([p1.waitAction('signUp'), p2.waitAction('signUp')])

    // 2. Start game with big blinds
    p1.send({ action: 'startGame', smallBlind: 17, bigBlind: 32, ante: 0 })
    
    // 3. Wait for dealtPrivateCards. If the bug is present, it will timeout here
    // because the server will keep asking for blinds and freezing.
    await p1.waitAction('dealtPrivateCards', 15000)
    await p2.waitAction('dealtPrivateCards', 15000)

    console.log('Test Passed: Hand progressed successfully despite the short blind all-in.')
  }, 20000)
})
