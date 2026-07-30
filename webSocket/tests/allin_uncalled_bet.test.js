import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'
const { server } = require('../app')

/**
 * Reproduces the exact reported bug:
 *   Heads-up. Pot 40. BigStack (1342) goes ALL-IN. Shorty (213) calls ALL-IN.
 *   The old engine awarded the entire pot (40 + 1342 + 193 = 1575... here
 *   40 + 1322 + 193 = 1555) to the showdown winner.
 *   Official rules: the winner can only win up to the effective stack.
 *   Main pot = 40 + 193 + 193 = 426. BigStack takes back 1322 - 193 = 1129.
 */
describe('Uncalled Bet Return — Official All-In Rules (Integration)', () => {
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

    // Cursor: each waitAction only scans NEW messages (after the last match),
    // so stale turn notifications can never trigger an out-of-turn action.
    const state = { cursor: 0 }
    const waitAction = (action, timeout = 8000, filterFn = null) => {
      return new Promise((resolve, reject) => {
        const start = Date.now()
        const check = setInterval(() => {
          for (let i = state.cursor; i < responses.length; i++) {
            const r = responses[i]
            if (!r.message || r.message.action !== action) continue
            if (filterFn && !filterFn(r)) continue
            state.cursor = i + 1
            clearInterval(check)
            resolve(r)
            return
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

    return { name, ws, responses, state, waitAction, send }
  }

  it('Winner can only win the effective stack; unmatched all-in returns to owner', async () => {
    const gameCode = 'P_TEST_UNCALLED_' + Date.now()

    const big = createClient({ name: 'BigStack', secretCode: '1111' }, gameCode)
    const short = createClient({ name: 'Shorty', secretCode: '2222' }, gameCode)

    await Promise.all([
      new Promise((r) => big.ws.on('open', r)),
      new Promise((r) => short.ws.on('open', r)),
    ])

    const initialBig = 1342
    const initialShort = 213
    const totalTable = initialBig + initialShort // 1555

    big.send({ action: 'signUp', totalChips: initialBig, isReady: true })
    short.send({ action: 'signUp', totalChips: initialShort, isReady: true })
    await Promise.all([big.waitAction('signUp'), short.waitAction('signUp')])

    big.send({ action: 'startGame', smallBlind: 0, bigBlind: 0, ante: 0 })
    await big.waitAction('dealtPrivateCards')

    // Turn protocol: the acting player gets a PRIVATE 'Your turn' message.
    // waitActor scans BOTH clients and returns the one holding the turn,
    // consuming only that client's cursor.
    const waitActor = (street, timeout = 8000) =>
      new Promise((resolve, reject) => {
        const start = Date.now()
        const check = setInterval(() => {
          for (const client of [big, short]) {
            for (let i = client.state.cursor; i < client.responses.length; i++) {
              const r = client.responses[i]
              if (r.message?.action !== `bettingCore-${street}`) continue
              if (r.message.data?.displayMsg !== 'Your turn') continue
              client.state.cursor = i + 1
              clearInterval(check)
              resolve(client)
              return
            }
          }
          if (Date.now() - start > timeout) {
            clearInterval(check)
            reject(new Error(`Timeout waiting actor for ${street}`))
          }
        }, 50)
      })
    const waitMyTurn = (client, street) =>
      client.waitAction(
        `bettingCore-${street}`,
        8000,
        (r) => r.message.data.displayMsg === 'Your turn',
      )

    // --- Preflop: first to act bets 20, other calls → pot 40 ---
    const preflopActor = await waitActor('firstBetting')
    const preflopOther = preflopActor === big ? short : big

    preflopActor.send({ action: 'setBet', chipsToBet: 20 })
    await waitMyTurn(preflopOther, 'firstBetting')
    preflopOther.send({ action: 'setCall' })

    await big.waitAction('dealerHand-flop', 8000)

    // --- Flop: BigStack ALL-IN (1322), Shorty calls ALL-IN (193) ---
    const flopActor = await waitActor('flopBetting')

    if (flopActor === big) {
      big.send({ action: 'setBet', chipsToBet: 1322 }) // all-in
      await waitMyTurn(short, 'flopBetting')
      short.send({ action: 'setCall' }) // all-in for 193
    } else {
      short.send({ action: 'setCheck' })
      await waitMyTurn(big, 'flopBetting')
      big.send({ action: 'setBet', chipsToBet: 1322 }) // all-in
      await waitMyTurn(short, 'flopBetting')
      short.send({ action: 'setCall' }) // all-in for 193
    }

    // --- Both all-in → runout → winner ---
    await big.waitAction('runout', 10000)
    const handResult = await big.waitAction('winner', 15000)

    const winners = handResult.message.data.winners
    const displayMsg = handResult.message.data.displayMsg

    // OFFICIAL RULE: winners can NEVER win more than the matched amount.
    // Effective stack = 193. Total winnable = 40 + 193 + 193 = 426.
    // (With the old bug, the winner received 1555.)
    // Sum across winners so the assert also holds on a tied showdown.
    expect(winners.length).toBeGreaterThan(0)
    const totalWon = winners.reduce((s, w) => s + (w.amount || 0), 0)
    expect(totalWon).toBe(426)

    // The unmatched 1129 must be reported as returned to BigStack
    expect(displayMsg).toContain('takes back 1129')
    expect(displayMsg).toContain('uncalled bet')

    // --- Chip conservation & final stacks ---
    // Read final chips from the next hand, or from the tournament result
    let bigChips, shortChips
    try {
      const nextHand = await big.waitAction('dealtPrivateCards', 8000)
      const players = nextHand.message.players
      bigChips = players.find((p) => p.name === 'BigStack')?.chips
      shortChips = players.find((p) => p.name === 'Shorty')?.chips ?? 0
    } catch (e) {
      // Tournament ended: BigStack won everything (Shorty eliminated)
      const tourney = await big.waitAction('winnerTournament', 4000)
      bigChips = tourney.message.data.winner.amount
      shortChips = 0
    }

    // BigStack ALWAYS ends with at least his uncalled 1129 — even if he loses
    expect(bigChips).toBeGreaterThanOrEqual(1129)
    // Shorty can never hold more than what he could legitimately win
    expect(shortChips).toBeLessThanOrEqual(426)
    // Conservation is sacred
    expect(bigChips + shortChips).toBe(totalTable)
  }, 60000)
})
