const Socket = require('../sockets')
const Player = require('../player')

class MatchLobby {
  constructor(match) {
    this.match = match
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
      Socket.broadcastToTorneo(
        this.match.torneoId,
        this.match.communicator.getMsg(),
      )
    }
  }

  forceStartGame(thisSocket) {
    // Solo el host puede forzar el inicio
    if (thisSocket.id !== this.match.hostId) {
      this.match.communicator.msgBuilder('lobbyError', 'private', null, {
        displayMsg: 'Only the host can start the game.',
      })
      this.match.dealer.talkToSocketById(
        thisSocket.id,
        this.match.communicator.getMsg(),
      )
      return
    }

    // 🔥 Forzar a todos los jugadores conectados a estar listos
    this.match.players.forEach((p) => {
      if (p.connected) p.setStarted(true)
    })

    const readyPlayers = this.match.getStartedPlayers(true)

    if (readyPlayers.length < 2) {
      const connectedCount = this.match.getConnectedPlayers().length

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
          'Waiting for at least 2 players to be connected to start...',
        readyPlayers: readyPlayers.length,
        connectedPlayers: connectedCount,
      })
      Socket.broadcastToTorneo(
        this.match.torneoId,
        this.match.communicator.getMsg(),
      )
      return
    }

    this.match.log
      .Template({ name: 'brakets', title: 'MATCH - Game Starting', date: true })
      .R({ readyPlayers: readyPlayers.map((p) => p.name) })

    this.noMorePlayers()
    this.match.stepChecker.grantStep('signUp')
    this.match.startGame(thisSocket)
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

    // Si no coincide el código secreto pero el nombre ya está en la mesa, ignoramos silenciosamente
    // para evitar suplantaciones o errores de reconexión durante el juego.
    const nameMatch = this.match.players.find(
      (p) => p.name === (data.name || thisSocketName),
    )
    if (
      existingPlayerIndex === -1 &&
      nameMatch &&
      !this.match.acceptingPlayers
    ) {
      return
    }

    let player
    if (existingPlayerIndex !== -1) {
      // ✅ LÓGICA DE RE-CONEXIÓN
      player = this.match.players[existingPlayerIndex]
      const oldId = player.id

      if (oldId === thisSocketId && player.connected) return

      player.id = thisSocketId
      player.setConnected(true)

      if (this.match.activePlayerId === oldId) {
        this.match.activePlayerId = thisSocketId
      }
      this.match.dealer.updatePlayerId(oldId, thisSocketId)

      // Si el host se reconecta, restaurar su ID
      if (this.match.hostId === oldId) {
        this.match.hostId = thisSocketId
      }

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
    } else {
      // 🆕 LÓGICA DE NUEVO JUGADOR
      if (this.match.players.length >= 10) {
        this.match.communicator.msgBuilder('signUp', 'private', null, {
          displayMsg: 'Table is full (max 10 players).',
        })
        this.match.dealer.talkToSocketById(
          thisSocket.id,
          this.match.communicator.getMsg(),
        )
        return
      }

      if (!this.match.acceptingPlayers) {
        this.match.communicator.msgBuilder('signUp', 'private', null, {
          displayMsg: 'Game in progress. Please wait for next round.',
        })
        this.match.dealer.talkToSocketById(
          thisSocket.id,
          this.match.communicator.getMsg(),
        )
        return
      }

      let finalName = data.name || thisSocketName
      let counter = 1
      while (this.match.players.some((p) => p.name === finalName)) {
        finalName = `${data.name || thisSocketName}-${counter}`
        counter++
      }

      thisSocket.name = finalName

      const playerNumber = this.match.players.length + 1
      player = new Player(
        this.match.gameId,
        finalName,
        thisSecretCode,
        data.totalChips,
        [],
        thisSocketId,
        playerNumber,
      )
      player.setConnected(true)
      this.match.players.push(player)

      // Si es el primer jugador, es el host
      if (this.match.players.length === 1) {
        this.match.hostId = thisSocketId
      }

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
          isHost: this.match.hostId === thisSocketId,
        })
    }

    this.match.communicator.msgBuilder('signUp', 'public', player, {
      msg: `Welcome ${player.name}!`,
      hostId: this.match.hostId,
    })
    Socket.broadcastToTorneo(
      this.match.torneoId,
      this.match.communicator.getMsg(),
    )

    this.match.communicator.msgBuilder('signUp', 'private', player, {
      method: 'signUp',
      id: thisSocketId,
      hostId: this.match.hostId,
    })

    Socket.sendToPlayer(
      this.match.torneoId,
      player.secretCode,
      this.match.communicator.getMsg(),
    )

    if (existingPlayerIndex !== -1) {
      this.match.comms.sendOdds(player)
    }

    const connectedPlayers = this.match.getConnectedPlayers()
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

    Socket.broadcastToTorneo(
      this.match.torneoId,
      this.match.communicator.getMsg(),
    )
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
      Socket.broadcastToTorneo(
        this.match.torneoId,
        this.match.communicator.getMsg(),
      )

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
      this.match.communicator.msgBuilder(
        'playerLeave',
        'public',
        playerLeaving,
        {
          displayMsg: `${playerLeaving.name} has left the game.`,
        },
      )
      Socket.broadcastToTorneo(
        this.match.torneoId,
        this.match.communicator.getMsg(),
      )
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

      // Si el que se va es el host, asignar nuevo host
      if (this.match.hostId === playerLeaving.id) {
        this.match.hostId = null
        this.match.players.splice(index, 1)
        if (this.match.players.length > 0) {
          // Asignar al siguiente jugador conectado como host
          const nextHost = this.match.players.find((p) => p.connected)
          if (nextHost) {
            this.match.hostId = nextHost.id
            this.match.communicator.msgBuilder('newHost', 'public', null, {
              displayMsg: `${nextHost.name} is the new host.`,
              hostId: this.match.hostId,
            })
            Socket.broadcastToTorneo(
              this.match.torneoId,
              this.match.communicator.getMsg(),
            )
          }
        }
      } else {
        this.match.players.splice(index, 1)
      }
    }
    const stillPaused = this.match.players.some((p) => !p.connected)
    if (!stillPaused) {
      this.match.stepChecker.revokeStep('pause')
    }
    this.match.continue(thisSocket)
  }
}

module.exports = MatchLobby
