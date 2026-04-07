const Socket = require('../sockets')
const Player = require('../player')
const { GAME_RULES, TIMEOUTS } = require('../constants')

class MatchLobby {
  constructor(context) {
    this.match = context.match
    this.emitter = context.emitter
    this.log = context.log
    this.communicator = context.communicator
    this.dealer = context.dealer
    this.stepChecker = context.stepChecker
  }

  playerReady(thisSocket) {
    const foundPlayer = this.match.players.find((p) => p.id === thisSocket.id)
    if (foundPlayer) {
      foundPlayer.setStarted(true)

      this.log
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

      this.communicator.msgBuilder('playerReady', 'public', foundPlayer, {
        displayMsg: `${foundPlayer.name} is ready!`,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())
    }
  }

  forceStartGame(thisSocket) {
    // Solo el host puede forzar el inicio
    if (thisSocket.id !== this.match.hostId) {
      this.communicator.msgBuilder('lobbyError', 'private', null, {
        displayMsg: 'Only the host can start the game.',
      })
      this.dealer.talkToSocketById(thisSocket.id, this.communicator.getMsg())
      return
    }

    // 🔥 Forzar a todos los jugadores conectados a estar listos
    this.match.players.forEach((p) => {
      if (p.connected) p.setStarted(true)
    })

    const readyPlayers = this.match.getStartedPlayers(true)

    if (readyPlayers.length < GAME_RULES.MIN_PLAYERS) {
      const connectedCount = this.match.getConnectedPlayers().length

      this.log
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

      this.communicator.msgBuilder('lobbyError', 'public', null, {
        displayMsg: `Waiting for at least ${GAME_RULES.MIN_PLAYERS} players to be connected to start...`,
        readyPlayers: readyPlayers.length,
        connectedPlayers: connectedCount,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())
      return
    }

    this.log
      .Template({ name: 'brakets', title: 'LOBBY:GAME_STARTING', date: true })
      .R({
        torneoId: this.match.torneoId,
        handId: this.match.currentHandId,
        readyPlayers: readyPlayers.map((p) => p.name),
        dealerCards: this.match.cardsDealer,
      })

    this.noMorePlayers()
    this.stepChecker.grantStep('signUp')
    this.emitter.emit('START_GAME', thisSocket)
  }

  signUp(data, thisSocket) {
    this.match.lastActivity = Date.now()
    const {
      id: thisSocketId,
      name: thisSocketName,
      secretCode: thisSecretCode,
    } = thisSocket

    const finalRequestedName = data.name || thisSocketName

    // ✅ VALIDAR INTENTO DE RECONEXIÓN CON NOMBRE EXISTENTE PERO PIN INCORRECTO
    // Si el nombre ya está en el juego, pero el PIN no coincide, es un intento fallido de reconexión.
    const playerWithSameName = this.match.players.find(
      (p) => p.name === finalRequestedName,
    )

    if (
      playerWithSameName &&
      playerWithSameName.secretCode !== thisSecretCode
    ) {
      // Si el juego ya empezó, ignoramos silenciosamente (Requerido por test T0006)
      if (!this.match.acceptingPlayers) {
        this.log.R({
          msg: `[LOBBY] SILENT IGNORE: ${finalRequestedName} tried to reconnect with wrong PIN during game`,
          torneo: this.match.torneoId,
        })
        return
      }
      // Si estamos en el lobby, permitiremos que el flujo continúe para que se le asigne un nombre nuevo (ej: Alice-1)
    }

    // Buscar jugador existente por secretCode
    const existingPlayerIndex = this.match.players.findIndex(
      (s) => s.secretCode === thisSecretCode,
    )

    // ✅ VALIDAR COLISIÓN DE CÓDIGO SECRETO (PIN)
    let player
    if (existingPlayerIndex !== -1) {
      const existingPlayer = this.match.players[existingPlayerIndex]

      // Si el código existe pero el nombre NO coincide, es una colisión de PIN
      // (Otro jugador ya está usando este número secreto)
      if (existingPlayer.name !== finalRequestedName) {
        this.log.R({
          msg: `[LOBBY] PIN COLLISION: ${finalRequestedName} tried to use PIN ${thisSecretCode} already owned by ${existingPlayer.name}`,
          torneo: this.match.torneoId,
        })

        this.communicator.msgBuilder('signUp', 'private', null, {
          displayMsg:
            'This PIN is already in use by another player. Please go back and choose a different 4-digit code.',
          errorType: 'PIN_COLLISION',
        })
        this.dealer.talkToSocketById(thisSocket.id, this.communicator.getMsg())
        return
      }

      // ✅ LÓGICA DE RE-CONEXIÓN (Mismo código, mismo nombre)
      player = this.match.players[existingPlayerIndex]
      const oldId = player.id

      if (oldId === thisSocketId && player.connected) return

      player.id = thisSocketId
      player.setConnected(true)

      if (this.match.activePlayerId === oldId) {
        this.match.activePlayerId = thisSocketId
      }
      this.dealer.updatePlayerId(oldId, thisSocketId)

      // Si el host se reconecta, restaurar su ID
      if (this.match.hostId === oldId) {
        this.match.hostId = thisSocketId
      }

      const timeout = this.match.pauseTimeouts.get(player.name)
      if (timeout) {
        clearTimeout(timeout)
        this.match.pauseTimeouts.delete(player.name)
      }

      this.log
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
      if (!stillPaused && this.stepChecker.checkStep('pause')) {
        this.stepChecker.revokeStep('pause')
        this.emitter.emit('CONTINUE', thisSocket)
      }

      // SALIR AQUÍ: No queremos que la reconexión ejecute lógica de "nuevo jugador"
      this.communicator.msgBuilder('signUp', 'private', player, {
        method: 'signUp',
        id: thisSocketId,
        hostId: this.match.hostId,
        gameId: this.match.gameId,
      })

      Socket.sendToPlayer(
        this.match.torneoId,
        player.secretCode,
        this.communicator.getMsg(),
      )

      // ✅ NOTIFICAR A TODOS: Importante para que el lobby vea que el jugador está "Online" de nuevo
      this.communicator.msgBuilder('signUp', 'public', player, {
        msg: `${player.name} reconnected.`,
        hostId: this.match.hostId,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())

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
      if (this.match.players.length >= GAME_RULES.MAX_PLAYERS) {
        this.communicator.msgBuilder('signUp', 'private', null, {
          displayMsg: `Table is full (max ${GAME_RULES.MAX_PLAYERS} players).`,
        })
        this.dealer.talkToSocketById(thisSocket.id, this.communicator.getMsg())
        return
      }

      if (!this.match.acceptingPlayers) {
        this.communicator.msgBuilder('signUp', 'private', null, {
          displayMsg: 'Game in progress. Please wait for next round.',
        })
        this.dealer.talkToSocketById(thisSocket.id, this.communicator.getMsg())
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
        data.totalChips || this.match.initialStack,
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

      if (this.match.players.length >= GAME_RULES.MAX_PLAYERS) {
        this.noMorePlayers()
      }

      this.log
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

    this.communicator.msgBuilder('signUp', 'public', player, {
      msg: `Welcome ${player.name}!`,
      hostId: this.match.hostId,
    })
    Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())

    this.communicator.msgBuilder('signUp', 'private', player, {
      method: 'signUp',
      id: thisSocketId,
      hostId: this.match.hostId,
    })

    const msg = this.communicator.getMsg()
    msg.torneoId = this.match.torneoId // <--- Forzarlo aquí para asegurar visibilidad

    Socket.sendToPlayer(this.match.torneoId, player.secretCode, msg)

    if (existingPlayerIndex !== -1) {
      this.match.comms.sendOdds(player)
    }

    const connectedPlayers = this.match.getConnectedPlayers()
    if (
      connectedPlayers.length >= GAME_RULES.MIN_PLAYERS &&
      !this.stepChecker.checkStep('blindsBetting')
    ) {
      this.stepChecker.grantStep('signUp')

      // AUTO-START for public matches
      if (this.match.isPublic && !this.stepChecker.checkStep('startGame')) {
        setTimeout(() => {
          if (!this.stepChecker.checkStep('startGame')) {
            this.match.startGame()
          }
        }, 3000)
      }
    }
  }

  noMorePlayers() {
    if (!this.match.acceptingPlayers) {
      return
    }
    this.match.acceptingPlayers = false

    this.log
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

    this.communicator.msgBuilder('noMorePlayers', 'public', null, {
      displayMsg: 'Registration closed. Game in progress.',
    })

    Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())
  }

  pause(thisSocket) {
    const time = TIMEOUTS.pause
    const socketId = typeof thisSocket === 'string' ? thisSocket : thisSocket.id
    const foundPlayer = this.match.players.find((p) => p.id === socketId)
    if (foundPlayer) {
      foundPlayer.setConnected(false)
      this.match.actions.clearAutofold()
      this.stepChecker.grantStep('pause')
      this.log
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

      this.communicator.msgBuilder('pause', 'public', foundPlayer, {
        displayMsg: `${foundPlayer.name} disconnected. Waiting ${time / 1000} seconds for reconnection...`,
        timeout: time / 1000,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())

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
      this.communicator.msgBuilder('playerLeave', 'public', playerLeaving, {
        displayMsg: `${playerLeaving.name} has left the game.`,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())
      this.log
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
            this.communicator.msgBuilder('newHost', 'public', null, {
              displayMsg: `${nextHost.name} is the new host.`,
              hostId: this.match.hostId,
            })
            Socket.broadcastToTorneo(
              this.match.torneoId,
              this.communicator.getMsg(),
            )
          }
        }
      } else {
        this.match.players.splice(index, 1)
      }
    }
    const stillPaused = this.match.players.some((p) => !p.connected)
    if (!stillPaused) {
      this.stepChecker.revokeStep('pause')
    }
    this.emitter.emit('CONTINUE', thisSocket)
  }
}

module.exports = MatchLobby
