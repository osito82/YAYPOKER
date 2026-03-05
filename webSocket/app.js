const express = require('express')
const R = require('radash')
const osolog = require('osolog')

const http = require('http')
const WebSocket = require('ws')

const { generateUniqueId, randomName, generateSecretCode } = require('./utils')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

const Match = require('./match')
const Socket = require('./sockets')
const Torneo = require('./torneo')

const startTime = new Date()
const log = new osolog()

// Global error handlers to prevent server crashes
process.on('uncaughtException', (error) => {
  log
    .Template({
      name: 'brakets',
      title: 'SERVER - Uncaught Exception',
      date: true,
    })
    .R({ error: error.message, stack: error.stack })
})

process.on('unhandledRejection', (reason, promise) => {
  log
    .Template({
      name: 'brakets',
      title: 'SERVER - Unhandled Rejection',
      date: true,
    })
    .R({ reason: reason?.message || reason, stack: reason?.stack })
})

// Periodic garbage collector for inactive/abandoned matches
// Runs every 10 minutes
setInterval(() => {
  const removedCount = Torneo.removeInactiveMatches(3600000) // 1 hour idle
  if (removedCount > 0) {
    log
      .Template({ name: 'brakets', title: 'SERVER - GC', date: true })
      .R({ msg: 'Cleaned up inactive matches', count: removedCount })
  }
}, 600000)

// Constantes para mejorar mantenibilidad
const MAX_ID_LENGTH = 25

// Validación de datos de entrada
const validateAction = (action, data) => {
  if (!action) return 'Action is required'

  const rules = {
    signUp: () => {
      const chips = Number(data.totalChips)
      if (isNaN(chips) || chips < 0) return 'Invalid chips amount'
      data.totalChips = chips // Sanitizar
      return null
    },
    setBet: () => {
      const bet = Number(data.chipsToBet)
      if (isNaN(bet) || bet < 0) return 'Invalid bet amount'
      data.chipsToBet = bet // Sanitizar
      return null
    },
    setRise: () => {
      const rise = Number(data.chipsToRiseBet)
      if (isNaN(rise) || rise < 0) return 'Invalid rise amount'
      data.chipsToRiseBet = rise // Sanitizar
      return null
    },
    sendMessage: () => {
      if (!data.targetPlayerId || typeof data.targetMessage !== 'string')
        return 'Invalid message data'
      return null
    },
  }

  return rules[action] ? rules[action]() : null
}

// Mapeo de acciones a manejadores para mejor organización
const actionHandlers = {
  signUp: (match, socket, data, playerName, secretCode, torneoId) => {
    data.name = playerName
    data.secretCode = secretCode

    if (!torneoId || !Torneo.torneoExists(torneoId)) {
      log
        .Template({ name: 'brakets', title: 'SERVER - Error', date: true })
        .R({ msg: 'Torneo not found during signUp', torneoId })
      socket.socket.close()
      return
    }

    match.signUp(data, socket)
  },

  sendMessage: (match, socket, data, torneoId) => {
    const targetPlayerId = data.targetPlayerId
    const targetMessage = data.targetMessage

    const targetSocket = Socket.getSocket(torneoId, targetPlayerId)

    if (targetSocket?.socket) {
      targetSocket.socket.send(
        JSON.stringify({ message: { displayMsg: targetMessage } }),
      )
    } else {
      log
        .Template({ name: 'brakets', title: 'SERVER - Chat Error', date: true })
        .R({ msg: 'Target not found', targetPlayerId })
    }
  },

  fold: (match, socket) => match.fold(socket),
  close: (match, socket, data, torneoId) => match.close(socket, torneoId),
  setBet: (match, socket, data) => match.setBet(socket, data.chipsToBet),
  setRise: (match, socket, data) => match.setRise(socket, data.chipsToRiseBet),
  setCall: (match, socket, data, torneoId) => match.setCall(socket, torneoId),
  setCheck: (match, socket, data, torneoId) => match.setCheck(socket, torneoId),
  dealtPrivateCards: (match, socket) => match.dealtPrivateCards(socket),
  stats: (match, socket) => match.stats(socket.id),
  nextRound: (match) => match.nextRound(),
  startGame: (match, socket) => match.startGame(socket),
}

