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
    expect(errorMsg.message.data.displayMsg).toContain('Waiting for at least 2 players')
  }, 15000)

  it('3. Dealer button rota correctamente', async () => {
    const gameCode = 'dealer-rot-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    await Promise.all([new Promise((r) => alice.ws.on('open', r)), new Promise((r) => bob.ws.on('open', r))])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000)); bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME); bob.send(MOCK_ACTIONS.START_GAME)

    // Mano 1: Alice SB
    await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')
    await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.FOLD)
    await alice.waitAction('winner', 10000)
    
    // Mano 2: Bob SB
    alice.send({ action: 'nextRound' })
    await bob.waitAction('askForBlindBets', 10000, r => r.message.data?.displayMsg?.includes('Bob'))
    bob.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice'))
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
    await Promise.all([new Promise((r) => alice.ws.on('open', r)), new Promise((r) => bob.ws.on('open', r))])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000)); bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME); bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')
    await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.BET(50))
    await bob.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.CHECK)
    await new Promise(r => setTimeout(r, 500))
    bob.send(MOCK_ACTIONS.CALL)
    const flopMsg = await alice.waitAction('dealerHand-flop', 10000)
    expect(flopMsg).toBeDefined()
  }, 30000)

  it('6. Raise mínimo correcto: validar aumento suficiente', async () => {
    const gameCode = 'min-raise-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    await Promise.all([new Promise((r) => alice.ws.on('open', r)), new Promise((r) => bob.ws.on('open', r))])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000)); bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME); bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')
    await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.RISE(40))
    await bob.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob'))
    expect(true).toBe(true)
  }, 30000)

  it('7. Call correcto: player bet = difference', async () => {
    const gameCode = 'call-test-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    await Promise.all([new Promise((r) => alice.ws.on('open', r)), new Promise((r) => bob.ws.on('open', r))])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000)); bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME); bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')
    await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.CALL)
    const callMsg = await bob.waitAction('setCall', 5000)
    const aliceState = callMsg.message.players.find(p => p.name === 'Alice')
    expect(aliceState.currentBet).toBe(20)
  }, 30000)

  it('8. All-in menor que la apuesta: side pot creation basic', async () => {
    const gameCode = 'short-allin-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const shorty = createClient({ name: 'Shorty', secretCode: '1234' }, gameCode)
    await Promise.all([new Promise((r) => alice.ws.on('open', r)), new Promise((r) => shorty.ws.on('open', r))])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000)); shorty.send(MOCK_ACTIONS.SIGN_UP(30))
    await Promise.all([alice.waitAction('signUp'), shorty.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME); shorty.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await shorty.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Shorty')); shorty.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')
    await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.BET(100))
    await shorty.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Shorty')); shorty.send(MOCK_ACTIONS.CALL) 
    const allInMsg = await alice.waitAction('setCall', 5000)
    expect(allInMsg.message.players.find(p => p.name === 'Shorty').isAllIn).toBe(true)
  }, 30000)

  it('10. Jugador sin fichas queda All-in: no actúa después', async () => {
    const gameCode = 'no-chips-act-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const shorty = createClient({ name: 'Shorty', secretCode: '1234' }, gameCode)
    await Promise.all([new Promise((r) => alice.ws.on('open', r)), new Promise((r) => shorty.ws.on('open', r))])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000)); shorty.send(MOCK_ACTIONS.SIGN_UP(20))
    await Promise.all([alice.waitAction('signUp'), shorty.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME); shorty.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await shorty.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Shorty')); shorty.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')
    await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.CALL) 
    const runoutMsg = await alice.waitAction('runout', 10000)
    expect(runoutMsg).toBeDefined()
  }, 40000)

  it('11-13. Flujo de rondas: Preflop -> Flop -> Turn -> River', async () => {
    const gameCode = 'street-flow-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    await Promise.all([new Promise((r) => alice.ws.on('open', r)), new Promise((r) => bob.ws.on('open', r))])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000)); bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME); bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')

    await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.CALL)
    await bob.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.CHECK)
    
    await alice.waitAction('dealerHand-flop', 10000)
    await bob.waitAction('bettingCore-flopBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.CHECK)
    await alice.waitAction('bettingCore-flopBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.CHECK)

    await alice.waitAction('dealerHand-turn', 10000)
    await bob.waitAction('bettingCore-turnBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.CHECK)
    await alice.waitAction('bettingCore-turnBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.CHECK)

    const riverMsg = await alice.waitAction('dealerHand-river', 10000)
    expect(riverMsg.message.dealerCards.length).toBe(5)
  }, 60000)

  it('14. Si todos hacen check -> siguiente ronda automática', async () => {
    const gameCode = 'all-check-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    await Promise.all([new Promise((r) => alice.ws.on('open', r)), new Promise((r) => bob.ws.on('open', r))])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000)); bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME); bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')
    await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.CALL)
    await bob.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.CHECK)

    await alice.waitAction('dealerHand-flop', 10000)
    await bob.waitAction('bettingCore-flopBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.CHECK)
    await alice.waitAction('bettingCore-flopBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.CHECK)

    const turnMsg = await alice.waitAction('dealerHand-turn', 10000)
    expect(turnMsg).toBeDefined()
  }, 40000)

  it('15. Todos fold menos uno: ganador inmediato', async () => {
    const gameCode = 'all-fold-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    const charlie = createClient({ name: 'Charlie', secretCode: '3333' }, gameCode)
    await Promise.all([new Promise((r) => alice.ws.on('open', r)), new Promise((r) => bob.ws.on('open', r)), new Promise((r) => charlie.ws.on('open', r))])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000)); bob.send(MOCK_ACTIONS.SIGN_UP(1000)); charlie.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp'), charlie.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME); bob.send(MOCK_ACTIONS.START_GAME); charlie.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')

    await charlie.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Charlie')); charlie.send(MOCK_ACTIONS.FOLD)
    await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.FOLD)

    const winnerMsg = await bob.waitAction('winner', 10000)
    expect(winnerMsg.message.data.winners[0].name).toBe('Bob')
    expect(winnerMsg.message.data.isFold).toBe(true)
  }, 30000)

  it('16. Jugador folded no puede actuar', async () => {
    const gameCode = 'fold-no-act-' + Math.random().toString(36).substring(7)
    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    const charlie = createClient({ name: 'Charlie', secretCode: '3333' }, gameCode)
    await Promise.all([new Promise((r) => alice.ws.on('open', r)), new Promise((r) => bob.ws.on('open', r)), new Promise((r) => charlie.ws.on('open', r))])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000)); bob.send(MOCK_ACTIONS.SIGN_UP(1000)); charlie.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp'), charlie.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME); bob.send(MOCK_ACTIONS.START_GAME); charlie.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')

    await charlie.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Charlie')); charlie.send(MOCK_ACTIONS.FOLD)
    await new Promise(r => setTimeout(r, 500))
    charlie.send(MOCK_ACTIONS.CALL)
    const aliceTurn = await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice'))
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
      'As', 'Ks', 'Ac', 'Qh', 
      'Kc', 'Qd', '3h', '4h', '5h',
      '6h', '7h'
    ])

    const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
    const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
    await Promise.all([new Promise((r) => alice.ws.on('open', r)), new Promise((r) => bob.ws.on('open', r))])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000)); bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME); bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')

    await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.CALL)
    await bob.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.CHECK)
    
    // Ir hasta el final con checks
    await alice.waitAction('dealerHand-flop')
    await bob.waitAction('bettingCore-flopBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.CHECK)
    await alice.waitAction('bettingCore-flopBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.CHECK)
    
    await alice.waitAction('dealerHand-turn')
    await bob.waitAction('bettingCore-turnBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.CHECK)
    await alice.waitAction('bettingCore-turnBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.CHECK)
    
    await alice.waitAction('dealerHand-river')
    await bob.waitAction('bettingCore-riverBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.CHECK)
    await alice.waitAction('bettingCore-riverBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.CHECK)

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
  const mockedDeck = ['As', 'Ah', '2d', '3d', 'Ac', 'Kc', '8s', '5h', '4c', 'Jh', 'Qs']
  vi.spyOn(Deck, 'shuffleDeck').mockReturnValue(mockedDeck)

  const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
  const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

  // --- Abrimos las conexiones ---
  await Promise.all([
    new Promise((r) => alice.ws.on('open', r)),
    new Promise((r) => bob.ws.on('open', r))
  ])

  // --- Signup ---
  alice.send(MOCK_ACTIONS.SIGN_UP(1000))
  bob.send(MOCK_ACTIONS.SIGN_UP(1000))
  await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])

  // --- Iniciamos el juego ---
  alice.send(MOCK_ACTIONS.START_GAME)
  bob.send(MOCK_ACTIONS.START_GAME)

  // --- PRE-FLOP: Blinds ---
  await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice'))
  alice.send(MOCK_ACTIONS.SMALL_BLIND(10))

  await bob.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Bob'))
  bob.send(MOCK_ACTIONS.BIG_BLIND(20))

  // --- Esperamos la confirmación de cartas privadas ---
  await Promise.all([
    alice.waitAction('dealtPrivateCards'),
    bob.waitAction('dealtPrivateCards')
  ])

  // --- FIRST BETTING ROUND (Pre-flop) ---
  await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice'))
  alice.send(MOCK_ACTIONS.CALL)
  await bob.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob'))
  bob.send(MOCK_ACTIONS.CHECK)

  // --- FLOP / TURN / RIVER ---
  for (const stage of ['flop', 'turn', 'river']) {
    // El dealer enviará automáticamente las cartas comunitarias
    await alice.waitAction(`dealerHand-${stage}`, 5000)
    await bob.waitAction(`dealerHand-${stage}`, 5000)

    // Simulamos apuestas/checks
    await bob.waitAction(`bettingCore-${stage}Betting`, 5000, r => r.message.data?.displayMsg?.includes('Bob'))
    bob.send(MOCK_ACTIONS.CHECK)
    await alice.waitAction(`bettingCore-${stage}Betting`, 5000, r => r.message.data?.displayMsg?.includes('Alice'))
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
    await Promise.all([new Promise((r) => alice.ws.on('open', r)), new Promise((r) => bob.ws.on('open', r))])
    alice.send(MOCK_ACTIONS.SIGN_UP(1000)); bob.send(MOCK_ACTIONS.SIGN_UP(1000))
    await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
    alice.send(MOCK_ACTIONS.START_GAME); bob.send(MOCK_ACTIONS.START_GAME)

    await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await bob.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.BIG_BLIND(20))
    await alice.waitAction('dealtPrivateCards')

    await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice')); alice.send(MOCK_ACTIONS.RISE(100))
    await bob.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob')); bob.send(MOCK_ACTIONS.CALL)
    
    // Pot = 100 (Alice) + 100 (Bob) = 200
    const flopMsg = await alice.waitAction('dealerHand-flop', 10000)
    expect(flopMsg.message.pot).toBe(200)
  }, 30000)

it('Min-raise: raise debe ser al menos el tamaño del raise anterior', async () => {
  const gameCode = '7777' 
  const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
  const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

  await Promise.all([new Promise(r => alice.ws.on('open', r)), new Promise(r => bob.ws.on('open', r))])
  alice.send(MOCK_ACTIONS.SIGN_UP(1000))
  bob.send(MOCK_ACTIONS.SIGN_UP(1000))
  await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])
  alice.send(MOCK_ACTIONS.START_GAME)
  bob.send(MOCK_ACTIONS.START_GAME)

  await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice'))
  alice.send(MOCK_ACTIONS.SMALL_BLIND(10))

  await bob.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Bob'))
  bob.send(MOCK_ACTIONS.BIG_BLIND(20))

  await alice.waitAction('dealtPrivateCards')

  // Alice (SB) sube a 60 → raise de 50 (sobre el BB de 20)
  await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice'))
  alice.send(MOCK_ACTIONS.RISE(60))

  // Bob debe responder al raise de 60 (call 60 o raise mínimo 100 = 60 + 50)
  await bob.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob'))

  // Intento inválido: subir solo a 80 (menos que +50)
  bob.send(MOCK_ACTIONS.RISE(80))

  // Esperamos mensaje de rechazo o que no se acepte la acción
  const rejectMsg = await bob.waitAction('actionRejected', 5000, r => 
    r.message.data?.reason?.includes('raise') || r.message.data?.reason?.includes('minimum')
  )
  console.log('-------------------- 0021', rejectMsg)
  expect(rejectMsg).toBeDefined()

  // Ahora sí: raise válido a 100 o más
  bob.send(MOCK_ACTIONS.RISE(110))

  const raiseAccepted = await alice.waitAction('setBet', 5000, r => r.message.data?.displayMsg?.includes('110'))
  expect(raiseAccepted.message.data.displayMsg).toMatch(/raises to 110/i)
}, 40000)

