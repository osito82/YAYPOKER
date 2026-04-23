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

  signUp(data, thisSocket) {
    this.match.lastActivity = Date.now()
    const {
      id: thisSocketId,
      name: thisSocketName,
      secretCode: thisSecretCode,
    } = thisSocket

    const finalRequestedName = data.name || thisSocketName

    if (this.match.isPublic) {
      if (this.match.publicCleanupTimer) {
        clearTimeout(this.match.publicCleanupTimer)
        this.match.publicCleanupTimer = null
        this.log.R({
          msg: `[LOBBY] Public match ${this.match.torneoId} cleanup cancelled (player joined).`,
        })
      }
      if (this.match.publicEmptyTimer) {
        clearTimeout(this.match.publicEmptyTimer)
        this.match.publicEmptyTimer = null
        this.log.R({
          msg: `[LOBBY] Public match ${this.match.torneoId} empty-cleanup cancelled (player joined).`,
        })
      }
    }

    this.log
      .Template({ name: 'brakets', title: 'LOBBY:SIGNUP_ATTEMPT', date: true })
      .R({
        playerName: finalRequestedName,
        torneoId: this.match.torneoId,
        socketId: thisSocketId,
      })

    // ✅ VALIDAR INTENTO DE RECONEXIÓN CON NOMBRE EXISTENTE PERO PIN INCORRECTO
    const playerWithSameName = this.match.players.find(
      (p) => p.name === finalRequestedName,
    )

    if (
      playerWithSameName &&
      playerWithSameName.secretCode !== thisSecretCode
    ) {
      if (!this.match.acceptingPlayers) {
        // T0006: Ignorar silenciosamente durante el juego
        return
      }
    }

    const existingPlayerIndex = this.match.players.findIndex(
      (s) => s.secretCode === thisSecretCode,
    )

    let player

    if (existingPlayerIndex !== -1) {
      player = this.match.players[existingPlayerIndex]

      if (player.name !== finalRequestedName) {
        this.communicator.msgBuilder('signUp', 'private', null, {
          displayMsg: 'This PIN is already in use by another player.',
          errorType: 'PIN_COLLISION',
        })
        this.dealer.talkToSocketById(thisSocketId, this.communicator.getMsg())
        return
      }

      const oldId = player.id
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

      const stillPaused = this.match.players.some((p) => !p.connected)
      if (!stillPaused && this.stepChecker.checkStep('pause')) {
        this.stepChecker.revokeStep('pause')
        this.emitter.emit('CONTINUE', thisSocket)
      }

      this.communicator.msgBuilder('signUp', 'private', player, {
        method: 'signUp',
        id: thisSocketId,
        hostId: this.match.hostId,
      })

      const msg = this.communicator.getMsg()
      msg.players = this.match.players.map((p) => p.toJson())
      msg.pot = this.dealer.getPot()
      msg.dealerCards = this.dealer.getDealerCards()

      Socket.sendToPlayer(this.match.torneoId, player.secretCode, msg)

      this.communicator.msgBuilder('signUp', 'public', player, {
        msg: `${player.name} reconnected.`,
        hostId: this.match.hostId,
      })
      const publicMsg = this.communicator.getMsg()
      publicMsg.players = this.match.players.map((p) => p.toJson())
      Socket.broadcastToTorneo(this.match.torneoId, publicMsg)

      this.match.comms.sendOdds(player)
      this.match.actions.sendCurrentPrompt(player)
      return
    } else {
      const maxPlayers = this.match.isPublic
        ? GAME_RULES.MAX_PLAYERS_PUBLIC
        : GAME_RULES.MAX_PLAYERS
      if (this.match.players.length >= maxPlayers) {
        this.communicator.msgBuilder('signUp', 'private', null, {
          displayMsg: `Table is full (max ${maxPlayers} players).`,
        })
        this.dealer.talkToSocketById(thisSocketId, this.communicator.getMsg())
        return
      }

      if (!this.match.acceptingPlayers && !this.match.isPublic) {
        this.communicator.msgBuilder('signUp', 'private', null, {
          displayMsg: 'Game in progress. Please wait for next round.',
        })
        this.dealer.talkToSocketById(thisSocketId, this.communicator.getMsg())
        return
      }

      let finalName = finalRequestedName
      let counter = 1
      while (this.match.players.some((p) => p.name === finalName)) {
        finalName = `${finalRequestedName}-${counter}`
        counter++
      }

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

      // Solo reseteamos si es pública Y no hay absolutamente nadie conectado (limpieza inicial)
      // O si la mesa se quedó "atascada" sin jugadores reales.
      if (
        this.match.isPublic &&
        this.match.getConnectedPlayers().length === 0
      ) {
        this.log
          .Template({ name: 'brakets', title: 'LOBBY:PUBLIC_INIT', date: true })
          .R({
            torneoId: this.match.torneoId,
            player: player.name,
            msg: 'Initializing empty public match',
          })
        this.stepChecker.revokeStep('startGame')
        this.match.acceptingPlayers = true
        this.match.players.length = 0 // ✅ MANTENER REFERENCIA
        this.match.playersFold.length = 0 // ✅ MANTENER REFERENCIA
      }

      // Si la mesa ya está en juego y es pública, este jugador espera a la siguiente mano
      if (this.match.isPublic && this.stepChecker.checkStep('startGame')) {
        player.setStarted(false)
      }

      this.match.players.push(player)

      if (this.match.players.length === 1) {
        this.match.hostId = thisSocketId
      }

      this.communicator.msgBuilder('signUp', 'public', player, {
        msg: `Welcome ${player.name}!`,
        hostId: this.match.hostId,
      })
      const publicMsg = this.communicator.getMsg()
      publicMsg.players = this.match.players.map((p) => p.toJson())
      Socket.broadcastToTorneo(this.match.torneoId, publicMsg)

      this.communicator.msgBuilder('signUp', 'private', player, {
        method: 'signUp',
        id: thisSocketId,
        hostId: this.match.hostId,
      })
      const msg = this.communicator.getMsg()
      msg.players = this.match.players.map((p) => p.toJson())
      msg.pot = this.dealer.getPot()
      msg.dealerCards = this.dealer.getDealerCards()

      Socket.sendToPlayer(this.match.torneoId, player.secretCode, msg)
    }

    // 🔥 PUBLIC AUTO-START & BOT MANAGEMENT
    if (this.match.isPublic) {
      this.handlePublicBots()
      this.handlePublicAutoStart()
    }
  }

  handlePublicBots() {
    if (!this.match.isPublic) return

    const connectedHumans = this.match.players.filter(
      (p) => p.connected && !p.isBot,
    )
    const connectedBots = this.match.players.filter(
      (p) => p.connected && p.isBot,
    )

    // 1. Spawning logic: If only 1 human is left alone, bring a companion bot
    if (
      connectedHumans.length === 1 &&
      connectedBots.length === 0 &&
      !this.match.isSpawningBots
    ) {
      this.log.R({
        msg: `[BOT_API] Human left alone in public match. Spawning companion bot.`,
        torneo: this.match.torneoId,
      })
      this.match.spawnBots(1).then(() => {
        this.match.isSpawningBots = false
      })
    }

    // 2. Disconnect logic: If threshold reached, remove bots to make space for humans
    if (
      this.match.players.length >= GAME_RULES.BOT_DISCONNECT_THRESHOLD &&
      connectedBots.length > 0
    ) {
      const botToLeave = connectedBots[0]
      this.log.R({
        msg: `[BOT_API] Bot ${botToLeave.name} disconnecting (player count: ${this.match.players.length})`,
        torneo: this.match.torneoId,
      })

      const botSocketWrapper = Socket.getSocket(
        this.match.torneoId,
        botToLeave.id,
      )
      if (botSocketWrapper && botSocketWrapper.socket) {
        botSocketWrapper.socket.close()
      } else {
        this.playerLeave(botToLeave.id)
      }
    }
  }

  handlePublicAutoStart() {
    const connectedPlayers = this.match.getConnectedPlayers()
    if (
      connectedPlayers.length >= GAME_RULES.MIN_PLAYERS_PUBLIC &&
      !this.stepChecker.checkStep('blindsBetting')
    ) {
      if (!this.stepChecker.checkStep('startGame')) {
        if (this.match.publicAutoStartTimer)
          clearTimeout(this.match.publicAutoStartTimer)
        this.match.publicAutoStartTimer = setTimeout(() => {
          this.match.publicAutoStartTimer = null
          if (!this.stepChecker.checkStep('startGame')) {
            const hostSocket = Socket.getSocket(
              this.match.torneoId,
              this.match.hostId,
            )
            this.match.startGame(hostSocket || { id: this.match.hostId })
          }
        }, 3000)
      }
    }
  }

  noMorePlayers() {
    if (!this.match.acceptingPlayers) return
    this.match.acceptingPlayers = false
    this.log
      .Template({
        name: 'brakets',
        title: 'LOBBY:REGISTRATION_CLOSED',
        date: true,
      })
      .R({
        torneoId: this.match.torneoId,
        gameId: this.match.gameId,
      })
  }

  playerReady(thisSocket) {
    const foundPlayer = this.match.players.find((p) => p.id === thisSocket.id)
    if (foundPlayer) foundPlayer.setStarted(true)

    // AUTO-START solo para mesas públicas cuando todos están listos
    if (this.match.isPublic) {
      const allStarted = this.match.players.every((p) => p.isStarted)
      if (allStarted && this.match.players.length >= GAME_RULES.MIN_PLAYERS) {
        this.match.startGame(thisSocket)
      }
    }
  }

  pause(thisSocket) {
    const foundPlayer = this.match.players.find((p) => p.id === thisSocket.id)
    if (foundPlayer) {
      foundPlayer.setConnected(false)
      const time = TIMEOUTS.pause
      this.stepChecker.grantStep('pause')

      this.communicator.msgBuilder('playerPaused', 'public', foundPlayer, {
        displayMsg: `${foundPlayer.name} disconnected. Match paused for ${time / 1000}s`,
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

      // Si es una mesa pública y hay juego en curso, forzamos fold
      if (this.match.isPublic && this.stepChecker.checkStep('startGame')) {
        if (!playerLeaving.folded) {
          // Si era su turno, el fold disparará el CONTINUE
          // Si no, simplemente lo marcamos como fold para que el dealer lo ignore
          if (this.match.activePlayerId === playerLeaving.id) {
            this.match.actions.fold({ id: playerLeaving.id })
          } else {
            playerLeaving.setFolded(true)
            this.match.playersFold.push(playerLeaving.name)
            this.dealer.setPlayerActed(playerLeaving.id)
          }
        }
      }

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
            Socket.broadcastToTorneo(
              this.match.torneoId,
              this.communicator.getMsg(),
            )
          }
        }
      } else {
        this.match.players.splice(index, 1)
      }

      if (this.match.isPublic && this.match.publicAutoStartTimer) {
        const connectedPlayers = this.match.getConnectedPlayers()
        if (connectedPlayers.length < GAME_RULES.MIN_PLAYERS_PUBLIC) {
          clearTimeout(this.match.publicAutoStartTimer)
          this.match.publicAutoStartTimer = null
        }
      }

      // Si la mesa es pública y no quedan jugadores, la eliminamos del Torneo para que se limpie de memoria
      // y permita crear una nueva instancia fresca si alguien vuelve a entrar.
      if (this.match.isPublic) {
        const Torneo = require('../torneo')
        const connectedPlayers = this.match.getConnectedPlayers()

        // GESTIÓN DE BOTS TRAS SALIDA
        this.handlePublicBots()

        if (connectedPlayers.length === 0) {
          // Si la mesa quedó vacía, damos un margen antes de borrarla
          if (this.match.publicEmptyTimer)
            clearTimeout(this.match.publicEmptyTimer)

          this.match.publicEmptyTimer = setTimeout(() => {
            const currentConnected = this.match.getConnectedPlayers()
            if (currentConnected.length === 0) {
              Torneo.getTorneos().delete(this.match.torneoId)
              this.log
                .Template({
                  name: 'brakets',
                  title: 'LOBBY:PUBLIC_DELETED',
                  date: true,
                })
                .R({
                  torneoId: this.match.torneoId,
                  reason: 'Empty grace period expired',
                  duration: `${TIMEOUTS.publicEmptyGrace / 1000}s`,
                })
            }
            this.match.publicEmptyTimer = null
          }, TIMEOUTS.publicEmptyGrace)

          this.log
            .Template({
              name: 'brakets',
              title: 'LOBBY:PUBLIC_CLEANUP_START',
              date: true,
            })
            .R({
              torneoId: this.match.torneoId,
              msg: 'Public match is empty. Starting cleanup timer.',
              duration: `${TIMEOUTS.publicEmptyGrace / 1000}s`,
            })
        } else if (
          connectedPlayers.length === 1 &&
          this.stepChecker.checkStep('startGame')
        ) {
          // Si solo queda uno Y la partida ya había empezado, damos un margen de gracia
          if (this.match.publicCleanupTimer)
            clearTimeout(this.match.publicCleanupTimer)

          this.match.publicCleanupTimer = setTimeout(() => {
            const currentConnected = this.match.getConnectedPlayers()
            if (currentConnected.length === 1) {
              const lastPlayer = currentConnected[0]
              this.communicator.msgBuilder(
                'forceLobby',
                'private',
                lastPlayer,
                {
                  displayMsg:
                    'Match closed: Not enough players. Returning to lobby...',
                  reason: 'SINGLE_PLAYER_TIMEOUT',
                },
              )
              Socket.sendToPlayer(
                this.match.torneoId,
                lastPlayer.secretCode,
                this.communicator.getMsg(),
              )

              Torneo.getTorneos().delete(this.match.torneoId)
              this.log
                .Template({
                  name: 'brakets',
                  title: 'LOBBY:PUBLIC_CLOSED',
                  date: true,
                })
                .R({
                  torneoId: this.match.torneoId,
                  lastPlayer: lastPlayer.name,
                  reason: 'Single player timeout',
                  duration: `${TIMEOUTS.publicSingleGrace / 1000}s`,
                })
            }
            this.match.publicCleanupTimer = null
          }, TIMEOUTS.publicSingleGrace)
        }
      }
    }
    const stillPaused = this.match.players.some((p) => !p.connected)
    if (!stillPaused) this.stepChecker.revokeStep('pause')
    this.emitter.emit('CONTINUE', thisSocket)
  }
}

module.exports = MatchLobby
