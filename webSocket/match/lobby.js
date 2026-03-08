const Player = require('../player')
const Socket = require('../sockets')

/**
 * Handle player sign up.
 */
function signUp(match, data, thisSocket) {
  match.lastActivity = Date.now()
  const {
    id: thisSocketId,
    name: thisSocketName,
    secretCode: thisSecretCode,
  } = thisSocket

  // Buscar jugador existente por secretCode para re-conexión
  const existingPlayerIndex = match.players.findIndex(
    (s) => s.secretCode === thisSecretCode,
  )

  let player
  if (existingPlayerIndex !== -1) {
    // ✅ LÓGICA DE RE-CONEXIÓN (Mismo usuario, otra pestaña o reconexión)
    player = match.players[existingPlayerIndex]
    const oldId = player.id

    // Si el ID es el mismo, es un re-envío del mismo socket, ignoramos
    if (oldId === thisSocketId && player.connected) return

    player.id = thisSocketId
    player.setConnected(true)

    // Actualizar referencias al ID antiguo si es necesario
    if (match.activePlayerId === oldId) {
      match.activePlayerId = thisSocketId
    }
    match.dealer.updatePlayerId(oldId, thisSocketId)

    const timeout = match.pauseTimeouts.get(player.name)
    if (timeout) {
      clearTimeout(timeout)
      match.pauseTimeouts.delete(player.name)
    }

    const stillPaused = match.players.some((p) => !p.connected)
    if (!stillPaused && match.stepChecker.checkStep('pause')) {
      match.stepChecker.revokeStep('pause')
      match.continue(thisSocket)
    }

    match.log
      .Template({
        name: 'brakets',
        title: 'MATCH - Player Reconnected',
        date: true,
      })
      .R({ name: player.name, id: player.id, secretCode: player.secretCode })

    // 🔥 SINCRONIZAR TIMER SI ESTÁ ACTIVO
    if (match.lobbyTimer) {
      const timeElapsed = (Date.now() - match.lobbyStartTime) / 1000
      const timeRemaining = Math.max(
        0,
        match.lobbyTimerDuration / 1000 - timeElapsed,
      )

      const connectedCount = match.players.filter((p) => p.connected).length
      const readyCount = match.players.filter(
        (p) => p.isStarted && p.connected,
      ).length

      match.communicator.msgBuilder('lobbyTimer', 'public', null, {
        displayMsg: `Game will start in ${Math.ceil(timeRemaining)} seconds.`,
        timeRemaining: timeRemaining,
        totalDuration: match.lobbyTimerDuration / 1000,
        connectedPlayers: connectedCount,
        readyPlayers: readyCount,
      })
      // Enviamos SOLO al jugador que reconectó
      Socket.sendToPlayer(
        match.torneoId,
        player.secretCode,
        match.communicator.getMsg(),
      )
    }
  } else {
    // 🆕 LÓGICA DE NUEVO JUGADOR
    if (match.players.length >= 10) {
      match.communicator.msgBuilder('signUp', 'private', null, {
        displayMsg: 'Table is full (max 10 players).',
      })
      match.dealer.talkToSocketById(thisSocket.id, match.communicator.getMsg())
      return
    }

    if (!match.acceptingPlayers) {
      match.communicator.msgBuilder('signUp', 'private', null, {
        displayMsg: 'Game in progress. Please wait for next round.',
      })
      match.dealer.talkToSocketById(thisSocket.id, match.communicator.getMsg())
      return
    }

    let finalName = data.name
    let counter = 1
    while (match.players.some((p) => p.name === finalName)) {
      finalName = `${data.name}-${counter}`
      counter++
    }

    thisSocket.name = finalName

    const playerNumber = match.players.length + 1
    player = new Player(
      match.gameId,
      finalName,
      data.secretCode,
      data.totalChips,
      [],
      thisSocketId,
      playerNumber,
    )
    player.setConnected(true)
    match.players.push(player)

    if (match.players.length >= 10) {
      noMorePlayers(match)
    }

    match.log
      .Template({
        name: 'brakets',
        title: 'MATCH - New Player Joined',
        date: true,
      })
      .R({
        name: player.name,
        chips: player.chips,
        num: playerNumber,
        secretCode: player.secretCode,
      })

    // Reset lobby timer ONLY for genuinely new players
    if (!match.stepChecker.checkStep('blindsBetting')) {
      match.startLobbyTimer()
    }
  }

  match.communicator.msgBuilder('signUp', 'public', player, {
    msg: `Welcome ${player.name}!`,
  })
  Socket.broadcastToTorneo(match.torneoId, match.communicator.getMsg())

  match.communicator.msgBuilder('signUp', 'private', player, {
    method: 'signUp',
    id: thisSocketId,
  })

  Socket.sendToPlayer(
    match.torneoId,
    player.secretCode,
    match.communicator.getMsg(),
  )

  if (existingPlayerIndex !== -1) {
    match.sendOdds(player)
  }

  const connectedPlayers = match.players.filter((p) => p.connected)
  if (
    connectedPlayers.length >= 2 &&
    !match.stepChecker.checkStep('blindsBetting')
  ) {
    match.stepChecker.grantStep('signUp')
  }
}

