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
          title: 'LOBBY:PLAYER_READY',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          player: foundPlayer.name,
          playerCards: foundPlayer.cards,
          playerSecret: foundPlayer.secretCode,
          dealerCards: this.match.cardsDealer,
        })

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
          title: 'ERROR:START_FAILED',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          reason: 'Not enough ready players',
          readyCount: readyPlayers.length,
          connectedCount,
          dealerCards: this.match.cardsDealer,
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
      .Template({ name: 'brakets', title: 'LOBBY:GAME_STARTING', date: true })
      .R({
        torneoId: this.match.torneoId,
        handId: this.match.currentHandId,
        readyPlayers: readyPlayers.map((p) => p.name),
        dealerCards: this.match.cardsDealer,
      })

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

      this.match.log
        .Template({
          name: 'brakets',
          title: 'LOBBY:PLAYER_RECONNECTED',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          name: player.name,
          id: player.id,
          playerCards: player.cards,
          playerSecret: player.secretCode,
          dealerCards: this.match.cardsDealer,
          chips: player.chips,
        })

      // Verificar si el juego estaba pausado por falta de jugadores y continuar si es necesario
      const stillPaused = this.match.players.some((p) => !p.connected)
      if (!stillPaused && this.match.stepChecker.checkStep('pause')) {
        this.match.stepChecker.revokeStep('pause')
        this.match.continue(thisSocket)
      }

      // SALIR AQUÍ: No queremos que la reconexión ejecute lógica de "nuevo jugador"
      this.match.communicator.msgBuilder('signUp', 'private', player, {
        method: 'signUp',
        id: thisSocketId,
        hostId: this.match.hostId,
        gameId: this.match.gameId,
      })

      Socket.sendToPlayer(
        this.match.torneoId,
        player.secretCode,
        this.match.communicator.getMsg(),
      )

      // ✅ NOTIFICAR A TODOS: Importante para que el lobby vea que el jugador está "Online" de nuevo
      this.match.communicator.msgBuilder('signUp', 'public', player, {
        msg: `${player.name} reconnected.`,
        hostId: this.match.hostId,
      })
      Socket.broadcastToTorneo(
        this.match.torneoId,
        this.match.communicator.getMsg(),
      )

      this.match.comms.sendOdds(player)

      // 🔥 RE-NOTIFICAR TURNO SI ES NECESARIO
      if (this.match.activePlayerId === player.id) {
        setTimeout(() => {
          if (this.match.activePlayerId === player.id) {
            this.match.actions.sendCurrentPrompt(player)
          }
        }, 500)
      }

      return
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
          title: 'LOBBY:PLAYER_JOIN',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          name: player.name,
          playerSecret: player.secretCode,
          dealerCards: this.match.cardsDealer,
          chips: player.chips,
          num: playerNumber,
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
        title: 'LOBBY:REGISTRATION_CLOSED',
        date: true,
      })
      .R({
        torneoId: this.match.torneoId,
        handId: this.match.currentHandId,
        gameId: this.match.gameId,
        dealerCards: this.match.cardsDealer,
      })

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
        .Template({ name: 'brakets', title: 'LOBBY:PLAYER_PAUSED', date: true })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          player: foundPlayer.name,
          playerCards: foundPlayer.cards,
          playerSecret: foundPlayer.secretCode,
          dealerCards: this.match.cardsDealer,
          reason: 'Disconnected',
        })

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
          title: 'LOBBY:PLAYER_LEAVE',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          player: playerLeaving.name,
          playerCards: playerLeaving.cards,
          playerSecret: playerLeaving.secretCode,
          dealerCards: this.match.cardsDealer,
        })
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
