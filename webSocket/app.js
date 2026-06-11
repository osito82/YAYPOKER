require('dotenv').config()
const express = require('express')
const R = require('radash')
const log = require('./logger')
const { z } = require('zod')

const http = require('http')
const WebSocket = require('ws')

const {
  generateUniqueId,
  randomName,
  generateSecretCode,
  socketId,
} = require('./utils')
const {
  ACTIONS,
  SERVER_CONFIG,
  GAME_RULES,
  CLEANUP_CONFIG,
} = require('./constants')

const app = express()

// ✅ AGREGADO: Middleware de CORS quirúrgico para permitir peticiones desde el frontend
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost',
    'https://yaypoker.com',
    'https://www.yaypoker.com',
    'http://osongo.duckdns.org',
  ]
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*')
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

const Match = require('./match')
const Socket = require('./sockets')
const Torneo = require('./torneo')
const WinnerCertificate = require('./winnerCertificate')

const startTime = new Date()

// Global error handlers to prevent server crashes and log explosions
let isLoggingError = false
process.on('uncaughtException', (error) => {
  if (isLoggingError) {
    if (error.code === 'EIO') process.exit(1)
    return
  }
  isLoggingError = true
  try {
    log
      .Template({
        name: 'brakets',
        title: 'SERVER:UNCAUGHT_EXCEPTION',
        date: true,
      })
      .R({ error: error.message, stack: error.stack })

    // Si el error es EIO (I/O error, terminal cerrada), forzar salida para evitar bucles
    if (error.code === 'EIO') process.exit(1)
  } catch (err) {
    process.exit(1)
  } finally {
    isLoggingError = false
  }
})

process.on('unhandledRejection', (reason, promise) => {
  if (isLoggingError) return
  isLoggingError = true
  try {
    log
      .Template({
        name: 'brakets',
        title: 'SERVER:UNHANDLED_REJECTION',
        date: true,
      })
      .R({ reason: reason?.message || reason, stack: reason?.stack })
  } catch (err) {
    // ignore
  } finally {
    isLoggingError = false
  }
})

// Periodic garbage collector for inactive/abandoned matches
// Runs every 10 minutes
setInterval(() => {
  const removedCount = Torneo.removeInactiveMatches(
    CLEANUP_CONFIG.MATCH_MAX_IDLE,
  )
  if (removedCount > 0) {
    log
      .Template({ name: 'brakets', title: 'SERVER:GC', date: true })
      .R({ msg: 'Cleaned up inactive matches', count: removedCount })
  }
}, CLEANUP_CONFIG.GC_INTERVAL)

// Validación de datos de entrada estructurada con Zod
const actionSchemas = {
  [ACTIONS.SIGN_UP]: z
    .object({
      totalChips: z.coerce
        .number()
        .min(GAME_RULES.CHIPS_VALIDATION.MIN, 'Invalid chips amount'),
    })
    .passthrough(),
  [ACTIONS.SET_BET]: z
    .object({
      chipsToBet: z.coerce.number().min(0, 'Invalid bet amount'),
    })
    .passthrough(),
  [ACTIONS.RAISE]: z
    .object({
      chipsToRiseBet: z.coerce.number().min(0, 'Invalid rise amount'),
    })
    .passthrough(),
  [ACTIONS.BLIND]: z
    .object({
      blindAmount: z.coerce.number().min(0, 'Invalid blind amount'),
    })
    .passthrough(),
  [ACTIONS.SEND_MESSAGE]: z
    .object({
      targetPlayerId: z.string().min(1),
      targetMessage: z.string(),
    })
    .passthrough(),
  [ACTIONS.VOICE_MESSAGE]: z
    .object({
      audioData: z.string().min(1),
    })
    .passthrough(),
}

const validateAction = (action, data) => {
  if (!action) return 'Action is required'
  const schema = actionSchemas[action]
  if (schema) {
    const result = schema.safeParse(data)
    if (!result.success) {
      return result.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
    }
    // Aplicar coerción de datos al objeto original para retrocompatibilidad
    Object.assign(data, result.data)
  }
  return null
}

