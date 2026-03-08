const Socket = require('../sockets')

/**
 * Handle the autofold logic.
 */
function autofold(match) {
  const foundPlayer = match.players.find((p) => p.id == match.activePlayerId)
  if (foundPlayer) {
    match.log
      .Template({ name: 'brakets', title: 'MATCH - AUTOFOLD', date: true })
      .R({ player: foundPlayer.name })
    match.fold({ id: foundPlayer.id })
  }
}

/**
 * Start the autofold timer.
 */
function startAutofold(match) {
  clearAutofold(match)
  match.autofoldTimer = setTimeout(() => {
    autofold(match)
  }, match.autofoldDuration)
}

/**
 * Clear the autofold timer.
 */
function clearAutofold(match) {
  if (match.autofoldTimer) {
    clearTimeout(match.autofoldTimer)
    match.autofoldTimer = null
  }
}

/**
 * Start the lobby timer.
 */
function startLobbyTimer(match) {
  clearLobbyTimer(match)
  match.lobbyStartTime = Date.now()

  const connectedCount = match.players.filter((p) => p.connected).length
  const readyCount = match.players.filter(
    (p) => p.isStarted && p.connected,
  ).length

  match.log
    .Template({
      name: 'brakets',
      title: 'MATCH - Lobby Timer Started',
      date: true,
    })
    .R({
      duration: `${match.lobbyTimerDuration / 1000}s`,
      connected: connectedCount,
      ready: readyCount,
    })

  match.communicator.msgBuilder('lobbyTimer', 'public', null, {
    displayMsg: `Game will start in ${match.lobbyTimerDuration / 1000} seconds.`,
    timeRemaining: match.lobbyTimerDuration / 1000,
    totalDuration: match.lobbyTimerDuration / 1000,
    connectedPlayers: connectedCount,
    readyPlayers: readyCount,
  })
  Socket.broadcastToTorneo(match.torneoId, match.communicator.getMsg())

  match.lobbyTimer = setTimeout(() => {
    match.forceStartGame()
  }, match.lobbyTimerDuration)
}

/**
 * Clear the lobby timer.
 */
function clearLobbyTimer(match) {
  if (match.lobbyTimer) {
    clearTimeout(match.lobbyTimer)
    match.lobbyTimer = null
    match.lobbyStartTime = null
  }
}

module.exports = {
  startAutofold,
  clearAutofold,
  startLobbyTimer,
  clearLobbyTimer,
  autofold,
}
