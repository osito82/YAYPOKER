const Socket = require('../sockets')
const Player = require('../player')

class MatchLobby {
  constructor(match) {
    this.match = match
  }

  startLobbyTimer() {
    this.clearLobbyTimer()
    this.match.lobbyStartTime = Date.now()

    const connectedCount = this.match.players.filter((p) => p.connected).length
    const readyCount = this.match.players.filter(
      (p) => p.isStarted && p.connected,
    ).length

    this.match.log
      .Template({
        name: 'brakets',
        title: 'MATCH - Lobby Timer Started',
        date: true,
      })
      .R({
        duration: `${this.match.lobbyTimerDuration / 1000}s`,
        connected: connectedCount,
        ready: readyCount,
      })

    this.match.communicator.msgBuilder('lobbyTimer', 'public', null, {
      displayMsg: `Game will start in ${this.match.lobbyTimerDuration / 1000} seconds.`,
      timeRemaining: this.match.lobbyTimerDuration / 1000,
      totalDuration: this.match.lobbyTimerDuration / 1000,
      connectedPlayers: connectedCount,
      readyPlayers: readyCount,
    })
    Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())

    this.match.lobbyTimer = setTimeout(() => {
      this.forceStartGame()
    }, this.match.lobbyTimerDuration)
  }

  clearLobbyTimer() {
    if (this.match.lobbyTimer) {
      clearTimeout(this.match.lobbyTimer)
      this.match.lobbyTimer = null
      this.match.lobbyStartTime = null
    }
  }

  playerReady(thisSocket) {
    const foundPlayer = this.match.players.find((p) => p.id === thisSocket.id)
    if (foundPlayer) {
      foundPlayer.setStarted(true)

      this.match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Player Ready',
          date: true,
        })
        .R({ player: foundPlayer.name })

      this.match.communicator.msgBuilder('playerReady', 'public', foundPlayer, {
        displayMsg: `${foundPlayer.name} is ready!`,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())

      // Check if all connected players are ready
      const connectedPlayers = this.match.players.filter((p) => p.connected)
      const readyPlayers = connectedPlayers.filter((p) => p.isStarted)

      if (
        readyPlayers.length === connectedPlayers.length &&
        readyPlayers.length >= 2
      ) {
        this.match.log
          .Template({
            name: 'brakets',
            title: 'MATCH - All Players Ready',
            date: true,
          })
          .R({ count: readyPlayers.length })
        this.clearLobbyTimer()
        this.forceStartGame()
      } else {
        // Reset lobby timer to give others more time as someone just showed interest
        if (!this.match.stepChecker.checkStep('blindsBetting')) {
          this.startLobbyTimer()
        }
      }
    }
  }

  forceStartGame() {
    this.clearLobbyTimer()

    // 🔥 Force all connected players to be ready when timer expires
    this.match.players.forEach((p) => {
      if (p.connected) p.setStarted(true)
    })

    const readyPlayers = this.match.players.filter((p) => p.isStarted && p.connected)

    if (readyPlayers.length < 2) {
      const connectedCount = this.match.players.filter((p) => p.connected).length

      this.match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Start Failed',
          date: true,
        })
        .R({
          reason: 'Not enough ready players',
          readyCount: readyPlayers.length,
          connectedCount,
        })

      this.match.communicator.msgBuilder('lobbyError', 'public', null, {
        displayMsg:
          readyPlayers.length < 2
            ? 'Waiting for at least 2 players to be ready...'
            : 'Not enough players ready. Game delayed.',
        readyPlayers: readyPlayers.length,
        connectedPlayers: connectedCount,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())

      // If we have people connected but not ready, we don't \"cancel\", we just wait.
      // The timer will restart when someone else joins or someone clicks ready.
      return
    }

    this.match.log
      .Template({ name: 'brakets', title: 'MATCH - Game Starting', date: true })
      .R({ readyPlayers: readyPlayers.map((p) => p.name) })

    this.noMorePlayers()
    this.match.stepChecker.grantStep('signUp')
    this.match.startGame()
  }

  signUp(data, thisSocket) {
    this.match.lastActivity = Date.now()
    const {
      id: thisSocketId,
      name: thisSocketName,
      secretCode: thisSecretCode,
    } = thisSocket

    // Buscar jugador existente por secretCode para re-conexión
    const existingPlayerIndex = this.match.players.findIndex(
      (s) => s.secretCode === thisSecretCode,
    )

    let player
    if (existingPlayerIndex !== -1) {
      // ✅ LÓGICA DE RE-CONEXIÓN (Mismo usuario, otra pestaña o reconexión)
      player = this.match.players[existingPlayerIndex]
      const oldId = player.id

      // Si el ID es el mismo, es un re-envío del mismo socket, ignoramos
      if (oldId === thisSocketId && player.connected) return

      player.id = thisSocketId
      player.setConnected(true)

      // Actualizar referencias al ID antiguo si es necesario
      if (this.match.activePlayerId === oldId) {
        this.match.activePlayerId = thisSocketId
      }
      this.match.dealer.updatePlayerId(oldId, thisSocketId)

      const timeout = this.match.pauseTimeouts.get(player.name)
      if (timeout) {
        clearTimeout(timeout)
        this.match.pauseTimeouts.delete(player.name)
      }

      const stillPaused = this.match.players.some((p) => !p.connected)
      if (!stillPaused && this.match.stepChecker.checkStep('pause')) {
        this.match.stepChecker.revokeStep('pause')
        this.match.continue(thisSocket)
      }

      this.match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Player Reconnected',
          date: true,
        })
        .R({ name: player.name, id: player.id, secretCode: player.secretCode })

      // 🔥 SINCRONIZAR TIMER SI ESTÁ ACTIVO
      if (this.match.lobbyTimer) {
        const timeElapsed = (Date.now() - this.match.lobbyStartTime) / 1000
        const timeRemaining = Math.max(
          0,
          this.match.lobbyTimerDuration / 1000 - timeElapsed,
        )

        const connectedCount = this.match.players.filter((p) => p.connected).length
        const readyCount = this.match.players.filter(
          (p) => p.isStarted && p.connected,
        ).length

        this.match.communicator.msgBuilder('lobbyTimer', 'public', null, {
          displayMsg: `Game will start in ${Math.ceil(timeRemaining)} seconds.`,
          timeRemaining: timeRemaining,
          totalDuration: this.match.lobbyTimerDuration / 1000,
          connectedPlayers: connectedCount,
          readyPlayers: readyCount,
        })
        // Enviamos SOLO al jugador que reconectó
        Socket.sendToPlayer(
          this.match.torneoId,
          player.secretCode,
          this.match.communicator.getMsg(),
        )
      }
    } else {
      // 🆕 LÓGICA DE NUEVO JUGADOR
      if (this.match.players.length >= 10) {
        this.match.communicator.msgBuilder('signUp', 'private', null, {
          displayMsg: 'Table is full (max 10 players).',
        })
        this.match.dealer.talkToSocketById(thisSocket.id, this.match.communicator.getMsg())
        return
      }

      if (!this.match.acceptingPlayers) {
        this.match.communicator.msgBuilder('signUp', 'private', null, {
          displayMsg: 'Game in progress. Please wait for next round.',
        })
        this.match.dealer.talkToSocketById(thisSocket.id, this.match.communicator.getMsg())
        return
      }

      let finalName = data.name
      let counter = 1
      while (this.match.players.some((p) => p.name === finalName)) {
        finalName = `${data.name}-${counter}`
        counter++
      }

      thisSocket.name = finalName

      const playerNumber = this.match.players.length + 1
      player = new Player(
        this.match.gameId,
        finalName,
        data.secretCode,
        data.totalChips,
        [],
        thisSocketId,
        playerNumber,
      )
      player.setConnected(true)
      this.match.players.push(player)

      if (this.match.players.length >= 10) {
        this.noMorePlayers()
      }

      this.match.log
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
      if (!this.match.stepChecker.checkStep('blindsBetting')) {
        this.startLobbyTimer()
      }
    }

    this.match.communicator.msgBuilder('signUp', 'public', player, {
      msg: `Welcome ${player.name}!`,
    })
    Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())

    this.match.communicator.msgBuilder('signUp', 'private', player, {
      method: 'signUp',
      id: thisSocketId,
    })

    Socket.sendToPlayer(
      this.match.torneoId,
      player.secretCode,
      this.match.communicator.getMsg(),
    )

    if (existingPlayerIndex !== -1) {
      this.match.comms.sendOdds(player)
    }

    const connectedPlayers = this.match.players.filter((p) => p.connected)
    if (
      connectedPlayers.length >= 2 &&
      !this.match.stepChecker.checkStep('blindsBetting')
    ) {
      this.match.stepChecker.grantStep('signUp')
    }
  }

  noMorePlayers() {
    if (!this.match.acceptingPlayers) {
      return
    }
    this.match.acceptingPlayers = false

    this.match.log
      .Template({
        name: 'brakets',
        title: 'MATCH - Registration Closed',
        date: true,
      })
      .R({ gameId: this.match.gameId })

    this.match.communicator.msgBuilder('noMorePlayers', 'public', null, {
      displayMsg: 'Registration closed. Game in progress.',
    })

    Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())
  }

  pause(thisSocket) {
    const time = this.match.constructor.timeouts.pause
    const socketId = typeof thisSocket === 'string' ? thisSocket : thisSocket.id
    const foundPlayer = this.match.players.find((p) => p.id === socketId)
    if (foundPlayer) {
      foundPlayer.setConnected(false)
      this.match.actions.clearAutofold()
      this.match.stepChecker.grantStep('pause')
      this.match.log
        .Template({ name: 'brakets', title: 'MATCH - PAUSE', date: true })
        .R({ player: foundPlayer.name, reason: 'Disconnected' })

      this.match.communicator.msgBuilder('pause', 'public', foundPlayer, {
        displayMsg: `${foundPlayer.name} disconnected. Waiting ${time / 1000} seconds for reconnection...`,
        timeout: time / 1000,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())

      const timeout = setTimeout(() => {
        this.playerLeave(thisSocket)
        this.match.pauseTimeouts.delete(foundPlayer.name)
      }, time)
      this.match.pauseTimeouts.set(foundPlayer.name, timeout)
    }
  }

  close(thisSocket) {
    this.playerLeave(thisSocket)
  }

  playerLeave(thisSocket) {
    const socketId = typeof thisSocket === 'string' ? thisSocket : thisSocket.id
    const index = this.match.players.findIndex((p) => p.id === socketId)
    if (index !== -1) {
      const playerLeaving = this.match.players[index]
      this.match.communicator.msgBuilder('playerLeave', 'public', playerLeaving, {
        displayMsg: `${playerLeaving.name} has left the game.`,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())
      this.match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Player Leaving',
          date: true,
        })
        .R({ player: playerLeaving.name })
      if (this.match.activePlayerId === playerLeaving.id) {
        this.match.activePlayerId = null
        this.match.actions.clearAutofold()
      }
      this.match.players.splice(index, 1)
    }
    const stillPaused = this.match.players.some((p) => !p.connected)
    if (!stillPaused) {
      this.match.stepChecker.revokeStep('pause')
    }
    this.match.continue(thisSocket)
  }
}

module.exports = MatchLobby