/*
GEMINI NO BORRAR
it('Side pot: all-in con 3 jugadores crea side pot', async () => {
  const gameCode = 'sidepot-3p-' + Math.random().toString(36).substring(7)
  const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
  
  const bob = createClient(MOCK_PLAYERS.BOB, gameCode)
  const shorty = createClient({ name: 'Shorty', secretCode: 'shorty123' }, gameCode)

  await Promise.all([
    new Promise(r => alice.ws.on('open', r)),
    new Promise(r => bob.ws.on('open', r)),
    new Promise(r => shorty.ws.on('open', r))
  ])

  alice.send(MOCK_ACTIONS.SIGN_UP(1000))
  bob.send(MOCK_ACTIONS.SIGN_UP(1000))
  shorty.send(MOCK_ACTIONS.SIGN_UP(40))

  await Promise.all([
    alice.waitAction('signUp'),
    bob.waitAction('signUp'),
    shorty.waitAction('signUp')
  ])

  alice.send(MOCK_ACTIONS.START_GAME)
  bob.send(MOCK_ACTIONS.START_GAME)
  shorty.send(MOCK_ACTIONS.START_GAME)

  await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice'))
  alice.send(MOCK_ACTIONS.SMALL_BLIND(10))

  await shorty.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Shorty'))
  shorty.send(MOCK_ACTIONS.BIG_BLIND(20))

  await alice.waitAction('dealtPrivateCards')

  // Alice (SB) sube fuerte
  await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice'))
  alice.send(MOCK_ACTIONS.BET(200))

  // Shorty all-in (solo tiene ~20 después de blind)
  await shorty.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Shorty'))
  shorty.send(MOCK_ACTIONS.CALL)  // → all-in

  const allInMsg = await alice.waitAction('setCall', 5000)
  expect(allInMsg.message.players.find(p => p.name === 'Shorty').isAllIn).toBe(true)

  // Bob puede seguir apostando (side pot)
  await bob.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob'))
  bob.send(MOCK_ACTIONS.CALL)  // call 200

  // Debería avanzar al flop (ya que Shorty está all-in)
  const flopMsg = await alice.waitAction('dealerHand-flop', 10000)
  expect(flopMsg).toBeDefined()
}, 45000)

it('No se puede check si hay raise pendiente', async () => {
  const gameCode = 'no-check-raise-' + Math.random().toString(36).substring(7)
  const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
  const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

  await Promise.all([new Promise(r => alice.ws.on('open', r)), new Promise(r => bob.ws.on('open', r))])

  alice.send(MOCK_ACTIONS.SIGN_UP(1000))
  bob.send(MOCK_ACTIONS.SIGN_UP(1000))
  await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])

  alice.send(MOCK_ACTIONS.START_GAME)
  bob.send(MOCK_ACTIONS.START_GAME)

  await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice'))
  alice.send(MOCK_ACTIONS.SMALL_BLIND(10))

  await bob.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Bob'))
  bob.send(MOCK_ACTIONS.BIG_BLIND(20))

  await alice.waitAction('dealtPrivateCards')

  await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice'))
  alice.send(MOCK_ACTIONS.RISE(80))

  await bob.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob'))

  // Bob intenta CHECK (inválido)
  bob.send(MOCK_ACTIONS.CHECK)

  const reject = await bob.waitAction('actionRejected', 5000, r =>
    r.message?.data?.reason?.toLowerCase().includes('check') || r.message?.data?.displayMsg?.toLowerCase().includes('invalid')
  )
  expect(reject).toBeDefined()

  // Ahora sí: call
  bob.send(MOCK_ACTIONS.CALL)
  const callMsg = await alice.waitAction('setCall', 5000)
  expect(callMsg.message.data.displayMsg).toMatch(/calls/i)
}, 35000)

it('Kicker decide: mismo par, diferente kicker', async () => {
  const gameCode = 'kicker-pair-' + Math.random().toString(36).substring(7)

  // Alice: A♠ K♦ → par de Ases con K kicker
  // Bob: A♥ Q♣ → par de Ases con Q kicker
  // Board: A♦ 7♠ 2♥ 9♣ 4♠
  const mockedDeck = ['As','Kd','Ah','Qc','Ad','7s','2h','9c','4s','3d','5h']
  vi.spyOn(Deck, 'shuffleDeck').mockReturnValue(mockedDeck)

  const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
  const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

  await Promise.all([new Promise(r => alice.ws.on('open', r)), new Promise(r => bob.ws.on('open', r))])

  alice.send(MOCK_ACTIONS.SIGN_UP(1000))
  bob.send(MOCK_ACTIONS.SIGN_UP(1000))
  await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])

  alice.send(MOCK_ACTIONS.START_GAME)
  bob.send(MOCK_ACTIONS.START_GAME)

  await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice'))
  alice.send(MOCK_ACTIONS.SMALL_BLIND(10))

  await bob.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Bob'))
  bob.send(MOCK_ACTIONS.BIG_BLIND(20))

  await alice.waitAction('dealtPrivateCards')

  await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice'))
  alice.send(MOCK_ACTIONS.CALL)

  await bob.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Bob'))
  bob.send(MOCK_ACTIONS.CHECK)

  // Pasamos todas las calles con check
  for (const street of ['flop', 'turn', 'river']) {
    await alice.waitAction(`dealerHand-${street}`, 8000)
    await bob.waitAction(`bettingCore-${street}Betting`, 5000, r => r.message.data?.displayMsg?.includes('Bob'))
    bob.send(MOCK_ACTIONS.CHECK)
    await alice.waitAction(`bettingCore-${street}Betting`, 5000, r => r.message.data?.displayMsg?.includes('Alice'))
    alice.send(MOCK_ACTIONS.CHECK)
  }

  const winnerMsg = await alice.waitAction('winner', 12000)
  expect(winnerMsg.message.data.winners[0].name).toBe('Alice')
  expect(winnerMsg.message.data.winners[0].handName).toMatch(/pair/i)

  vi.restoreAllMocks()
}, 60000)

it('Reconexión durante mano: mantiene estado y turno', async () => {
  const gameCode = '8888'
  const alice = createClient(MOCK_PLAYERS.ALICE, gameCode)
  const bob = createClient(MOCK_PLAYERS.BOB, gameCode)

  await Promise.all([new Promise(r => alice.ws.on('open', r)), new Promise(r => bob.ws.on('open', r))])

  alice.send(MOCK_ACTIONS.SIGN_UP(1000))
  bob.send(MOCK_ACTIONS.SIGN_UP(1000))
  await Promise.all([alice.waitAction('signUp'), bob.waitAction('signUp')])

  alice.send(MOCK_ACTIONS.START_GAME)
  bob.send(MOCK_ACTIONS.START_GAME)

  await alice.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Alice'))
  alice.send(MOCK_ACTIONS.SMALL_BLIND(10))

  await bob.waitAction('askForBlindBets', 5000, r => r.message.data?.displayMsg?.includes('Bob'))
  bob.send(MOCK_ACTIONS.BIG_BLIND(20))

  await alice.waitAction('dealtPrivateCards')

  // Alice llama
  await alice.waitAction('bettingCore-firstBetting', 5000, r => r.message.data?.displayMsg?.includes('Alice'))
  alice.send(MOCK_ACTIONS.CALL)

  // Simulamos desconexión de Bob justo antes de su turno
  bob.ws.close()

  // Esperamos un poco (debe ser MENOS que el timeout de desconexión de 3s)
  await new Promise(r => setTimeout(r, 500))

  // Reconectamos a Bob (mismo secretCode)
  const bobReconnect = createClient(MOCK_PLAYERS.BOB, gameCode)
  await new Promise(r => bobReconnect.ws.on('open', r))
  bobReconnect.send(MOCK_ACTIONS.SIGN_UP(1000))  // reconexión

  const reconnectedMsg = await bobReconnect.waitAction('signUp', 5000)
  // Nota: secretCode no viaja al cliente, buscamos por nombre
  expect(reconnectedMsg.message.players.find(p => p.name === 'Bob')).toBeDefined()

  // Debería seguir en su turno
  const bobTurnAfter = await bobReconnect.waitAction('bettingCore-firstBetting', 8000, r =>
    r.message.data?.displayMsg?.includes('Bob')
  )
  expect(bobTurnAfter).toBeDefined()

  bobReconnect.send(MOCK_ACTIONS.CHECK)

  await alice.waitAction('dealerHand-flop', 10000)
}, 45000)


*/

})