// Mapeo de acciones a manejadores para mejor organización
// Option 3: Acceso Explícito por Espacio de Nombres
const actionHandlers = {
  [ACTIONS.SIGN_UP]: (match, socket, data) => match.lobby.signUp(data, socket),
  [ACTIONS.SEND_MESSAGE]: (match, socket, data) =>
    match.comms.sendMessage(data),
  [ACTIONS.VOICE_MESSAGE]: (match, socket, data) => {
    Socket.broadcastToTorneo(match.torneoId, {
      action: ACTIONS.VOICE_MESSAGE,
      data: {
        playerId: socket.id,
        playerName: socket.name,
        audioData: data.audioData,
      },
    })
  },
  [ACTIONS.FOLD]: (match, socket) => match.actions.fold(socket),
  [ACTIONS.CLOSE]: (match, socket) => match.lobby.close(socket),
  [ACTIONS.SET_BET]: (match, socket, data) =>
    match.actions.setBet(socket, data.chipsToBet),
  [ACTIONS.RAISE]: (match, socket, data) =>
    match.actions.setRise(socket, data.chipsToRiseBet),
  [ACTIONS.BLIND]: (match, socket, data) =>
    match.actions.setBet(socket, data.blindAmount, 'setBet', true),
  [ACTIONS.CALL]: (match, socket) => match.actions.setCall(socket),
  [ACTIONS.CHECK]: (match, socket) => match.actions.setCheck(socket),
  [ACTIONS.DEALT_PRIVATE_CARDS]: (match, socket) =>
    match.actions.dealtPrivateCards(socket),
  [ACTIONS.STATS]: (match, socket) => match.comms.stats(socket.id),
  [ACTIONS.NEXT_ROUND]: (match) => match.nextRound(),
  [ACTIONS.START_GAME]: (match, socket, data) => match.startGame(socket, data),
  [ACTIONS.PLAYER_READY]: (match, socket) => match.lobby.playerReady(socket),
}

wss.on('connection', (ws, req) => {
  const urlParams = new URLSearchParams(req.url.substring(1))

  let torneoId = urlParams.get('gameCode')

  // LÓGICA DE MESAS PÚBLICAS: Maximizar agrupación
  if (torneoId && torneoId.startsWith('P_')) {
    const availablePublicMatch = Torneo.findAvailablePublicMatch()

    // Si ya existe una mesa pública disponible, nos unimos a esa obligatoriamente
    if (availablePublicMatch && availablePublicMatch.torneoId !== torneoId) {
      console.log(
        `[LOBBY] REDIRECTING player from requested ${torneoId} to active match ${availablePublicMatch.torneoId} (Players: ${availablePublicMatch.players.length})`,
      )
      torneoId = availablePublicMatch.torneoId
    }
  } else if (!torneoId) {
    torneoId = generateUniqueId()
  }

  const playerName = urlParams.get('playerName') ?? randomName()

  const secretCode = urlParams.get('secretCode') ?? generateSecretCode()

  const thisSocket = {
    id: socketId(),
    name: playerName,
    torneoId,
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
    const Match = require('./match')
    const newSocketId = socketId()
    match = new Match(torneoId, newSocketId)
    Torneo.addMatch(match, torneoId) // REGISTRO INMEDIATO

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
        // En mesas públicas o si es un bot, el jugador se va inmediatamente
        const foundPlayer = match.players.find(p => p.id === thisSocket.id)
        const isBot = foundPlayer ? foundPlayer.isBot : false

        if (match.isPublic || isBot) {
          match.lobby.playerLeave(thisSocket)
        } else {
          match.lobby.pause(thisSocket)
        }
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

app.get('/api/public-table', (req, res) => {
  const availableMatch = Torneo.findAvailablePublicMatch()
  if (availableMatch) {
    return res.json({ torneoId: availableMatch.torneoId })
  }
  const { generatePublicId } = require('./utils')
  return res.json({ torneoId: generatePublicId() })
})

app.get('/verify/:torneoId/:code', (req, res) => {
  const { torneoId, code } = req.params
  const result = WinnerCertificate.verifyCertificate(torneoId, code)
  res.json(result)
})

app.get('/certificate/:torneoId', (req, res) => {
  const cert = WinnerCertificate.getCertificate(req.params.torneoId)
  if (!cert) return res.status(404).json({ error: 'Not found' })
  res.json({
    torneoId: cert.torneoId,
    winnerName: cert.winnerName,
    date: cert.date,
    totalPlayers: cert.totalPlayers,
    verified: cert.verified,
  })
})

app.get('/*splat', (req, res) => {
  res.redirect('/')
})

// Inicialización del servidor
const PORT = SERVER_CONFIG.PORT
const PROTOCOL = SERVER_CONFIG.PROTOCOL
const BASE = SERVER_CONFIG.BASE_URL

if (require.main === module) {
  server.listen(PORT, () => {
    log.Template({ name: 'brakets', title: 'SERVER:LISTENING', date: true }).R({
      port: PORT,
      url: `${PROTOCOL}://${BASE}:${PORT}`,
      env: process.env.NODE_ENV || 'development',
    })
  })
}

module.exports = { app, server, wss, validateAction }
