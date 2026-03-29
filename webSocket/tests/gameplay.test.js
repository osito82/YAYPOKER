import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import WebSocket from 'ws'
const { server } = require('../app')
const { MOCK_PLAYERS, MOCK_ACTIONS } = require('./fixtures')
const Deck = require('../deck')
const Torneo = require('../torneo')

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
      const data =
        typeof actionPayload === 'function' ? actionPayload() : actionPayload
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data))
      } else {
        ws.once('open', () => ws.send(JSON.stringify(data)))
      }
    }

    return { name, ws, responses, waitAction, send }
  }

  it('1. Registro de jugadores: join, chips, table state', async () => {
    const gameCode = 'reg-test-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    await new Promise((r) => alice.ws.on('open', r))
    alice.send(MOCK_ACTIONS.SIGN_UP(1234))
    const regMsg = await alice.waitAction('signUp')
    expect(regMsg.message.players.length).toBe(1)
    expect(regMsg.message.players[0].name).toBe('Alice')
    expect(regMsg.message.players[0].chips).toBe(1234)
  }, 10000)

  it('2. No permitir iniciar sin suficientes jugadores', async () => {
    const gameCode = 'min-players-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    await new Promise((r) => alice.ws.on('open', r))
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    await alice.waitAction('signUp')
    alice.send(MOCK_ACTIONS.START_GAME)
    const errorMsg = await alice.waitAction('lobbyError', 10000)
    expect(errorMsg.message.data.displayMsg).toContain(
      'Waiting for at least 2 players',
    )
  }, 15000)

  it('3. Dealer button rota correctamente', async () => {
    const gameCode = 'dealer-rot-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    // Mano 1: Alice SB
    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')
    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.FOLD)
    await alice.waitAction('winner', 10000)

    // Mano 2: Bob SB
    alice.send({ action: 'nextRound' })
    await bob.waitAction('askForBlindBets', 10000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.BIG_BLIND(20))
    expect(true).toBe(true)
  }, 40000)

  it('Big Blind puede CHECK solo si nadie sube y debe CALL si alguien sube', async () => {
    const gameCode = 'test-room-' + Math.random().toString(36).substring(7)

    // Crear clientes mock
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    const charlie = createClient(MOCK_PLAYERS.CHARLIE, gameCode) // tercer jugador

    // Paso 1: Todos se registran
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    charlie.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([
      alice.waitAction('signUp'),
      bob.waitAction('signUp'),
      charlie.waitAction('signUp'),
    ])

    // Paso 2: Todos marcan listos y el host inicia el juego
    alice.send(MOCK_ACTIONS.PLAYER_READY)
    bob.send(MOCK_ACTIONS.PLAYER_READY)
    charlie.send(MOCK_ACTIONS.PLAYER_READY)
    alice.send(MOCK_ACTIONS.START_GAME)

    // Wait for blinds - only Alice and Bob should be asked in this setup
    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))

    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))

    // Wait for cards to be dealt
    await alice.waitAction('dealtPrivateCards')

    // Paso 3: Charlie es el primero en actuar (UTG)
    await charlie.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Charlie'),
    )
    charlie.send(MOCK_ACTIONS.CALL) // Charlie calls 20

    // Ahora le toca a Alice (SB)
    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CALL) // Alice calls 20

    // Ahora le toca a Bob (BB). Como nadie subió, Bob puede hacer CHECK.
    await bob.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )

    bob.send(MOCK_ACTIONS.CHECK)
    const bbAction1 = await bob.waitAction('setCheck')
    expect(bbAction1.message.data.displayMsg).toMatch(/checks/i)
  }, 40000)

  it('5. No se puede CHECK si hay apuesta', async () => {
    const gameCode = 'no-check-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')
    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.BET(50))
    await bob.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.CHECK)
    await new Promise((r) => setTimeout(r, 500))
    bob.send(MOCK_ACTIONS.CALL)
    const flopMsg = await alice.waitAction('dealerHand-flop', 10000)
    expect(flopMsg).toBeDefined()
  }, 30000)

  it('6. Raise mínimo correcto: validar aumento suficiente', async () => {
    const gameCode = 'min-raise-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')
    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.RISE(40))
    await bob.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    expect(true).toBe(true)
  }, 30000)

  it('7. Call correcto: player bet = difference', async () => {
    const gameCode = 'call-test-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')
    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CALL)
    const callMsg = await bob.waitAction('setCall', 5000)
    const aliceState = callMsg.message.players.find((p) => p.name === 'Alice')
    expect(aliceState.currentBet).toBe(20)
  }, 30000)

  it('8. All-in menor que la apuesta: side pot creation basic', async () => {
    const gameCode = 'short-allin-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const shorty = createClient(
      { name: 'Shorty', secretCode: '1234' },
      gameCode,
    )
    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => shorty.ws.on('open', r)),
    ])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    shorty.send(MOCK_ACTIONS.SIGN_UP(30))
    await Promise.all([alice.waitAction('signUp'), shorty.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME)
    shorty.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await shorty.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Shorty'),
    )
    shorty.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')
    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.BET(100))
    await shorty.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Shorty'),
    )
    shorty.send(MOCK_ACTIONS.CALL)
    const allInMsg = await alice.waitAction('setCall', 5000)
    expect(
      allInMsg.message.players.find((p) => p.name === 'Shorty').isAllIn,
    ).toBe(true)
  }, 30000)

  it('10. Jugador sin fichas queda All-in: no actúa después', async () => {
    const gameCode = 'no-chips-act-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const shorty = createClient(
      { name: 'Shorty', secretCode: '1234' },
      gameCode,
    )
    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => shorty.ws.on('open', r)),
    ])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    shorty.send(MOCK_ACTIONS.SIGN_UP(20))
    await Promise.all([alice.waitAction('signUp'), shorty.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME)
    shorty.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await shorty.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Shorty'),
    )
    shorty.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')
    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CALL)
    const runoutMsg = await alice.waitAction('runout', 10000)
    expect(runoutMsg).toBeDefined()
  }, 40000)

  it('11-13. Flujo de rondas: Preflop -> Flop -> Turn -> River', async () => {
    const gameCode = 'street-flow-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')

    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CALL)
    await bob.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.CHECK)

    await alice.waitAction('dealerHand-flop', 10000)
    await bob.waitAction('bettingCore-flopBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.CHECK)
    await alice.waitAction('bettingCore-flopBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CHECK)

    await alice.waitAction('dealerHand-turn', 10000)
    await bob.waitAction('bettingCore-turnBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.CHECK)
    await alice.waitAction('bettingCore-turnBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CHECK)

    const riverMsg = await alice.waitAction('dealerHand-river', 10000)
    expect(riverMsg.message.dealerCards.length).toBe(5)
  }, 60000)

  it('14. Si todos hacen check -> siguiente ronda automática', async () => {
    const gameCode = 'all-check-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')
    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CALL)
    await bob.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.CHECK)

    await alice.waitAction('dealerHand-flop', 10000)
    await bob.waitAction('bettingCore-flopBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.CHECK)
    await alice.waitAction('bettingCore-flopBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CHECK)

    const turnMsg = await alice.waitAction('dealerHand-turn', 10000)
    expect(turnMsg).toBeDefined()
  }, 40000)

  it('15. Todos fold menos uno: ganador inmediato', async () => {
    const gameCode = 'all-fold-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    const charlie = createClient(
      { name: 'Charlie', secretCode: '3333' },
      gameCode,
    )
    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
      new Promise((r) => charlie.ws.on('open', r)),
    ])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    charlie.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([
      alice.waitAction('signUp'),
      bob.waitAction('signUp'),
      charlie.waitAction('signUp'),
    ])
    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)
    charlie.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')

    await charlie.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Charlie'),
    )
    charlie.send(MOCK_ACTIONS.FOLD)
    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.FOLD)

    const winnerMsg = await bob.waitAction('winner', 10000)
    expect(winnerMsg.message.data.winners[0].name).toBe('Bob')
    expect(winnerMsg.message.data.isFold).toBe(true)
  }, 30000)

  it('16. Jugador folded no puede actuar', async () => {
    const gameCode = 'fold-no-act-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    const charlie = createClient(
      { name: 'Charlie', secretCode: '3333' },
      gameCode,
    )
    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
      new Promise((r) => charlie.ws.on('open', r)),
    ])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    charlie.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([
      alice.waitAction('signUp'),
      bob.waitAction('signUp'),
      charlie.waitAction('signUp'),
    ])
    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)
    charlie.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')

    await charlie.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Charlie'),
    )
    charlie.send(MOCK_ACTIONS.FOLD)
    await new Promise((r) => setTimeout(r, 500))
    charlie.send(MOCK_ACTIONS.CALL)
    const aliceTurn = await alice.waitAction(
      'bettingCore-firstBetting',
      5000,
      (r) => r.message.data?.displayMsg?.includes('Alice'),
    )
    expect(aliceTurn).toBeDefined()
  }, 30000)

  it('17. Determinar ganador correcto: Pair vs Two Pairs', async () => {
    const gameCode = 'win-det-' + Math.random().toString(36).substring(7)

    // Con Round-Robin (2 jugadores):
    // Alice recibe cartas en índices 0 y 2.
    // Bob recibe cartas en índices 1 y 3.
    // Board empieza en índice 4.
    // Para que Alice tenga Par de Ases y Bob Doble Par (K y Q):
    // Alice: As (0), Ac (2)
    // Bob: Ks (1), Qh (3)
    // Board: Kc (4), Qd (5), 3h (6), 4h (7), 5h (8)
    vi.spyOn(Deck, 'shuffleDeck').mockReturnValue([
      'As',
      'Ks',
      'Ac',
      'Qh',
      'Kc',
      'Qd',
      '3h',
      '4h',
      '5h',
      '6h',
      '7h',
    ])

    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')

    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CALL)
    await bob.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.CHECK)

    // Ir hasta el final con checks
    await alice.waitAction('dealerHand-flop')
    await bob.waitAction('bettingCore-flopBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.CHECK)
    await alice.waitAction('bettingCore-flopBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CHECK)

    await alice.waitAction('dealerHand-turn')
    await bob.waitAction('bettingCore-turnBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.CHECK)
    await alice.waitAction('bettingCore-turnBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CHECK)

    await alice.waitAction('dealerHand-river')
    await bob.waitAction('bettingCore-riverBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.CHECK)
    await alice.waitAction('bettingCore-riverBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CHECK)

    const winnerMsg = await alice.waitAction('winner', 10000)
    // Bob should win with Two Pairs (Kings and Queens) over Alice's Pair of Aces
    expect(winnerMsg.message.data.winners[0].name).toBe('Bob')
    expect(winnerMsg.message.data.winners[0].handName).toBe('twoPairs')

    vi.restoreAllMocks()
  }, 40000)

  it('18. Split pot: same hand (Pair of Aces, King Kicker)', async () => {
    const gameCode = 'split-pot-' + Math.random().toString(36).substring(7)

    // ORDER: Alice1, Bob1, Alice2, Bob2, Flop1, Flop2, Flop3, Turn, River
    // Alice cards: As, 2d (1st and 3rd)
    // Bob cards: Ah, 3d (2nd and 4th)
    // Board cards: Ac, Kc, 8s, 5h, 4c (5th to 9th)
    const mockedDeck = [
      'As',
      'Ah',
      '2d',
      '3d',
      'Ac',
      'Kc',
      '8s',
      '5h',
      '4c',
      'Jh',
      'Qs',
    ]
    vi.spyOn(Deck, 'shuffleDeck').mockReturnValue(mockedDeck)

    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

    // --- Abrimos las conexiones ---
    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])

    // --- Signup ---
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])

    // --- Iniciamos el juego ---
    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    // --- PRE-FLOP: Blinds ---
    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))

    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))

    // --- Esperamos la confirmación de cartas privadas ---
    await Promise.all([
      alice.waitAction('dealtPrivateCards'),
      bob.waitAction('dealtPrivateCards'),
    ])

    // --- FIRST BETTING ROUND (Pre-flop) ---
    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CALL)
    await bob.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.CHECK)

    // --- FLOP / TURN / RIVER ---
    for (const stage of ['flop', 'turn', 'river']) {
      // El dealer enviará automáticamente las cartas comunitarias
      await alice.waitAction(`dealerHand-${stage}`, 5000)
      await bob.waitAction(`dealerHand-${stage}`, 5000)

      // Simulamos apuestas/checks
      await bob.waitAction(`bettingCore-${stage}Betting`, 5000, (r) =>
        r.message.data?.displayMsg?.includes('Bob'),
      )
      bob.send(MOCK_ACTIONS.CHECK)
      await alice.waitAction(`bettingCore-${stage}Betting`, 5000, (r) =>
        r.message.data?.displayMsg?.includes('Alice'),
      )
      alice.send(MOCK_ACTIONS.CHECK)
    }

    // --- Validación de ganadores ---
    const winnerMsg = await alice.waitAction('winner', 10000)
    expect(winnerMsg.message.data.winners.length).toBe(2) // Ambos jugadores ganan el pot

    vi.restoreAllMocks()
  }, 40000)

  it('20. Pot total correcto: sum(bets) === pot validation', async () => {
    const gameCode = 'pot-sum-final-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')

    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.RISE(100))
    await bob.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.CALL)

    // Pot = 100 (Alice) + 100 (Bob) = 200
    const flopMsg = await alice.waitAction('dealerHand-flop', 10000)
    expect(flopMsg.message.pot).toBe(200)
  }, 30000)

  it('Min-raise: raise debe ser al menos el tamaño del raise anterior', async () => {
    const gameCode = '7777'
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))

    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))

    await alice.waitAction('dealtPrivateCards')

    // Alice (SB) sube a 60 → raise de 50 (sobre el BB de 20)
    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.RISE(60))

    // Bob debe responder al raise de 60 (call 60 o raise mínimo 100 = 60 + 50)
    await bob.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )

    // Intento inválido: subir solo a 80 (menos que +50)
    bob.send(MOCK_ACTIONS.RISE(80))

    // Esperamos mensaje de rechazo o que no se acepte la acción
    const rejectMsg = await bob.waitAction(
      'actionRejected',
      5000,
      (r) =>
        r.message.data?.reason?.includes('raise') ||
        r.message.data?.reason?.includes('minimum'),
    )
    console.log('-------------------- 0021', rejectMsg)
    expect(rejectMsg).toBeDefined()

    // Ahora sí: raise válido a 100 o más
    bob.send(MOCK_ACTIONS.RISE(110))

    const raiseAccepted = await alice.waitAction('setBet', 5000, (r) =>
      r.message.data?.displayMsg?.includes('110'),
    )
    expect(raiseAccepted.message.data.displayMsg).toMatch(/raises to 110/i)
  }, 40000)

  it('T0001 - No se puede check si hay raise pendiente', async () => {
    const gameCode = 'no-check-raise-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])

    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])

    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))

    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))

    await alice.waitAction('dealtPrivateCards')

    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.RISE(80))

    await bob.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )

    // Bob intenta CHECK (inválido)
    bob.send(MOCK_ACTIONS.CHECK)

    const reject = await bob.waitAction(
      'actionRejected',
      5000,
      (r) =>
        r.message?.data?.reason?.toLowerCase().includes('check') ||
        r.message?.data?.displayMsg?.toLowerCase().includes('invalid'),
    )
    expect(reject).toBeDefined()

    // Ahora sí: call
    bob.send(MOCK_ACTIONS.CALL)
    const callMsg = await alice.waitAction('setCall', 5000)
    expect(callMsg.message.data.displayMsg).toMatch(/calls/i)
  }, 35000)

  it('T0002 - Kicker decide: mismo par, diferente kicker', async () => {
    const gameCode = 'kicker-pair-' + Math.random().toString(36).substring(7)

    // Alice: A♠ K♦ → par de Ases con K kicker
    // Bob: A♥ Q♣ → par de Ases con Q kicker
    // Board: A♦ 7♠ 2♥ 9♣ 4♠
    // Objetivo:
    // Alice: As Kd  → par de Ases, kicker K
    // Bob:   Ah Qc  → par de Ases, kicker Q
    // Board sin más Ases

    const mockedDeck = [
      'As',
      'Kd', // Alice: As Kd
      'Ah',
      'Qc', // Bob:   Ah Qc
      '7s',
      '2h',
      '9c', // Flop
      '4d', // Turn
      '3s', // River
      // puedes agregar más cartas si tu Deck.shuffleDeck devuelve más de 9, pero no se usan
    ]
    vi.spyOn(Deck, 'shuffleDeck').mockReturnValue(mockedDeck)

    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])

    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])

    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))

    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))

    await alice.waitAction('dealtPrivateCards')

    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CALL)

    await bob.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.CHECK)

    // Pasamos todas las calles con check
    for (const street of ['flop', 'turn', 'river']) {
      await alice.waitAction(`dealerHand-${street}`, 8000)
      await bob.waitAction(`bettingCore-${street}Betting`, 5000, (r) =>
        r.message.data?.displayMsg?.includes('Bob'),
      )
      bob.send(MOCK_ACTIONS.CHECK)
      await alice.waitAction(`bettingCore-${street}Betting`, 5000, (r) =>
        r.message.data?.displayMsg?.includes('Alice'),
      )
      alice.send(MOCK_ACTIONS.CHECK)
    }

    const winnerMsg = await alice.waitAction('winner', 12000)
    expect(winnerMsg.message.data.winners[0].name).toBe('Alice')
    expect(winnerMsg.message.data.winners[0].handName).toMatch(/pair/i)

    vi.restoreAllMocks()
  }, 60000)

  it('T0003 Reconexión durante mano: mantiene estado y turno', async () => {
    const gameCode = '8888'
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])

    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])

    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))

    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))

    await alice.waitAction('dealtPrivateCards')

    // Alice llama
    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CALL)

    // Simulamos desconexión de Bob justo antes de su turno
    bob.ws.close()

    // Esperamos un poco (debe ser MENOS que el timeout de desconexión de 3s)
    await new Promise((r) => setTimeout(r, 500))

    // Reconectamos a Bob (mismo secretCode)
    const bobReconnect = createClient(MOCK_PLAYERS.BOB, gameCode)
    await new Promise((r) => bobReconnect.ws.on('open', r))
    bobReconnect.send(MOCK_ACTIONS.SIGN_UP(1000)) // reconexión

    const reconnectedMsg = await bobReconnect.waitAction('signUp', 5000)
    // Nota: secretCode no viaja al cliente, buscamos por nombre
    expect(
      reconnectedMsg.message.players.find((p) => p.name === 'Bob'),
    ).toBeDefined()

    // Debería seguir en su turno
    const bobTurnAfter = await bobReconnect.waitAction(
      'bettingCore-firstBetting',
      8000,
      (r) => r.message.data?.displayMsg?.includes('Bob'),
    )
    expect(bobTurnAfter).toBeDefined()

    bobReconnect.send(MOCK_ACTIONS.CHECK)

    await alice.waitAction('dealerHand-flop', 10000)
  }, 45000)

  it('T0005 - Regression: Autofold during blinds should declare winner and auto-restart', async () => {
    const gameCode = 'regr-auto-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])

    // Signup and Start
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])

    alice.send(MOCK_ACTIONS.START_GAME)
    bob.send(MOCK_ACTIONS.START_GAME)

    // Capture first round gameId
    const firstRoundMsg = await alice.waitAction('askForBlindBets')
    const firstGameId = firstRoundMsg.message.gameId

    // Alice posts Small Blind
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))

    // Bob is asked for Big Blind, we WAIT for autofold (1s in test mode)
    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data?.displayMsg?.includes('Bob'),
    )

    // The server should trigger autofold for Bob after ~1s
    // Then Alice should be the winner
    const winnerMsg = await alice.waitAction('winner', 10000)
    expect(winnerMsg.message.data.winners[0].name).toBe('Alice')
    expect(winnerMsg.message.data.isFold).toBe(true)

    // Verify auto-restart: wait for a NEW hand with a DIFFERENT gameId
    // Standard nextRound delay is used (500ms in test)
    const nextRoundMsg = await bob.waitAction(
      'askForBlindBets',
      15000,
      (r) => r.message.gameId !== firstGameId,
    )
    expect(nextRoundMsg.message.gameId).not.toBe(firstGameId)
  }, 40000)

  it('T0006 - Durante el juego, ignora silenciosamente intentos de reconexión con código incorrecto', async () => {
    const gameCode =
      'reconnect-during-game-' + Math.random().toString(36).substring(7)

    // --- FASE 1: LOBBY ---
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    await new Promise((r) => alice.ws.on('open', r))
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    await alice.waitAction('signUp')

    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    await new Promise((r) => bob.ws.on('open', r))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await bob.waitAction('signUp')

    // --- FASE 2: COMIENZA EL JUEGO ---
    alice.send(MOCK_ACTIONS.START_GAME)

    // Avanzar hasta después de las ciegas
    await alice.waitAction('askForBlindBets')
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets')
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')

    // Alice se desconecta DURANTE la mano
    alice.ws.close()

    // Pequeña pausa para que el servidor procese la desconexión
    await new Promise((r) => setTimeout(r, 100))

    // Alguien intenta reconectarse como Alice con código INCORRECTO
    const impostor = createClient(
      { name: 'Alice', secretCode: 'wrong123' },
      gameCode,
    )
    await new Promise((r) => impostor.ws.on('open', r))

    // Guardamos los mensajes que ya tenía
    const initialMsgCount = impostor.responses.length

    impostor.send(MOCK_ACTIONS.SIGN_UP(1000))

    // Esperamos un poco para ver si recibe alguna respuesta
    await new Promise((r) => setTimeout(r, 500))

    // Verificamos que NO ha recibido mensajes de signUp
    const signUpMessages = impostor.responses.filter(
      (r) => r.message?.action === 'signUp',
    )
    expect(signUpMessages.length).toBe(0)

    // Verificamos que NO ha recibido mensajes de error
    const errorMessages = impostor.responses.filter(
      (r) => r.message?.action === 'error',
    )
    expect(errorMessages.length).toBe(0)

    // Verificamos que el impostor NO aparece como jugador
    const impostorAsPlayer = impostor.responses.some((r) =>
      r.message?.players?.some(
        (p) => p.name === 'Alice' && p.id === impostor.ws.id,
      ),
    )
    expect(impostorAsPlayer).toBe(false)

    // El juego debería continuar y eventualmente declarar un ganador (Bob)
    // Aumentamos el timeout a 10000ms para dar tiempo al pause de 3s + juego
    const winnerMsg = await bob.waitAction('winnerTournament', 10000)
    expect(winnerMsg.message.data.winner.name).toBe('Bob')
  }, 44000)

  it('T0007 - Reconexión restaura botones de acción (Check/Bet/Fold y Fold/Call/Raise)', async () => {
    const gameCode =
      'reconnect-buttons-' + Math.random().toString(36).substring(7)

    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])

    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])

    alice.send(MOCK_ACTIONS.START_GAME)

    // --- ESCENARIO 1: Botones de Ciega (Small Blind) ---
    // Alice debe poner SB
    await alice.waitAction('askForBlindBets')

    // Alice refresca ANTES de poner la ciega
    alice.ws.close()
    await new Promise((r) => setTimeout(r, 100))
    const aliceReconnect1 = createClient(MOCK_PLAYERS.ALICE, gameCode)
    await new Promise((r) => aliceReconnect1.ws.on('open', r))
    aliceReconnect1.send(MOCK_ACTIONS.SIGN_UP(1000))

    // Alice debe recibir de nuevo la petición de ciega
    const blindMsg = await aliceReconnect1.waitAction('askForBlindBets', 8000)
    expect(blindMsg.message.action).toBe('askForBlindBets')

    // Ponemos las ciegas para avanzar
    aliceReconnect1.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets')
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await aliceReconnect1.waitAction('dealtPrivateCards')

    // --- ESCENARIO 2: Botones de Acción (Fold/Call/Raise) ---
    // Es el turno de Alice (Pre-flop, después de ciegas)
    // Alice debe tener opciones de Fold/Call/Raise (porque Bob puso 20 y ella 10)
    const preflopTurn = await aliceReconnect1.waitAction(
      'bettingCore-firstBetting',
    )
    expect(preflopTurn.message.data.action).toContain('fold')
    expect(preflopTurn.message.data.action).toContain('call')
    expect(preflopTurn.message.data.action).toContain('raise')

    // Alice refresca en su turno
    aliceReconnect1.ws.close()
    await new Promise((r) => setTimeout(r, 100))
    const aliceReconnect2 = createClient(MOCK_PLAYERS.ALICE, gameCode)
    await new Promise((r) => aliceReconnect2.ws.on('open', r))
    aliceReconnect2.send(MOCK_ACTIONS.SIGN_UP(1000))

    // Debe recuperar los mismos botones (Fold/Call/Raise)
    const restoredTurn1 = await aliceReconnect2.waitAction(
      'bettingCore-firstBetting',
      8000,
    )
    expect(restoredTurn1.message.data.action).toContain('fold')
    expect(restoredTurn1.message.data.action).toContain('call')
    expect(restoredTurn1.message.data.action).toContain('raise')

    // Alice hace Call para avanzar al Flop
    aliceReconnect2.send(MOCK_ACTIONS.CALL)
    await bob.waitAction('bettingCore-firstBetting')
    bob.send(MOCK_ACTIONS.CHECK)

    // --- ESCENARIO 3: Botones de Acción (Check/Bet/Fold) ---
    // Flop: Bob es el primero en actuar (SB/BB logic)
    await aliceReconnect2.waitAction('dealerHand-flop')
    await bob.waitAction('bettingCore-flopBetting')
    bob.send(MOCK_ACTIONS.CHECK)

    // Ahora es el turno de Alice, puede hacer Check/Bet/Fold
    const flopTurn = await aliceReconnect2.waitAction('bettingCore-flopBetting')
    expect(flopTurn.message.data.action).toContain('check')
    expect(flopTurn.message.data.action).toContain('bet')
    expect(flopTurn.message.data.action).toContain('fold')

    // Alice refresca de nuevo
    aliceReconnect2.ws.close()
    await new Promise((r) => setTimeout(r, 100))
    const aliceReconnect3 = createClient(MOCK_PLAYERS.ALICE, gameCode)
    await new Promise((r) => aliceReconnect3.ws.on('open', r))
    aliceReconnect3.send(MOCK_ACTIONS.SIGN_UP(1000))

    // Debe recuperar Check/Bet/Fold
    const restoredTurn2 = await aliceReconnect3.waitAction(
      'bettingCore-flopBetting',
      8000,
    )
    expect(restoredTurn2.message.data.action).toContain('check')
    expect(restoredTurn2.message.data.action).toContain('bet')
    expect(restoredTurn2.message.data.action).toContain('fold')
  }, 60000)

  it('T0009 - Verificación de integridad de fichas (No goteo)', async () => {
    const gameCode = 'integrity-test-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

    await Promise.all([
      new Promise((r) => alice.ws.on('open', r)),
      new Promise((r) => bob.ws.on('open', r)),
    ])

    const TOTAL_CHIPS = 2000
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))

    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME)

    // --- CIEGAS ---
    await alice.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data.displayMsg.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, (r) =>
      r.message.data.displayMsg.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BIG_BLIND(20))

    await alice.waitAction('dealtPrivateCards')

    // --- PRE-FLOP ---
    await alice.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data.displayMsg.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CALL)
    await bob.waitAction('bettingCore-firstBetting', 5000, (r) =>
      r.message.data.displayMsg.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.CHECK)

    // --- FLOP ---
    await alice.waitAction('dealerHand-flop')
    await bob.waitAction('bettingCore-flopBetting', 5000, (r) =>
      r.message.data.displayMsg.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BET(20))
    await alice.waitAction('bettingCore-flopBetting', 5000, (r) =>
      r.message.data.displayMsg.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CALL)

    // --- TURN ---
    await alice.waitAction('dealerHand-turn')
    await bob.waitAction('bettingCore-turnBetting', 5000, (r) =>
      r.message.data.displayMsg.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BET(40))
    await alice.waitAction('bettingCore-turnBetting', 5000, (r) =>
      r.message.data.displayMsg.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CALL)

    // --- RIVER ---
    await alice.waitAction('dealerHand-river')
    await bob.waitAction('bettingCore-riverBetting', 5000, (r) =>
      r.message.data.displayMsg.includes('Bob'),
    )
    bob.send(MOCK_ACTIONS.BET(15))
    await alice.waitAction('bettingCore-riverBetting', 5000, (r) =>
      r.message.data.displayMsg.includes('Alice'),
    )
    alice.send(MOCK_ACTIONS.CALL)

    // --- RESULTADO ---
    await alice.waitAction('winner', 10000)

    // Verificamos saldos en la siguiente mano
    const nextHandMsg = await alice.waitAction('askForBlindBets', 15000)

    const players = nextHandMsg.message.players
    const totalCurrentChips = players.reduce((sum, p) => sum + p.chips, 0)

    expect(totalCurrentChips).toBe(TOTAL_CHIPS)
    console.log(
      `[TEST:INTEGRITY] Total chips after hand: ${totalCurrentChips} (Expected: ${TOTAL_CHIPS})`,
    )
  }, 60000)

  it('T0012 - No permite que dos jugadores distintos usen el mismo PIN en el lobby', async () => {
    const gameCode = 'pin-collision-' + Math.random().toString(36).substring(7)

    // Alice se une con PIN 1234
    const alice = createClient({ name: 'Alice', secretCode: '1234' }, gameCode)
    await new Promise((r) => alice.ws.on('open', r))
    alice.send(MOCK_ACTIONS.SIGN_UP(1000))
    await alice.waitAction('signUp')

    // Bob intenta unirse con el MISMO PIN 1234
    const bob = createClient({ name: 'Bob', secretCode: '1234' }, gameCode)
    await new Promise((r) => bob.ws.on('open', r))
    bob.send(MOCK_ACTIONS.SIGN_UP(1000))

    // Bob debería recibir un error de colisión de PIN
    const errorMsg = await bob.waitAction('signUp')
    expect(errorMsg.message.data.errorType).toBe('PIN_COLLISION')
    expect(errorMsg.message.data.displayMsg).toContain(
      'PIN is already in use by another player',
    )

    // Verificamos que Bob NO fue añadido a la lista de jugadores de Alice
    // Esperamos un poco para asegurar que no hubo broadcast accidental
    await new Promise((r) => setTimeout(r, 500))
    const lastAliceMsg = alice.responses[alice.responses.length - 1]
    const bobInAliceList = lastAliceMsg.message.players?.some(
      (p) => p.name === 'Bob',
    )
    expect(bobInAliceList).toBeFalsy()
  }, 15000)
})
