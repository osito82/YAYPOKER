import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'
const { server } = require('../app')

describe('Short Stack Raise Logic Test (Machox Scenario)', () => {
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

      // Auto-responder para ciegas
      if (r.message?.action === 'askForBlindBets' && r.message?.data?.displayMsg.includes(name)) {
        ws.send(JSON.stringify({ action: 'setBet', chipsToBet: r.message.data.blindAmount }))
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
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(actionPayload))
      else ws.once('open', () => ws.send(JSON.stringify(actionPayload)))
    }

    return { name, secretCode, ws, responses, waitAction, send }
  }

  it('Should allow a short stack to "Raise" All-In even if below standard minimum raise', async () => {
    const gameCode = 'P_SHORT_FIX_' + Date.now()
    
    const macho = createClient({ name: 'Macho', secretCode: '1111' }, gameCode)
    const machox = createClient({ name: 'Machox', secretCode: '2222' }, gameCode)

    await Promise.all([
      new Promise((r) => macho.ws.on('open', r)),
      new Promise((r) => machox.ws.on('open', r)),
    ])

    // 1. SignUp con 1000 c/u
    macho.send({ action: 'signUp', totalChips: 1000, isReady: true })
    machox.send({ action: 'signUp', totalChips: 1000, isReady: true })
    await Promise.all([macho.waitAction('signUp'), machox.waitAction('signUp')])

    // 2. Iniciar y esperar cartas con ciegas en 0
    macho.send({ action: 'startGame', smallBlind: 0, bigBlind: 0, ante: 0 })
    await macho.waitAction('dealtPrivateCards')

    // 3. Lógica de respuesta automática: Ya manejada en createClient para lo básico.
    // Pero este test tiene lógica de apuesta específica, así que la agregamos al vuelo:
    const players = [macho, machox]
    players.forEach(p => {
        p.ws.on('message', (data) => {
            const r = JSON.parse(data.toString())
            const action = r.message?.action || ''
            const msg = r.message?.data?.displayMsg || ''
            
            if (action.startsWith('bettingCore') && msg.includes(p.name)) {
                if (p.name === 'Macho') {
                    if (r.message.data.playerBet < 965) {
                        p.send({ action: 'setBet', chipsToBet: 965 })
                    } else {
                        p.send({ action: 'setCall' })
                    }
                } else if (p.name === 'Machox') {
                    p.send({ action: 'setRise', chipsToRiseBet: 1000 })
                }
            }
        })
    })

    // 4. Esperar al Runout (señal de que ambos están All-In)
    const runoutMsg = await macho.waitAction('runout', 15000)
    
    // 5. El pozo debe ser 2000 (1000 de cada uno)
    expect(runoutMsg.message.data.pot).toBe(2000)

    console.log('Test Passed: Short stack raise validated via dynamic turn handling.')
  }, 40000)
})
