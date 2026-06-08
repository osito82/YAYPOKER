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
      const r = JSON.parse(data.toString())
      responses.push(r)

      // Auto-responder para ciegas
      if (
        r.message?.action === 'askForBlindBets' &&
        r.message?.data?.displayMsg.includes(name)
      ) {
        ws.send(
          JSON.stringify({
            action: 'setBet',
            chipsToBet: r.message.data.blindAmount,
          }),
        )
      }
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
    const initialBigStack = 1967
    const initialShortStack = 33
    const totalTableChips = initialBigStack + initialShortStack // 2000

    big.send({ action: 'signUp', totalChips: initialBigStack, isReady: true })
    short.send({
      action: 'signUp',
      totalChips: initialShortStack,
      isReady: true,
    })
    await Promise.all([big.waitAction('signUp'), short.waitAction('signUp')])

    // 2. Iniciar con ciegas en 0 para mantener la compatibilidad con el escenario original
    big.send({ action: 'startGame', smallBlind: 0, bigBlind: 0, ante: 0 })
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

    // Esperamos el evento winner que contiene el pot repartido
    const handResult = await big.waitAction('winner')

    // === ASSERTS PROFESIONALES ===
    // 'winner' event contains winners array, pot, isFold
    // Wait for the next hand to start to get the player's chip counts
    const nextHand = await big.waitAction('dealtPrivateCards')

    const playersInNextHand = nextHand.message.players
    const bigPlayer = playersInNextHand.find((p) => p.name === 'BigStack')
    const shortPlayer = playersInNextHand.find((p) => p.name === 'Shorty')

    // If a player is eliminated, they might not be in the next hand
    const bigChips = bigPlayer
      ? bigPlayer.chips
      : initialBigStack + initialShortStack
    const shortChips = shortPlayer ? shortPlayer.chips : 0 // If shorty was eliminated

    // In a multi-street scenario where one player is eliminated, we can also check the winnerTournament event if it fires
    let tournamentChips = null
    if (!shortPlayer || !bigPlayer) {
      // someone won the tournament
      const tournamentResult = await big.waitAction('winnerTournament', 2000)
      tournamentChips = tournamentResult.message.data.winner.amount
    }

    const currentTableChips =
      tournamentChips !== null ? tournamentChips : bigChips + shortChips

    console.log(
      `Final Result: BigStack has ${bigChips}, Shorty has ${shortChips}. Total table was ${totalTableChips}`,
    )

    // La conservación de fichas es sagrada
    expect(currentTableChips).toBe(totalTableChips)
  }, 40000)
})
