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

    const waitAction = (action, timeout = 3000, filterFn = null) => {
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

  it('debería permitir que un jugador con pocas fichas vaya All-In en las ciegas y gane', async () => {
    const gameCode = 'all-in-test-' + Math.random().toString(36).substring(7)

    const shorty = createClient({ name: 'Shorty', secretCode: '1111' }, gameCode)
    const p1 = createClient({ name: 'P1', secretCode: '2222' }, gameCode)
    const p2 = createClient({ name: 'P2', secretCode: '3333' }, gameCode)
    const p3 = createClient({ name: 'P3', secretCode: '4444' }, gameCode)

    await Promise.all([
      new Promise((r) => shorty.ws.on('open', r)),
      new Promise((r) => p1.ws.on('open', r)),
      new Promise((r) => p2.ws.on('open', r)),
      new Promise((r) => p3.ws.on('open', r)),
    ])

    // 1. Registro con montos específicos
    shorty.send(MOCK_ACTIONS.SIGN_UP(5)) // Solo 5 fichas
    p1.send(MOCK_ACTIONS.SIGN_UP(100))
    p2.send(MOCK_ACTIONS.SIGN_UP(100))
    p3.send(MOCK_ACTIONS.SIGN_UP(100))

    await Promise.all([
      shorty.waitAction('signUp'),
      p1.waitAction('signUp'),
      p2.waitAction('signUp'),
      p3.waitAction('signUp'),
    ])

    // 2. Iniciar juego
    shorty.send(MOCK_ACTIONS.START_GAME)
    p1.send(MOCK_ACTIONS.START_GAME)
    p2.send(MOCK_ACTIONS.START_GAME)
    p3.send(MOCK_ACTIONS.START_GAME)

    // 3. Manejar Ciegas
    // Shorty es el primero (Small Blind - 10) -> Debería ir All-In con sus 5 fichas
    await shorty.waitAction('askForBlindBets')
    shorty.send(MOCK_ACTIONS.SMALL_BLIND(5))

    const allInMsg = await p1.waitAction('setCall') // Call automático o All-In
    const shortyState = allInMsg.message.players.find(p => p.name === 'Shorty')
    expect(shortyState.chips).toBe(0)
    expect(shortyState.isAllIn).toBe(true)
    expect(shortyState.currentBet).toBe(5)

    // P1 pone Big Blind (20)
    await p1.waitAction('askForBlindBets')
    p1.send(MOCK_ACTIONS.BIG_BLIND(20))

    // 4. Repartir cartas
    await shorty.waitAction('dealtPrivateCards')

    // 5. Ronda de apuestas - Otros hacen Fold para que Shorty gane
    // Turno de P2
    await p2.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('P2'),
    )
    p2.send(MOCK_ACTIONS.FOLD)

    // Turno de P3
    await p3.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('P3'),
    )
    p3.send(MOCK_ACTIONS.FOLD)

    // Turno de P1
    await p1.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('P1'),
    )
    p1.send(MOCK_ACTIONS.FOLD)

    // 6. Verificar ganador
    const winnerMsg = await shorty.waitAction('winner')
    expect(winnerMsg.message.data.winners[0].name).toBe('Shorty')
    
    // El pot debería ser: 5 (Shorty) + 20 (P1) = 25
    // Nota: En una regla de side-pot real sería distinto, pero aquí validamos que Shorty recibe el dinero.
    expect(winnerMsg.message.data.winners[0].amount).toBeGreaterThan(5)
    
    const finalShorty = winnerMsg.message.players.find(p => p.name === 'Shorty')
    expect(finalShorty.chips).toBeGreaterThan(5)
  }, 30000)

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

    // Iniciar juego - AMBOS deben estar listos
    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)
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
    bob.send(MOCK_ACTIONS.START_GAME)

    // 3. Poner Blinds
    await alice.waitAction('askForBlindBets', 3000, (r) =>
      r.message.data?.displayMsg?.includes(MOCK_PLAYERS.ALICE.name),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))

    await bob.waitAction('askForBlindBets', 3000, (r) =>
      r.message.data?.displayMsg?.includes(MOCK_PLAYERS.BOB.name),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))

    // 4. Esperar a que se repartan las cartas
    await alice.waitAction('dealtPrivateCards')

    // 5. Turno de apuestas - Alice iguala (Call)
    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes(MOCK_PLAYERS.ALICE.name),
    )
    alice.send(MOCK_ACTIONS.CALL)

    // 6. Turno de Bob - Pasa (Check)
    await bob.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes(MOCK_PLAYERS.BOB.name),
    )
    bob.send(MOCK_ACTIONS.CHECK)

    // 7. Verificar el Flop y el Pot
    // Cuando Bob hace check y la ronda termina, el servidor debe repartir el Flop
    const flopMsg = await alice.waitAction('dealerHand-flop', 5000)
    expect(flopMsg.message.pot).toBe(40)
    expect(flopMsg.message.dealerCards.length).toBe(3) // El Flop tiene 3 cartas
  }, 25000)
})