/**
 * Close registration.
 */
function noMorePlayers(match) {
  if (!match.acceptingPlayers) {
    return
  }
  match.acceptingPlayers = false

  match.log
    .Template({
      name: 'brakets',
      title: 'MATCH - Registration Closed',
      date: true,
    })
    .R({ gameId: match.gameId })

  match.communicator.msgBuilder('noMorePlayers', 'public', null, {
    displayMsg: 'Registration closed. Game in progress.',
  })

  Socket.broadcastToTorneo(match.torneoId, match.communicator.getMsg())
}

/**
 * Mark player as ready.
 */
function playerReady(match, thisSocket) {
  const foundPlayer = match.players.find((p) => p.id === thisSocket.id)
  if (foundPlayer) {
    foundPlayer.setStarted(true)

    match.log
      .Template({
        name: 'brakets',
        title: 'MATCH - Player Ready',
        date: true,
      })
      .R({ player: foundPlayer.name })

    match.communicator.msgBuilder('playerReady', 'public', foundPlayer, {
      displayMsg: `${foundPlayer.name} is ready!`,
    })
    Socket.broadcastToTorneo(match.torneoId, match.communicator.getMsg())

    // Check if all connected players are ready
    const connectedPlayers = match.players.filter((p) => p.connected)
    const readyPlayers = connectedPlayers.filter((p) => p.isStarted)

    if (
      readyPlayers.length === connectedPlayers.length &&
      readyPlayers.length >= 2
    ) {
      match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - All Players Ready',
          date: true,
        })
        .R({ count: readyPlayers.length })
      match.clearLobbyTimer()
      match.forceStartGame()
    } else {
      // Reset lobby timer to give others more time as someone just showed interest
      if (!match.stepChecker.checkStep('blindsBetting')) {
        match.startLobbyTimer()
      }
    }
  }
}

/**
 * Handle player leaving.
 */
function playerLeave(match, thisSocket) {
  const socketId = typeof thisSocket === 'string' ? thisSocket : thisSocket.id
  const index = match.players.findIndex((p) => p.id === socketId)
  if (index !== -1) {
    const playerLeaving = match.players[index]
    match.communicator.msgBuilder('playerLeave', 'public', playerLeaving, {
      displayMsg: `${playerLeaving.name} has left the game.`,
    })
    Socket.broadcastToTorneo(match.torneoId, match.communicator.getMsg())
    match.log
      .Template({
        name: 'brakets',
        title: 'MATCH - Player Leaving',
        date: true,
      })
      .R({ player: playerLeaving.name })
    if (match.activePlayerId === playerLeaving.id) {
      match.activePlayerId = null
      match.clearAutofold()
    }
    match.players.splice(index, 1)
  }
  const stillPaused = match.players.some((p) => !p.connected)
  if (!stillPaused) {
    match.stepChecker.revokeStep('pause')
  }
  match.continue(thisSocket)
}

/**
 * Handle game pause (e.g. disconnection).
 */
function pause(match, thisSocket) {
  const time = match.constructor.timeouts.pause
  const socketId = typeof thisSocket === 'string' ? thisSocket : thisSocket.id
  const foundPlayer = match.players.find((p) => p.id === socketId)
  if (foundPlayer) {
    foundPlayer.setConnected(false)
    match.clearAutofold()
    match.stepChecker.grantStep('pause')
    match.log
      .Template({ name: 'brakets', title: 'MATCH - PAUSE', date: true })
      .R({ player: foundPlayer.name, reason: 'Disconnected' })

    match.communicator.msgBuilder('pause', 'public', foundPlayer, {
      displayMsg: `${foundPlayer.name} disconnected. Waiting ${time / 1000} seconds for reconnection...`,
      timeout: time / 1000,
    })
    Socket.broadcastToTorneo(match.torneoId, match.communicator.getMsg())

    const timeout = setTimeout(() => {
      playerLeave(match, thisSocket)
      match.pauseTimeouts.delete(foundPlayer.name)
    }, time)
    match.pauseTimeouts.set(foundPlayer.name, timeout)
  }
}

/**
 * Close the match.
 */
function close(match, thisSocket) {
  playerLeave(match, thisSocket)
}

module.exports = {
  signUp,
  playerReady,
  noMorePlayers,
  playerLeave,
  pause,
  close,
}
