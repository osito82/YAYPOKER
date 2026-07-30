import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'
const { server } = require('../app')

/**
 * Reported bug: "Memo bets 200, Marco just checks instead of matching the bet
 * and the system allows it."
 *
 * Expected behaviour (official rules): a check while facing an unmatched bet
 * MUST be rejected, the turn must stay with Marco, and the betting round must
 * NOT advance until Marco calls, raises or folds.
 */
describe('Invalid Check Rejection — facing an unmatched bet', () => {
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

  // Close every client opened so far — public tables (P_) are reused across
  // matches, so stale clients would leak one test's table into the next.
  const closeClients = () => {
    clients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN) c.close()
    })
    clients = []
  }

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

    // Peek whether a matching message arrives within `ms` (does not consume)
    const arrivesWithin = (action, ms = 2500, filterFn = null) => {
      return new Promise((resolve) => {
        const start = Date.now()
        const check = setInterval(() => {
          const found = responses
            .slice(state.cursor)
            .find(
              (r) =>
                r.message?.action === action && (!filterFn || filterFn(r)),
            )
          if (found) {
            clearInterval(check)
            resolve(true)
          } else if (Date.now() - start > ms) {
            clearInterval(check)
            resolve(false)
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

    return { name, ws, responses, state, waitAction, arrivesWithin, send }
  }

  it('Check while facing a 200 bet is rejected; turn and round do not advance', async () => {
    const gameCode = 'TEST_CHECK_' + Date.now()

    const marco = createClient({ name: 'Marco', secretCode: '1111' }, gameCode)
    const memo = createClient({ name: 'Memo', secretCode: '2222' }, gameCode)

    await Promise.all([
      new Promise((r) => marco.ws.on('open', r)),
      new Promise((r) => memo.ws.on('open', r)),
    ])

    marco.send({ action: 'signUp', totalChips: 1000, isReady: true })
    memo.send({ action: 'signUp', totalChips: 1000, isReady: true })
    await Promise.all([marco.waitAction('signUp'), memo.waitAction('signUp')])

    marco.send({ action: 'startGame', smallBlind: 0, bigBlind: 0, ante: 0 })
    await marco.waitAction('dealtPrivateCards')

    const waitActor = (street, timeout = 8000) =>
      new Promise((resolve, reject) => {
        const start = Date.now()
        const check = setInterval(() => {
          for (const client of [marco, memo]) {
            for (
              let i = client.state.cursor;
              i < client.responses.length;
              i++
            ) {
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

    // --- First actor bets 200 ---
    const firstActor = await waitActor('firstBetting')
    const second = firstActor === marco ? memo : marco
    firstActor.send({ action: 'setBet', chipsToBet: 200 })

    // --- The other player (facing the 200 bet) tries to CHECK ---
    await second.waitAction(
      'bettingCore-firstBetting',
      8000,
      (r) => r.message.data.displayMsg === 'Your turn',
    )
    second.send({ action: 'setCheck' })

    // 1) The server MUST reject the check privately
    const rejected = await second.arrivesWithin(
      'actionRejected',
      3000,
      (r) => r.message.data?.reason === 'check',
    )
    expect(rejected).toBe(true)

    // 2) NO public 'setCheck' confirmation may be broadcast
    const checkBroadcast = await marco.arrivesWithin('setCheck', 2000)
    expect(checkBroadcast).toBe(false)

    // 3) The betting round must NOT advance (no flop is dealt)
    const flopDealt = await marco.arrivesWithin('dealerHand-flop', 2000)
    expect(flopDealt).toBe(false)

    // 4) The turn must STILL belong to the player who tried to check:
    //    a legitimate call right after must succeed and close the round.
    second.send({ action: 'setCall' })
    const flopAfterCall = await marco.arrivesWithin('dealerHand-flop', 8000)
    expect(flopAfterCall).toBe(true)

    // 5) After the legitimate call, both matched 200 and the pot is 400
    const postHand = await marco.waitAction('dealerHand-flop', 8000)
    const players = postHand.message.players
    const marcoP = players.find((p) => p.name === 'Marco')
    const memoP = players.find((p) => p.name === 'Memo')
    expect(marcoP.chips).toBe(800)
    expect(memoP.chips).toBe(800)
    expect(postHand.message.pot).toBe(400)
    closeClients()
  }, 60000)

  it('Check rejected postflop as well (bet 200 on the flop)', async () => {
    const gameCode = 'TEST_CHECKFLOP_' + Date.now()

    const marco = createClient({ name: 'Carlos', secretCode: '3333' }, gameCode)
    const memo = createClient({ name: 'Pedro', secretCode: '4444' }, gameCode)

    await Promise.all([
      new Promise((r) => marco.ws.on('open', r)),
      new Promise((r) => memo.ws.on('open', r)),
    ])

    marco.send({ action: 'signUp', totalChips: 1000, isReady: true })
    memo.send({ action: 'signUp', totalChips: 1000, isReady: true })
    await Promise.all([marco.waitAction('signUp'), memo.waitAction('signUp')])

    marco.send({ action: 'startGame', smallBlind: 0, bigBlind: 0, ante: 0 })
    await marco.waitAction('dealtPrivateCards')

    const waitActor = (street, timeout = 8000) =>
      new Promise((resolve, reject) => {
        const start = Date.now()
        const check = setInterval(() => {
          for (const client of [marco, memo]) {
            for (
              let i = client.state.cursor;
              i < client.responses.length;
              i++
            ) {
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

    // Preflop: both check through (bet 0 is not possible; use check/check)
    const preflopActor = await waitActor('firstBetting')
    const preflopOther = preflopActor === marco ? memo : marco
    preflopActor.send({ action: 'setCheck' })
    await preflopOther.waitAction(
      'bettingCore-firstBetting',
      8000,
      (r) => r.message.data.displayMsg === 'Your turn',
    )
    preflopOther.send({ action: 'setCheck' })

    await marco.waitAction('dealerHand-flop', 8000)

    // Flop: first actor bets 200, the other tries to check
    const flopActor = await waitActor('flopBetting')
    const flopOther = flopActor === marco ? memo : marco
    flopActor.send({ action: 'setBet', chipsToBet: 200 })

    await flopOther.waitAction(
      'bettingCore-flopBetting',
      8000,
      (r) => r.message.data.displayMsg === 'Your turn',
    )
    flopOther.send({ action: 'setCheck' })

    // Must be rejected
    const rejected = await flopOther.arrivesWithin(
      'actionRejected',
      3000,
      (r) => r.message.data?.reason === 'check',
    )
    expect(rejected).toBe(true)

    // No public check, no turn card dealt
    const checkBroadcast = await marco.arrivesWithin('setCheck', 2000)
    expect(checkBroadcast).toBe(false)
    const turnDealt = await marco.arrivesWithin('dealerHand-turn', 2000)
    expect(turnDealt).toBe(false)

    // Turn still belongs to the checker: a call works and advances the hand
    flopOther.send({ action: 'setCall' })
    const turnAfterCall = await marco.arrivesWithin('dealerHand-turn', 8000)
    expect(turnAfterCall).toBe(true)
    closeClients()
  }, 60000)
})
