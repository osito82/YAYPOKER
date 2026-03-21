const express = require('express')
const R = require('radash')
const log = require('./logger')
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
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

const Match = require('./match')
const Socket = require('./sockets')
const Torneo = require('./torneo')

const startTime = new Date()

// Periodic garbage collector
setInterval(() => {
  const removedCount = Torneo.removeInactiveMatches(CLEANUP_CONFIG.MATCH_MAX_IDLE)
  if (removedCount > 0) log.Template({ name: 'brakets', title: 'SERVER:GC', date: true }).R({ count: removedCount })
}, CLEANUP_CONFIG.GC_INTERVAL)

const validateAction = (action, data) => {
  if (!action) return 'Action is required'
  return null // Simplificado para depuración
}

const actionHandlers = {
  [ACTIONS.SIGN_UP]: (match, socket, data) => match.lobby.signUp(data, socket),
  [ACTIONS.SEND_MESSAGE]: (match, socket, data) => match.comms.sendMessage(data),
  [ACTIONS.FOLD]: (match, socket) => match.actions.fold(socket),
  [ACTIONS.CLOSE]: (match, socket) => match.lobby.close(socket),
  [ACTIONS.SET_BET]: (match, socket, data) => match.actions.setBet(socket, data.chipsToBet),
  [ACTIONS.RAISE]: (match, socket, data) => match.actions.setRise(socket, data.chipsToRiseBet),
  [ACTIONS.BLIND]: (match, socket, data) => match.actions.setBet(socket, data.blindAmount),
  [ACTIONS.CALL]: (match, socket) => match.actions.setCall(socket),
  [ACTIONS.CHECK]: (match, socket) => match.actions.setCheck(socket),
  [ACTIONS.DEALT_PRIVATE_CARDS]: (match, socket) => match.actions.dealtPrivateCards(socket),
  [ACTIONS.STATS]: (match, socket) => match.comms.stats(socket.id),
  [ACTIONS.NEXT_ROUND]: (match) => match.nextRound(),
  [ACTIONS.START_GAME]: (match, socket, data) => match.startGame(socket, data),
  [ACTIONS.PLAYER_READY]: (match, socket) => match.lobby.playerReady(socket),
}

wss.on('connection', (ws, req) => {
  const urlParams = new URLSearchParams(req.url.substring(1))
  const torneoId = urlParams.get('gameCode') ?? generateUniqueId()
  const playerName = urlParams.get('playerName') ?? randomName()
  const secretCode = urlParams.get('secretCode') ?? generateSecretCode()

  const thisSocket = { id: socketId(), name: playerName, secretCode, socket: ws }
  Socket.addSocket(thisSocket, torneoId)

  let match = Torneo.getMatch(torneoId)
  if (!match) {
    match = new Match(torneoId, socketId())
    Torneo.addMatch(match, torneoId)
  }

  ws.on('message', (data) => {
    try {
      const jsonData = JSON.parse(data.toString())
      
      // LOG DE EMERGENCIA: Ver qué llega realmente
      if (jsonData.action === 'startGame') {
        console.log('------------------------------------------');
        console.log('[DEBUG] RECEIVED startGame from client');
        console.log('[DEBUG] Full Payload:', JSON.stringify(jsonData, null, 2));
        console.log('------------------------------------------');
      }

      const handler = actionHandlers[jsonData.action]
      if (handler) {
        handler(match, thisSocket, jsonData)
      }
    } catch (error) {
      console.error('[SERVER ERROR]', error.message);
    }
  })

  ws.on('close', () => { if (match) match.lobby.pause(thisSocket) })
})

server.listen(SERVER_CONFIG.PORT, () => {
  console.log(`POKER SERVER RUNNING ON PORT ${SERVER_CONFIG.PORT}`);
})

module.exports = { app, server, wss }
