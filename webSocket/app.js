const express = require('express')
const R = require('radash')
const osolog = require('osolog')

const http = require('http')
const WebSocket = require('ws')

const { generateUniqueId, randomName, generateSecretCode, socketId } = require('./utils')

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
      title: 'SERVER:UNCAUGHT_EXCEPTION',
      date: true,
    })
    .R({ error: error.message, stack: error.stack })
})

process.on('unhandledRejection', (reason, promise) => {
  log
    .Template({
      name: 'brakets',
      title: 'SERVER:UNHANDLED_REJECTION',
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
      .Template({ name: 'brakets', title: 'SERVER:GC', date: true })
      .R({ msg: 'Cleaned up inactive matches', count: removedCount })
  }
}, 600000)

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
// Option 3: Acceso Explícito por Espacio de Nombres
const actionHandlers = {
  signUp: (match, socket, data) => match.lobby.signUp(data, socket),
  sendMessage: (match, socket, data) => match.comms.sendMessage(data),
  fold: (match, socket) => match.actions.fold(socket),
  close: (match, socket) => match.lobby.close(socket),
  setBet: (match, socket, data) =>
    match.actions.setBet(socket, data.chipsToBet),
  setRise: (match, socket, data) =>
    match.actions.setRise(socket, data.chipsToRiseBet),
  setCall: (match, socket) => match.actions.setCall(socket),
  setCheck: (match, socket) => match.actions.setCheck(socket),
  dealtPrivateCards: (match, socket) => match.actions.dealtPrivateCards(socket),
  stats: (match, socket) => match.comms.stats(socket.id),
  nextRound: (match) => match.nextRound(),
  startGame: (match, socket) => match.startGame(socket),
  playerReady: (match, socket) => match.lobby.playerReady(socket),
}

wss.on('connection', (ws, req) => {
  const urlParams = new URLSearchParams(req.url.substring(1))

  const torneoId = 
    urlParams.get('gameCode') ?? generateUniqueId()
  
  const playerName = urlParams.get('playerName') ?? randomName()
 
  const secretCode = 
    urlParams.get('secretCode') ?? generateSecretCode()
      

  const thisSocket = {
    id: socketId(),
    name: playerName,
    secretCode,
    socket: ws,
  }

  log
    .Template({ name: 'brakets', title: 'SERVER:NEW_CONNECTION', date: true })
    .R({ playerName, id: thisSocket.id, torneo: torneoId, secretCode })

  Socket.addSocket(thisSocket, torneoId)

  // Intentar obtener el match existente o crear uno nuevo
  let match = Torneo.getMatch(torneoId)
  if (!match) {
    const newSocketId = socketId()
    match = new Match(torneoId, newSocketId)
    Torneo.addMatch(match, torneoId)
    log
      .Template({
        name: 'brakets',
        title: 'SERVER:MATCH_CREATED',
        date: true,
      })
      .R({ newSocketId, torneoId })
  }

  ws.on('message', (data) => {
    let jsonData
    if (data) {
      try {
        jsonData = JSON.parse(data)
        log
          .Template({
            name: 'brakets',
            title: `INCOMING:${jsonData.action?.toUpperCase()}`,
            date: true,
          })
          .R({ from: playerName })
      } catch (error) {
        log
          .Template({
            name: 'brakets',
            title: 'SERVER:JSON_PARSE_ERROR',
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
            title: 'SERVER:VALIDATION_ERROR',
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
          handler(match, thisSocket, jsonData)
        } catch (error) {
          log
            .Template({
              name: 'brakets',
              title: 'SERVER:HANDLER_ERROR',
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
            title: 'SERVER:UNKNOWN_ACTION',
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
        title: 'SERVER:DISCONNECTION',
        date: true,
      })
      .R({ playerName })
    try {
      if (match) {
        match.lobby.pause(thisSocket)
      }
    } catch (error) {
      log
        .Template({
          name: 'brakets',
          title: 'SERVER:DISCONNECTION_ERROR',
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
        title: 'SERVER:WEBSOCKET_ERROR',
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
const PORT = process.env.VITE_WS_PORT || '8888'
const PROTOCOL = 'http'
const BASE = process.env.VITE_WS_URL || 'localhost'

if (require.main === module) {
  server.listen(PORT, () => {
    log
      .Template({ name: 'brakets', title: 'SERVER:LISTENING', date: true })
      .R({
        port: PORT,
        url: `${PROTOCOL}://${BASE}:${PORT}`,
        env: process.env.NODE_ENV || 'development',
      })
  })
}

module.exports = { app, server, wss, validateAction }
