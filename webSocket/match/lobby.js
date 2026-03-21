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

    // RESTAURADO: Lógica original de re-conexión por secretCode
    const existingPlayerIndex = this.match.players.findIndex(
      (s) => s.secretCode === thisSecretCode,
    )

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
      // ✅ RE-CONEXIÓN (Original de main)
      player = this.match.players[existingPlayerIndex]
      const oldId = player.id

      if (oldId === thisSocketId && player.connected) return

      player.id = thisSocketId
      player.setConnected(true)

      if (this.match.activePlayerId === oldId) {
        this.match.activePlayerId = thisSocketId
      }
      this.dealer.updatePlayerId(oldId, thisSocketId)

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
          name: player.name,
          id: player.id,
        })

      const stillPaused = this.match.players.some((p) => !p.connected)
      if (!stillPaused && this.stepChecker.checkStep('pause')) {
        this.stepChecker.revokeStep('pause')
        this.emitter.emit('CONTINUE', thisSocket)
      }

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

      this.communicator.msgBuilder('signUp', 'public', player, {
        msg: `${player.name} reconnected.`,
        hostId: this.match.hostId,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())

      if (this.match.activePlayerId === player.id) {
        setTimeout(() => {
          if (this.match.activePlayerId === player.id) {
            this.match.actions.sendCurrentPrompt(player)
          }
        }, 500)
      }

      return
    } else {
      // 🆕 NUEVO JUGADOR (Original de main)
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
        data.totalChips || 1000,
        [],
        thisSocketId,
        playerNumber,
      )
      player.setConnected(true)
      this.match.players.push(player)

      if (this.match.players.length === 1) {
        this.match.hostId = thisSocketId
      }

      this.log
        .Template({
          name: 'brakets',
          title: 'LOBBY:PLAYER_JOIN',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          name: player.name,
          chips: player.chips,
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

    Socket.sendToPlayer(
      this.match.torneoId,
      player.secretCode,
      this.communicator.getMsg(),
    )

    const connectedPlayers = this.match.getConnectedPlayers()
    if (
      connectedPlayers.length >= GAME_RULES.MIN_PLAYERS &&
      !this.stepChecker.checkStep('blindsBetting')
    ) {
      this.stepChecker.grantStep('signUp')
    }
  }

  noMorePlayers() {
    if (!this.match.acceptingPlayers) return
    this.match.acceptingPlayers = false
    this.communicator.msgBuilder('noMorePlayers', 'public', null, {
      displayMsg: 'Registration closed.',
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
      
      this.communicator.msgBuilder('pause', 'public', foundPlayer, {
        displayMsg: `${foundPlayer.name} disconnected.`,
        timeout: time / 1000,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())

      const timeout = setTimeout(() => {
        this.playerLeave(thisSocket)
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
      
      if (this.match.activePlayerId === playerLeaving.id) {
        this.match.activePlayerId = null
        this.match.actions.clearAutofold()
      }

      if (this.match.hostId === playerLeaving.id) {
        this.match.hostId = null
        this.match.players.splice(index, 1)
        if (this.match.players.length > 0) {
          const nextHost = this.match.players.find((p) => p.connected)
          if (nextHost) {
            this.match.hostId = nextHost.id
            this.communicator.msgBuilder('newHost', 'public', null, {
              displayMsg: `${nextHost.name} is the new host.`,
              hostId: this.match.hostId,
            })
            Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())
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
