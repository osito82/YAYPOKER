import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'
import { server } from '../app'
import { MOCK_PLAYERS, MOCK_ACTIONS } from './fixtures'

describe('Poker Game Integration Tests', () => {
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

    const waitAction = (action, timeout = 3000) => {
      return new Promise((resolve, reject) => {
        const start = Date.now()
        const check = setInterval(() => {
          const found = responses.find(
            (r) => r.message && r.message.action === action,
          )
          if (found) {
            clearInterval(check)
            resolve(found)
          }
          if (Date.now() - start > timeout) {
            clearInterval(check)
            reject(new Error(`Timeout esperando: ${action}`))
          }
        }, 50)
      })
    }

    const send = (actionPayload) => {
      const data =
        typeof actionPayload === 'function' ? actionPayload() : actionPayload
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data))
      } else {
        ws.once('open', () => ws.send(JSON.stringify(data)))
      }
    }

    return { ws, responses, waitAction, send }
  }

  it('debería ejecutar el escenario de Alice haciendo Fold usando Mocks', async () => {
    const gameCode = 'test-room-' + Math.random().toString(36).substring(7)

    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])

    // Registro usando acciones de MOCK
    alice.send(MOCK_ACTIONS.SIGN_UP(MOCK_PLAYERS.ALICE.totalChips))
    bob.send(MOCK_ACTIONS.SIGN_UP(MOCK_PLAYERS.BOB.totalChips))

    await alice.waitAction('signUp')
    await bob.waitAction('signUp')

    // Iniciar juego
    alice.send(MOCK_ACTIONS.START_GAME)
    await alice.waitAction('askForBlindBets')

    // Alice hace Fold
    alice.send(MOCK_ACTIONS.FOLD)

    // Bob recibe la notificación de fold
    const foldMsg = await bob.waitAction('fold')
    expect(foldMsg.message.action).toBe('fold')

    const aliceState = foldMsg.message.players.find(
      (p) => p.name === MOCK_PLAYERS.ALICE.name,
    )
    expect(aliceState.folded).toBe(true)
    expect(aliceState.lastAction).toBe('Fold')
  }, 15000)

  it('debería completar una ronda pre-flop con Alice igualando y Bob pasando', async () => {
    const gameCode = 'test-room-' + Math.random().toString(36).substring(7)

    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])

    // 1. Registro
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await alice.waitAction('signUp')
    await bob.waitAction('signUp')

    // 2. Iniciar juego
    alice.send(MOCK_ACTIONS.START_GAME)

    // 3. Poner Blinds
    await alice.waitAction('askForBlindBets')
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))

    await bob.waitAction('askForBlindBets')
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))

    // 4. Esperar a que se repartan las cartas
    await alice.waitAction('dealtPrivateCards')

    // 5. Turno de apuestas - Alice iguala (Call)
    // Aumentamos el timeout porque el servidor tiene retardos deliberados (setTimeout)
    await alice.waitAction('bettingCore-firstBetting', 5000)
    alice.send(MOCK_ACTIONS.CALL)

    // 6. Turno de Bob - Pasa (Check)
    await bob.waitAction('bettingCore-firstBetting', 5000)
    bob.send(MOCK_ACTIONS.CHECK)

    // 7. Verificar el Flop y el Pot
    // Cuando Bob hace check y la ronda termina, el servidor debe repartir el Flop
    const flopMsg = await alice.waitAction('dealerHand-flop', 5000)
    expect(flopMsg.message.pot).toBe(40)
    expect(flopMsg.message.dealerCards.length).toBe(3) // El Flop tiene 3 cartas
  }, 25000)
})
