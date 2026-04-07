import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import WebSocket from 'ws'
const { server } = require('../app')
const { MOCK_ACTIONS } = require('./fixtures')
const Deck = require('../deck')

describe('Tournament Emulation Test (M1DQF-E23ML)', () => {
  let port
  let clients = []

  beforeAll(() => {
    return new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port
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

  const createClient = (name, secretCode) => {
    const ws = new WebSocket(
      `ws://localhost:${port}?gameCode=M1DQF-E23ML&playerName=${name}&secretCode=${secretCode}`,
    )
    clients.push(ws)
    const responses = []
    ws.on('message', (data) => responses.push(JSON.parse(data.toString())))

    const waitAction = (action, timeout = 15000, filterFn = null) => {
      const startIndex = responses.length
      return new Promise((resolve, reject) => {
        const start = Date.now()
        const check = setInterval(() => {
          for (let i = startIndex; i < responses.length; i++) {
            const r = responses[i]
            if (r.message && r.message.action === action) {
              if (!filterFn || filterFn(r)) {
                clearInterval(check)
                resolve(r)
                return
              }
            }
          }
          if (Date.now() - start > timeout) {
            clearInterval(check)
            reject(new Error(`Timeout waiting for ${action} for ${name}`))
          }
        }, 50)
      })
    }

    const send = (data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data))
      else ws.once('open', () => ws.send(JSON.stringify(data)))
    }

    return { name, ws, responses, waitAction, send }
  }

  it('Emulate hands 1-3 perfectly from logs', async () => {
    // --- CONFIGURACIÓN DE MOCO DE DECK (Antes de crear clientes para que Match lo use) ---
    const spy = vi.spyOn(Deck, 'shuffleDeck').mockReturnValue([
      '6d',
      'Qd',
      '7s',
      'Jh', // 1st cards
      '4c',
      'Jc',
      'Ah',
      '8c', // 2nd cards
      'Jd',
      '5s',
      '5c',
      '8d',
      'Kc', // Board
    ])

    const memo = createClient('Memo', '1234')
    const jorgelo = createClient('Jorgelo', '5454')
    const mocket = createClient('Mocket', '4545')
    const rojo = createClient('Rojo', '3434')

    await new Promise((r) => setTimeout(r, 500))

    memo.send(MOCK_ACTIONS.SIGN_UP(1000))
    jorgelo.send(MOCK_ACTIONS.SIGN_UP(1000))
    mocket.send(MOCK_ACTIONS.SIGN_UP(1000))
    rojo.send(MOCK_ACTIONS.SIGN_UP(1000))

    await Promise.all([
      memo.waitAction('signUp'),
      jorgelo.waitAction('signUp'),
      mocket.waitAction('signUp'),
      rojo.waitAction('signUp'),
    ])

    memo.send(MOCK_ACTIONS.START_GAME)

    // --- MANO 1 ---
    await memo.waitAction('askForBlindBets')
    memo.send(MOCK_ACTIONS.SMALL_BLIND(10))
    await jorgelo.waitAction('askForBlindBets')
    jorgelo.send(MOCK_ACTIONS.BIG_BLIND(20))

    await memo.waitAction('dealtPrivateCards')

    await mocket.waitAction('bettingCore-firstBetting')
    mocket.send(MOCK_ACTIONS.CALL)
    await rojo.waitAction('bettingCore-firstBetting')
    rojo.send(MOCK_ACTIONS.CALL)
    await memo.waitAction('bettingCore-firstBetting')
    memo.send(MOCK_ACTIONS.RISE(45))
    await mocket.waitAction('bettingCore-firstBetting')
    mocket.send(MOCK_ACTIONS.RISE(90))
    await rojo.waitAction('bettingCore-firstBetting')
    rojo.send(MOCK_ACTIONS.CALL)
    await memo.waitAction('bettingCore-firstBetting')
    memo.send(MOCK_ACTIONS.FOLD)
    await jorgelo.waitAction('bettingCore-firstBetting')
    jorgelo.send(MOCK_ACTIONS.CALL)

    await jorgelo.waitAction('bettingCore-flopBetting')
    jorgelo.send(MOCK_ACTIONS.CHECK)
    await mocket.waitAction('bettingCore-flopBetting')
    mocket.send(MOCK_ACTIONS.BET(876))
    await jorgelo.waitAction('bettingCore-flopBetting')
    jorgelo.send(MOCK_ACTIONS.FOLD)
    await rojo.waitAction('bettingCore-flopBetting')
    rojo.send(MOCK_ACTIONS.CALL)

    await mocket.waitAction('bettingCore-turnBetting')
    mocket.send(MOCK_ACTIONS.BET(34))
    await rojo.waitAction('bettingCore-turnBetting')
    rojo.send(MOCK_ACTIONS.CALL)

    const h1W = await rojo.waitAction('winner')
    expect(h1W.message.data.winners.some((w) => w.name === 'Rojo')).toBe(true)
    expect(h1W.message.players.reduce((s, p) => s + p.chips, 0)).toBe(4000)

    // --- MANO 2 ---
    spy.mockReturnValue([
      '8h',
      'Jh',
      'Jc',
      'Qc',
      '4s',
      'Kh',
      '9d',
      '9c',
      'Qs',
      '3h',
      '6h',
      '8c',
      'Qh',
    ])

    memo.send({ action: 'nextRound' })
    jorgelo.send({ action: 'nextRound' })
    rojo.send({ action: 'nextRound' })

    await jorgelo.waitAction('askForBlindBets')
    jorgelo.send(MOCK_ACTIONS.SMALL_BLIND(13))
    await rojo.waitAction('askForBlindBets')
    rojo.send(MOCK_ACTIONS.BIG_BLIND(25))

    await jorgelo.waitAction('dealtPrivateCards')

    // Pre-flop: Order is Memo (Button), Jorgelo (SB), Rojo (BB)
    await memo.waitAction('bettingCore-firstBetting')
    memo.send(MOCK_ACTIONS.CALL) 
    await jorgelo.waitAction('bettingCore-firstBetting')
    jorgelo.send(MOCK_ACTIONS.RISE(440))
    
    // Server logic asks players in 'sorted' order: [Memo, Jorgelo, Rojo]
    // After Jorgelo raises, Memo is asked next because he is first in 'sorted' and hasn't matched the raise.
    await memo.waitAction('bettingCore-firstBetting')
    memo.send(MOCK_ACTIONS.CALL)
    await rojo.waitAction('bettingCore-firstBetting')
    rojo.send(MOCK_ACTIONS.CALL)

    // Flop: Order is Rojo, Memo, Jorgelo (Server logic skips first player)
    await rojo.waitAction('bettingCore-flopBetting')
    rojo.send(MOCK_ACTIONS.CHECK)
    await memo.waitAction('bettingCore-flopBetting')
    memo.send(MOCK_ACTIONS.CHECK)
    await jorgelo.waitAction('bettingCore-flopBetting')
    jorgelo.send(MOCK_ACTIONS.CHECK)

    // Turn: Order is Rojo, Memo, Jorgelo
    await rojo.waitAction('bettingCore-turnBetting')
    rojo.send(MOCK_ACTIONS.CHECK)
    await memo.waitAction('bettingCore-turnBetting')
    memo.send(MOCK_ACTIONS.BET(25))
    
    // Server logic asks players in 'sorted' order: [Rojo, Memo, Jorgelo]
    // After Memo bets, Rojo is asked next to match the bet.
    await rojo.waitAction('bettingCore-turnBetting')
    rojo.send(MOCK_ACTIONS.CALL)
    await jorgelo.waitAction('bettingCore-turnBetting')
    jorgelo.send(MOCK_ACTIONS.CALL)

    // River: Order is Rojo, Memo, Jorgelo
    await rojo.waitAction('bettingCore-riverBetting')
    rojo.send(MOCK_ACTIONS.CHECK)
    await memo.waitAction('bettingCore-riverBetting')
    memo.send(MOCK_ACTIONS.CHECK)
    await jorgelo.waitAction('bettingCore-riverBetting')
    jorgelo.send(MOCK_ACTIONS.CHECK)

    const h2W = await memo.waitAction('winner')
    expect(h2W.message.data.winners.some((w) => w.name === 'Jorgelo')).toBe(
      true,
    )
    expect(h2W.message.players.reduce((s, p) => s + p.chips, 0)).toBe(4000)

    vi.restoreAllMocks()
  }, 120000)
})
