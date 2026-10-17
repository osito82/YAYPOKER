import WebSocket from 'ws'

// Test WebSocket client for integration tests.
// - waitFor/waitAction search the messages received since `since` (default 0)
// - autoAct: 'checkcall' answers every private turn with check (or call)
// - blind prompts (pre GAM-002 servers) are answered automatically
export function createClientFactory(getPort, clients) {
  return (name, secretCode, gameCode, { query = '', autoAct = null } = {}) => {
    const ws = new WebSocket(
      `ws://localhost:${getPort()}?gameCode=${gameCode}&playerName=${name}&secretCode=${secretCode}${query}`,
    )
    clients.push(ws)
    const client = {
      name,
      ws,
      responses: [],
      autoAct,
      myId: null,
      sessionToken: null,
    }
    const send = (payload) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload))
    }
    client.send = send

    ws.on('message', (data) => {
      const parsed = JSON.parse(data.toString())
      client.responses.push(parsed)
      const msg = parsed.message
      if (!msg) return
      if (msg.action === 'signUp' && msg.type === 'private') {
        if (msg.data?.id) client.myId = msg.data.id
        if (msg.sessionToken) client.sessionToken = msg.sessionToken
      }
      if (msg.action === 'askForBlindBets' && msg.type === 'private') {
        setTimeout(() => send({ action: 'setBet', chipsToBet: msg.data.blindAmount }), 10)
        return
      }
      if (
        client.autoAct === 'checkcall' &&
        msg.type === 'private' &&
        msg.action?.startsWith('bettingCore')
      ) {
        const opts = msg.data?.action || []
        setTimeout(
          () => send({ action: opts.includes('check') ? 'setCheck' : 'setCall' }),
          10,
        )
      }
    })

    client.opened = new Promise((resolve, reject) => {
      ws.on('open', resolve)
      ws.on('error', reject)
    })
    client.closed = new Promise((resolve) => ws.on('close', resolve))

    client.mark = () => client.responses.length

    client.waitFor = (predicate, label, { timeout = 5000, since = 0 } = {}) =>
      new Promise((resolve, reject) => {
        const start = Date.now()
        const check = setInterval(() => {
          const found = client.responses.slice(since).find(predicate)
          if (found) {
            clearInterval(check)
            resolve(found)
          } else if (Date.now() - start > timeout) {
            clearInterval(check)
            reject(new Error(`Timeout waiting for ${label} (${name})`))
          }
        }, 20)
      })

    client.waitAction = (action, opts) =>
      client.waitFor((r) => r.message?.action === action, action, opts)

    client.waitMyTurn = (opts) =>
      client.waitFor(
        (r) =>
          r.message?.type === 'private' &&
          r.message.action?.startsWith('bettingCore'),
        'my turn',
        opts,
      )

    client.received = (action, since = 0) =>
      client.responses.slice(since).some((r) => r.message?.action === action)

    return client
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function listen(server) {
  return new Promise((resolve) => {
    const instance = server.listen(0, () => resolve(instance))
  })
}

export const totalChips = (match) =>
  match.players.reduce((sum, p) => sum + p.chips, 0) + match.dealer.getPot()
