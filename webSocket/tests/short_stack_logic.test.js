import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'
const { server } = require('../app')

describe('Short Stack Raise Logic Test (Machox Scenario)', () => {
  let port
  let clients = []

  beforeAll(() => {
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
            reject(new Error(`Timeout waiting for: ${action} for ${name}`))
          }
        }, 50)
      })
    }

    const send = (actionPayload) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(actionPayload))
      } else {
        ws.once('open', () => ws.send(JSON.stringify(actionPayload)))
      }
    }

    return { name, ws, responses, waitAction, send }
  }

  it('Should allow a short stack to "Raise" All-In even if below standard minimum raise', async () => {
    const gameCode = 'P_SHORT_RAISE_' + Date.now()

    const macho = createClient({ name: 'Macho', secretCode: '1111' }, gameCode)
    const machox = createClient(
      { name: 'Machox', secretCode: '2222' },
      gameCode,
    )

    await Promise.all([
      new Promise((r) => macho.ws.on('open', r)),
      new Promise((r) => machox.ws.on('open', r)),
    ])

    // 1. Ambos con 1000
    macho.send({ action: 'signUp', totalChips: 1000, isReady: true })
    machox.send({ action: 'signUp', totalChips: 1000, isReady: true })
    await Promise.all([macho.waitAction('signUp'), machox.waitAction('signUp')])

    // 2. Iniciar (saltando ciegas para simplificar el test si es pública)
    macho.send({ action: 'startGame' })
    await macho.waitAction('dealtPrivateCards')

    // 3. Macho sube a 965 (dejándose 35)
    await macho.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data.displayMsg.includes('Macho'),
    )
    macho.send({ action: 'setBet', chipsToBet: 965 })

    // 4. Esperar el turno de Machox
    // Machox tiene 1000. El Call es 965.
    // La subida mínima normal sería 965 + (965-0) = 1930.
    // Pero Machox solo tiene 1000. El servidor DEBE permitirle hacer "Raise" All-In a 1000.
    const machoxTurn = await machox.waitAction(
      'bettingCore-firstBetting',
      5000,
      (r) => r.message.data.displayMsg.includes('Machox'),
    )

    expect(machoxTurn.message.data.action).toContain('raise')

    // Machox intenta subir a 1000 (su All-In)
    machox.send({ action: 'setRise', chipsToRiseBet: 1000 })

    // 5. Macho debe igualar los 35 restantes para cerrar la acción
    // Usamos un timeout más corto para adelantarnos al autofold
    await macho.waitAction('bettingCore-firstBetting', 2000, (r) =>
      r.message.data.displayMsg.includes('Macho'),
    )
    macho.send({ action: 'setCall' })

    // 6. Verificar que el servidor lo acepta y el pozo es correcto (1000 + 1000 = 2000)
    // En el caso de All-In de ambos, el servidor dispara el runout
    const runoutMsg = await macho.waitAction('runout', 5000)
    expect(runoutMsg.message.data.pot).toBe(2000)

    console.log(
      'Test Passed: Short stack raise accepted and betting round closed.',
    )
  }, 40000)
})
