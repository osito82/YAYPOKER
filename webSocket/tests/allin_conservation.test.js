import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'
const { server } = require('../app')

describe('All-In Chip Conservation Test (Realistic Scenario)', () => {
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

  it('Should conserve total chips on short stack all-in call (multi-street)', async () => {
    const gameCode = 'P_TEST_ALLIN_' + Date.now()

    const big = createClient({ name: 'BigStack', secretCode: '1111' }, gameCode)
    const short = createClient({ name: 'Shorty', secretCode: '2222' }, gameCode)

    await Promise.all([
      new Promise((r) => big.ws.on('open', r)),
      new Promise((r) => short.ws.on('open', r)),
    ])

    // 1. SignUp con los montos exactos del bug
    big.send({ action: 'signUp', totalChips: 1967, isReady: true })
    short.send({ action: 'signUp', totalChips: 33, isReady: true })
    await Promise.all([big.waitAction('signUp'), short.waitAction('signUp')])

    // 2. Iniciar
    big.send({ action: 'startGame' })
    await big.waitAction('dealtPrivateCards')

    // 3. Primera calle (Pre-flop): Apuesta pequeña
    // Esperar turno de BigStack
    await big.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data.displayMsg.includes('BigStack'),
    )
    big.send({ action: 'setBet', chipsToBet: 21 })

    // Esperar turno de Shorty
    await short.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data.displayMsg.includes('Shorty'),
    )
    short.send({ action: 'setCall' })

    // Esperar a que se reparta el Flop
    await big.waitAction('dealerHand-flop', 5000)

    // 4. Segunda calle (Flop): All-In masivo
    // Esperar turno de BigStack o Shorty según quién actúe primero (rota el dealer)
    try {
      await big.waitAction('bettingCore-flopBetting', 3000, (r) =>
        r.message.data.displayMsg.includes('BigStack'),
      )
      big.send({ action: 'setBet', chipsToBet: 1946 })

      await short.waitAction('bettingCore-flopBetting', 3000, (r) =>
        r.message.data.displayMsg.includes('Shorty'),
      )
      short.send({ action: 'setCall' })
    } catch (e) {
      // Si no es el turno de BigStack, intentar al revés
      await short.waitAction('bettingCore-flopBetting', 3000, (r) =>
        r.message.data.displayMsg.includes('Shorty'),
      )
      short.send({ action: 'setBet', chipsToBet: 12 })

      await big.waitAction('bettingCore-flopBetting', 3000, (r) =>
        r.message.data.displayMsg.includes('BigStack'),
      )
      big.send({ action: 'setCall' })
    }

    // 5. Runout y Resultado Final
    await big.waitAction('runout')
    const tournamentResult = await big.waitAction('winnerTournament')

    // === ASSERTS PROFESIONALES ===
    const chipsWon = tournamentResult.message.data.winner.amount
    const totalTableChips = 1967 + 33 // 2000

    console.log(
      `Final Result: Winner got ${chipsWon} chips. Total table was ${totalTableChips}`,
    )

    // El ganador NO puede tener más de lo que había en la mesa
    expect(chipsWon).toBeLessThanOrEqual(totalTableChips)
    // En este caso, como BigStack gana (Shorty pierde), debe tener exactamente 2000
    expect(chipsWon).toBe(totalTableChips)
  }, 40000)
})
