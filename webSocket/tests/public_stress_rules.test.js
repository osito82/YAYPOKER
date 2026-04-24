import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'
const { server } = require('../app')

describe('Public Table: Rules & Money Integrity Test', () => {
  let port
  let serverInstance
  let clients = []

  beforeAll(() => {
    return new Promise((resolve) => {
      serverInstance = server.listen(0, () => {
        port = serverInstance.address().port
        console.log(`Test Server running on port ${port}`)
        resolve()
      })
    })
  })

  afterAll(() => {
    clients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN) c.close()
    })
    return new Promise((resolve) => serverInstance.close(resolve))
  })

  const createClient = (name, gameCode, secret = null) => {
    const secretCode = secret || `sec-${name}-${Math.random()}`
    const ws = new WebSocket(
      `ws://localhost:${port}?gameCode=${gameCode}&playerName=${name}&secretCode=${secretCode}`,
    )
    clients.push(ws)

    const responses = []
    ws.on('message', (data) => {
      const r = JSON.parse(data.toString())
      responses.push(r)

      const action = r.message?.action || r.message?.method || ''
      const msg = r.message?.data?.displayMsg || ''

      // Auto-responder para que el test fluya
      // 1. Ciegas (Privado o Público con mención)
      if (action === 'askForBlindBets') {
        const isMyTurn = r.message?.data?.id === ws._id_for_test || msg.includes(name)
        if (isMyTurn && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'setBet', chipsToBet: r.message.data.blindAmount }))
        }
      }

      // 2. Betting Core (Turnos de apuesta)
      if (action.startsWith('bettingCore') && msg.includes(name)) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'setBet', chipsToBet: 1000 }))
        }
      }
    })

    const waitAction = (action, timeout = 10000, filterFn = null) => {
      return new Promise((resolve, reject) => {
        const start = Date.now()
        const check = setInterval(() => {
          const found = responses.find((r) => {
            const act = r.message?.action || r.message?.method || r.action
            if (act !== action) return false
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
        }, 100)
      })
    }

    const send = (actionPayload) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(actionPayload))
      else ws.once('open', () => ws.send(JSON.stringify(actionPayload)))
    }

    return { name, secretCode, ws, responses, waitAction, send }
  }

  it('Should complete a tournament with 4 players and conserve 100% of the chips', async () => {
    // Usamos un código muy único para evitar que la lógica de redirección nos mueva a otra mesa
    const gameCode = 'P_FINAL_TEST_' + Date.now()
    const TOTAL_PLAYERS = 4
    const playerObjects = []

    // 1. Conectar 4 jugadores
    for (let i = 1; i <= TOTAL_PLAYERS; i++) {
      playerObjects.push(createClient(`Player_${i}`, gameCode))
    }
    await Promise.all(playerObjects.map(p => new Promise(r => p.ws.on('open', r))))

    // 2. Todos hacen SignUp
    playerObjects.forEach(p => p.send({ action: 'signUp', totalChips: 1000, isReady: true }))
    await Promise.all(playerObjects.map(async (p) => {
        const signUpResponse = await p.waitAction('signUp')
        // Capturamos el ID asignado por el servidor
        p.ws._id_for_test = signUpResponse.message.data.id
    }))

    // 3. Esperar a que empiece la partida (Auto-start)
    // El servidor enviará dealtPrivateCards cuando los 4 estén listos
    await playerObjects[0].waitAction('dealtPrivateCards', 15000)

    // 4. LÓGICA DE APUESTA: Manejada automáticamente por createClient
    
    // 5. Esperar al ganador del torneo
    const tournamentWinner = await playerObjects[0].waitAction('winnerTournament', 20000)
    
    // === VALIDACIÓN FINAL ===
    const winnerData = tournamentWinner.message.data.winner
    const totalMassInTable = TOTAL_PLAYERS * 1000 // 4000
    
    console.log(`Tournament Result: ${winnerData.name} won ${winnerData.amount} chips.`)
    
    // El ganador debe tener exactamente la suma de las fichas de todos
    expect(winnerData.amount).toBe(totalMassInTable)
    expect(winnerData.playerId).toBeDefined()
    
    console.log('Final Validation: 100% Chip Conservation confirmed.')
  }, 50000)
})