wss.on('connection', (ws, req) => {
  const urlParams = new URLSearchParams(req.url.substring(1))

  const torneoId = (
    urlParams.get('gameCode') ?? generateUniqueId(MAX_ID_LENGTH)
  ).slice(0, MAX_ID_LENGTH)
  const playerName = (urlParams.get('playerName') ?? randomName()).slice(
    0,
    MAX_ID_LENGTH,
  )
  const secretCode = (
    urlParams.get('secretCode') ?? generateUniqueId(MAX_ID_LENGTH)
  ).slice(0, MAX_ID_LENGTH)

  const thisSocket = {
    id: generateUniqueId(MAX_ID_LENGTH),
    name: playerName,
    secretCode,
    socket: ws,
  }

  log
    .Template({ name: 'brakets', title: 'SERVER - New Connection', date: true })
    .R({ playerName, id: thisSocket.id, torneo: torneoId, secretCode })

  Socket.addSocket(thisSocket, torneoId)

  // Intentar obtener el match existente o crear uno nuevo
  let match = Torneo.getMatch(torneoId)
  if (!match) {
    const newGameId = generateUniqueId()
    match = new Match(torneoId, newGameId)
    Torneo.addMatch(match, torneoId)
    log
      .Template({
        name: 'brakets',
        title: 'SERVER - Match Created',
        date: true,
      })
      .R({ newGameId, torneoId })
  }

  ws.on('message', (data) => {
    let jsonData
    if (data) {
      try {
        jsonData = JSON.parse(data)
        log
          .Template({
            name: 'brakets',
            title: `INCOMING - ${jsonData.action}`,
            date: true,
          })
          .R({ from: playerName })
      } catch (error) {
        log
          .Template({
            name: 'brakets',
            title: 'SERVER - JSON Parse Error',
            date: true,
          })
          .R({ error: error.message, data: data.toString() })
        ws.send(JSON.stringify({ error: 'Invalid JSON format' }))
        return
      }
    }

    if (jsonData?.action) {
      // Robustez: Validar datos antes de procesar
      const validationError = validateAction(jsonData.action, jsonData)
      if (validationError) {
        log
          .Template({
            name: 'brakets',
            title: 'SERVER - Validation Error',
            date: true,
          })
          .R({
            action: jsonData.action,
            error: validationError,
            from: playerName,
          })
        ws.send(JSON.stringify({ error: validationError }))
        return
      }

      const handler = actionHandlers[jsonData.action]
      if (handler) {
        try {
          handler(match, thisSocket, jsonData, playerName, secretCode, torneoId)
        } catch (error) {
          log
            .Template({
              name: 'brakets',
              title: 'SERVER - Handler Error',
              date: true,
            })
            .R({ action: jsonData.action, error: error.message })
          ws.send(
            JSON.stringify({ error: `Error processing ${jsonData.action}` }),
          )
        }
      } else {
        log
          .Template({
            name: 'brakets',
            title: 'SERVER - Unknown Action',
            date: true,
          })
          .R({ action: jsonData.action })
      }
    }
  })

  ws.on('close', () => {
    log
      .Template({
        name: 'brakets',
        title: 'SERVER - Disconnection',
        date: true,
      })
      .R({ playerName })
    try {
      if (match) {
        match.pause(thisSocket)
      }
    } catch (error) {
      log
        .Template({
          name: 'brakets',
          title: 'SERVER - Disconnection Error',
          date: true,
        })
        .R({ error: error.message, playerName })
    }
  })

  // Manejo de errores del WebSocket
  ws.on('error', (error) => {
    log
      .Template({
        name: 'brakets',
        title: 'SERVER - WebSocket Error',
        date: true,
      })
      .R({ playerName, error: error.message })
  })
})

// Función para calcular uptime de forma más limpia
const getUptime = () => {
  const uptimeMs = new Date() - startTime
  const uptimeSec = Math.floor(uptimeMs / 1000)

  return {
    hours: Math.floor(uptimeSec / 3600),
    minutes: Math.floor((uptimeSec % 3600) / 60),
    seconds: uptimeSec % 60,
  }
}

// Rutas Express mejoradas
app.get('/', (req, res) => {
  res.json({
    message: 'Poker Server',
    version: '1.0.0',
    endpoints: ['/status', '/health'],
  })
})

app.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    startTime: startTime.toISOString(),
    uptime: getUptime(),
    connections: {
      active: Socket.getAllSockets()?.length || 0,
      tournaments: Torneo.getAllTournaments()?.length || 0,
    },
  })
})

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' })
})

app.get('/*splat', (req, res) => {
  res.redirect('/')
})

// Inicialización del servidor
const PORT = process.env.PORT || '8888'

if (require.main === module) {
  server.listen(PORT, () => {
    log
      .Template({ name: 'brakets', title: 'SERVER - Listening', date: true })
      .R({
        port: PORT,
        url: `http://localhost:${PORT}`,
        env: process.env.NODE_ENV || 'development',
      })
  })
}

module.exports = { app, server, wss, validateAction }
