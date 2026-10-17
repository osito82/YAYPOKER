const { randomUUID } = require('node:crypto')
const Socket = require('../sockets')
const Player = require('../player')
const { GAME_RULES, TIMEOUTS, CONNECTION_CONFIG } = require('../constants')

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
        this.log
          .Template({ name: 'brakets', title: 'LOBBY:CLEANUP_CANCELLED', date: true })
          .R({
            msg: `Public match ${this.match.torneoId} cleanup cancelled (player joined).`,
          })
      }
      if (this.match.publicEmptyTimer) {
        clearTimeout(this.match.publicEmptyTimer)
        this.match.publicEmptyTimer = null
        this.log
          .Template({ name: 'brakets', title: 'LOBBY:EMPTY_CLEANUP_CANCELLED', date: true })
          .R({
            msg: `Public match ${this.match.torneoId} empty-cleanup cancelled (player joined).`,
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

    const seat = this.findSeat(finalRequestedName, thisSocket)
    if (seat.error) {
      this.communicator.msgBuilder('signUp', 'private', null, {
        displayMsg: seat.displayMsg,
        errorType: seat.error,
      })
      this.dealer.talkToSocketById(thisSocketId, this.communicator.getMsg())
      return
    }

    let player

    if (seat.player) {
      player = seat.player
      // A PIN recovery hands out a new token: the old device loses the seat
      if (seat.rotateToken) player.sessionToken = randomUUID()
      this.replaceOldSocket(player.id, thisSocketId)

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

      if (this.match.publicEmptyTimer && !player.isBot) {
        clearTimeout(this.match.publicEmptyTimer)
        this.match.publicEmptyTimer = null
      }

      this.communicator.msgBuilder('signUp', 'private', player, {
        method: 'signUp',
        id: thisSocketId,
        hostId: this.match.hostId,
      })

      const msg = this.communicator.getMsg()
      // Only the owner ever receives the session token (never logged)
      msg.sessionToken = player.sessionToken
      msg.players = this.match.players.map((p) => p.toJson())
      msg.pot = this.dealer.getPot()
      msg.dealerCards = this.dealer.getDealerCards()
      msg.bigBlind = this.match.bigBlind
      msg.smallBlind = this.match.smallBlind

      Socket.sendToPlayer(this.match.torneoId, player, msg)

      this.communicator.msgBuilder('signUp', 'public', player, {
        msg: `${player.name} reconnected.`,
        hostId: this.match.hostId,
      })
      const publicMsg = this.communicator.getMsg()
      publicMsg.players = this.match.players.map((p) => p.toJson())
      Socket.broadcastToTorneo(this.match.torneoId, publicMsg)

      this.match.comms.sendOdds(player)
      this.match.actions.sendCurrentPrompt(player)

      // A human is back at a table that stopped for lack of humans
      if (this.match.idleNoHumans && !player.isBot) {
        this.match.idleNoHumans = false
        this.match.waitingForNextRound = true
        this.match.nextRound()
      }
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
        this.startingStack(data),
        [],
        thisSocketId,
        playerNumber,
      )
      player.setConnected(true)
      player.sessionToken = randomUUID()

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
        this.match.players.length = 0
        this.match.playersFold.length = 0
      }

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
      // Only the owner ever receives the session token (never logged)
      msg.sessionToken = player.sessionToken
      msg.players = this.match.players.map((p) => p.toJson())
      msg.pot = this.dealer.getPot()
      msg.dealerCards = this.dealer.getDealerCards()
      msg.bigBlind = this.match.bigBlind
      msg.smallBlind = this.match.smallBlind

      Socket.sendToPlayer(this.match.torneoId, player, msg)
    }

    if (this.match.isPublic) {
      this.handlePublicBots()
      this.handlePublicAutoStart()
    }
  }

  // The server decides stacks. Integration tests may still seed a custom stack
  // per player to reproduce short-stack and all-in scenarios.
  startingStack(data) {
    if (process.env.NODE_ENV === 'test' && data.totalChips) return data.totalChips
    return this.match.initialStack
  }

  handlePublicBots() {
    if (!this.match.isPublic) return

    const connectedHumans = this.match.players.filter(
      (p) => p.connected && !p.isBot,
    )
    const connectedBots = this.match.players.filter(
      (p) => p.connected && p.isBot,
    )

    if (
      connectedHumans.length === 1 &&
      connectedBots.length === 0 &&
      !this.match.isSpawningBots
    ) {
      this.log
        .Template({ name: 'brakets', title: 'BOT_API:SPAWN_COMPANION', date: true })
        .R({
          msg: `Human left alone in public match. Spawning companion bot.`,
          tournament: this.match.torneoId,
        })
      this.match.spawnBots(1).then(() => {
        this.match.isSpawningBots = false
      })
    }

    if (
      this.match.players.length >= GAME_RULES.BOT_DISCONNECT_THRESHOLD &&
      connectedBots.length > 0
    ) {
      const botToLeave = connectedBots[0]
      this.log
        .Template({ name: 'brakets', title: 'BOT_API:DISCONNECT', date: true })
        .R({
          msg: `Bot ${botToLeave.name} disconnecting (player count: ${this.match.players.length})`,
          tournament: this.match.torneoId,
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
    if (foundPlayer) {
      if (this.match.isPublic) {
        if (this.stepChecker.checkStep('startGame')) {
          foundPlayer.setStarted(false)
        } else {
          foundPlayer.setStarted(true)
        }
      } else {
        if (!this.stepChecker.checkStep('startGame')) {
          foundPlayer.setStarted(false)
        }
      }
    }

    if (this.match.isPublic) {
      const allStarted = this.match.players.every((p) => p.isStarted)
      if (
        allStarted &&
        this.match.players.length >= GAME_RULES.MIN_PLAYERS &&
        !this.stepChecker.checkStep('startGame')
      ) {
        this.match.startGame(thisSocket)
      }
    }
  }

  // Socket closed. Before the game starts the player simply leaves; once it
  // runs the seat is kept and the table never pauses (GAM-001).
  // Which seat (if any) this connection may take (OPS-001):
  // 1. the session token of a seated player → that seat
  // 2. same name, different PIN, before the game starts → a new seat (Name-1)
  // 3. same name + right PIN, seat disconnected, not locked → PIN recovery
  // 4. anything else with a taken name → NAME_TAKEN, counted as a failed try
  findSeat(name, thisSocket) {
    const seated = this.match.players.filter((p) => !p.left)
    const token = thisSocket.sessionToken
    if (token) {
      const byToken = seated.find((p) => p.sessionToken === token)
      if (byToken) return { player: byToken }
    }

    const sameName = seated.find((p) => p.name === name)
    if (!sameName) return {}
    const pinMatches = sameName.secretCode === thisSocket.secretCode
    if (this.match.acceptingPlayers && !pinMatches) return {}

    if (this.isPinLocked(sameName)) {
      return {
        error: 'TOO_MANY_ATTEMPTS',
        displayMsg: 'Too many attempts for this seat. Try again in a few minutes.',
      }
    }
    if (pinMatches && !sameName.connected) {
      return { player: sameName, rotateToken: true }
    }

    this.recordPinFailure(sameName)
    return {
      error: 'NAME_TAKEN',
      displayMsg: `The name ${name} is already taken at this table.`,
    }
  }

  recentPinFailures(player) {
    const since = Date.now() - CONNECTION_CONFIG.PIN_LOCK_WINDOW_MS
    const attempts = (this.match.pinAttempts.get(player.name) || []).filter(
      (t) => t > since,
    )
    this.match.pinAttempts.set(player.name, attempts)
    return attempts
  }

  isPinLocked(player) {
    return (
      this.recentPinFailures(player).length >= CONNECTION_CONFIG.PIN_MAX_ATTEMPTS
    )
  }

  recordPinFailure(player) {
    const attempts = this.recentPinFailures(player)
    attempts.push(Date.now())
    this.log
      .Template({ name: 'brakets', title: 'LOBBY:SEAT_ATTEMPT_FAILED', date: true })
      .R({
        torneoId: this.match.torneoId,
        playerName: player.name,
        failures: attempts.length,
      })
  }

  // The seat moves to a new connection: drop and close the previous one
  replaceOldSocket(oldId, newId) {
    if (!oldId || oldId === newId) return
    const old = Socket.getSocket(this.match.torneoId, oldId)
    if (!old) return
    Socket.removeSocket(old, this.match.torneoId)
    if (old.socket && old.socket.readyState === 1) {
      old.socket.close(4000, 'Replaced by a new connection')
    }
  }

  // Leaving once the game runs (close, abandonment, bot socket closed): fold
  // now, keep the contribution in the pot, remove the seat when the hand ends
  // (Match.restartMatch drops players marked `left`). GAM-001 R-09.
  leaveRunningGame(player) {
    player.left = true
    player.setConnected(false)

    if (player.isStarted && !player.folded) {
      if (this.match.activePlayerId === player.id) {
        this.match.actions.fold({ id: player.id }, true)
      } else {
        player.setFolded(true)
        this.match.playersFold.push(player.name)
        this.dealer.setPlayerActed(player.id, false)
        this.match.comms.sendOdds()
        const stillIn = this.match.getActivePlayers()
        if (stillIn.length === 1 && !this.stepChecker.checkStep('winner')) {
          this.match.actions.winner(stillIn[0], true)
        }
      }
    }

    this.log
      .Template({ name: 'brakets', title: 'LOBBY:PLAYER_LEFT', date: true })
      .R({
        torneoId: this.match.torneoId,
        handId: this.match.currentHandId,
        playerName: player.name,
        chips: player.chips,
      })
    this.communicator.msgBuilder('playerLeave', 'public', player, {
      displayMsg: `${player.name} has left the game.`,
    })
    Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())

    if (this.match.hostId === player.id) this.assignNewHost()

    const seated = this.match.players.filter((p) => !p.left)
    if (seated.length === 0) {
      this.closeTable('All players left')
      return
    }

    // No human seated any more: the bots leave too
    if (!seated.some((p) => !p.isBot)) {
      for (const bot of seated) {
        const wrapper = Socket.getSocket(this.match.torneoId, bot.id)
        if (wrapper?.socket) wrapper.socket.close()
        else this.leaveRunningGame(bot)
      }
      return
    }

    if (this.match.isPublic && !this.match.hasConnectedHuman()) {
      this.schedulePublicClose(TIMEOUTS.publicEmptyGrace)
    }
  }

  pause(thisSocket) {
    const foundPlayer = this.match.players.find((p) => p.id === thisSocket.id)
    if (!foundPlayer || foundPlayer.left) return

    if (!this.stepChecker.checkStep('startGame')) {
      this.playerLeave(thisSocket)
      return
    }

    foundPlayer.setConnected(false)
    this.log
      .Template({ name: 'brakets', title: 'LOBBY:PLAYER_DISCONNECTED', date: true })
      .R({ torneoId: this.match.torneoId, playerName: foundPlayer.name })

    this.communicator.msgBuilder('playerDisconnected', 'public', foundPlayer, {
      playerId: foundPlayer.id,
      displayMsg: `${foundPlayer.name} disconnected.`,
    })
    Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())

    if (this.match.activePlayerId === foundPlayer.id) {
      this.match.actions.shortenTurnForDisconnect()
    }

    // Public table without humans: close it if nobody comes back in time
    if (this.match.isPublic && !this.match.hasConnectedHuman()) {
      this.schedulePublicClose(TIMEOUTS.publicSeatRelease)
    }
  }

  // Public tables: seats disconnected for too long are freed between hands
  releaseStaleSeats() {
    const now = Date.now()
    const stale = this.match.players.filter(
      (p) =>
        !p.connected &&
        !p.left &&
        p.disconnectedAt &&
        now - p.disconnectedAt >= TIMEOUTS.publicSeatRelease,
    )
    for (const p of stale) {
      this.log
        .Template({ name: 'brakets', title: 'LOBBY:SEAT_RELEASED', date: true })
        .R({ torneoId: this.match.torneoId, playerName: p.name })
      this.removeFromTable(p)
    }
  }

  schedulePublicClose(delay) {
    if (this.match.publicEmptyTimer) clearTimeout(this.match.publicEmptyTimer)
    this.match.publicEmptyTimer = setTimeout(() => {
      this.match.publicEmptyTimer = null
      if (this.match.hasConnectedHuman()) return
      this.closeTable('No humans left')
    }, delay)
  }

  // Closes every socket still attached (bots included) and deletes the table
  closeTable(reason) {
    const Torneo = require('../torneo')
    this.match.actions.clearAutofold()
    const sockets = Socket.getSocketsByTorneo(this.match.torneoId)
    if (sockets) {
      for (const wrapper of sockets.values()) {
        if (wrapper.socket && wrapper.socket.readyState === 1) {
          wrapper.socket.close(1000, 'Table closed')
        }
      }
    }
    Torneo.getTorneos().delete(this.match.torneoId)
    this.log
      .Template({ name: 'brakets', title: 'LOBBY:TABLE_CLOSED', date: true })
      .R({ torneoId: this.match.torneoId, reason })
  }

  // Takes a player out of the players list and passes the host if needed
  removeFromTable(player) {
    const index = this.match.players.indexOf(player)
    if (index === -1) return
    this.match.players.splice(index, 1)
    if (this.match.hostId === player.id) this.assignNewHost()
  }

  assignNewHost() {
    this.match.hostId = null
    const nextHost = this.match.players.find((p) => p.connected && !p.left)
    if (!nextHost) return
    this.match.hostId = nextHost.id
    this.communicator.msgBuilder('newHost', 'public', null, {
      displayMsg: `${nextHost.name} is the new host.`,
      hostId: this.match.hostId,
    })
    Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())
  }

  close(thisSocket) {
    this.playerLeave(thisSocket)
  }

  playerLeave(thisSocket) {
    const socketId = typeof thisSocket === 'string' ? thisSocket : thisSocket.id
    const running = this.match.players.find(
      (p) => p.id === socketId && !p.left,
    )
    if (running && this.stepChecker.checkStep('startGame')) {
      this.leaveRunningGame(running)
      return
    }
    const index = this.match.players.findIndex((p) => p.id === socketId)
    if (index !== -1) {
      const playerLeaving = this.match.players[index]

      if (this.match.isPublic && this.stepChecker.checkStep('startGame')) {
        if (!playerLeaving.folded) {
          if (this.match.activePlayerId === playerLeaving.id) {
            this.match.actions.fold({ id: playerLeaving.id }, true)
          } else {
            playerLeaving.setFolded(true)
            this.match.playersFold.push(playerLeaving.name)
            this.dealer.setPlayerActed(playerLeaving.id)
            this.match.comms.sendOdds()
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

      // Si no quedan humanos conectados (sin importar si es pública o privada),
      // desconectamos a todos los bots para que no jueguen solos indefinidamente.
      const connectedHumans = this.match.players.filter(
        (p) => p.connected && !p.isBot,
      )
      if (connectedHumans.length === 0) {
        const connectedBots = this.match.players.filter(
          (p) => p.connected && p.isBot,
        )
        // Iteramos sobre una copia para no alterar el array mientras eliminamos
        ;[...connectedBots].forEach((bot) => {
          const botSocketWrapper = Socket.getSocket(this.match.torneoId, bot.id)
          if (botSocketWrapper && botSocketWrapper.socket) {
            botSocketWrapper.socket.close()
          } else {
            const botIndex = this.match.players.findIndex(
              (p) => p.id === bot.id,
            )
            if (botIndex !== -1) this.match.players.splice(botIndex, 1)
          }
        })
      }

      if (this.match.isPublic && this.match.publicAutoStartTimer) {
        const connectedPlayers = this.match.getConnectedPlayers()
        if (connectedPlayers.length < GAME_RULES.MIN_PLAYERS_PUBLIC) {
          clearTimeout(this.match.publicAutoStartTimer)
          this.match.publicAutoStartTimer = null
        }
      }

      if (this.match.isPublic) {
        const Torneo = require('../torneo')
        const connectedPlayers = this.match.getConnectedPlayers()

        this.handlePublicBots()

        if (connectedPlayers.length === 0) {
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
              Socket.sendToPlayer(this.match.torneoId, lastPlayer,
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

    // SOLO emitimos CONTINUE si el juego está en marcha
    if (this.stepChecker.checkStep('startGame')) {
      this.emitter.emit('CONTINUE', thisSocket)
    }

    // Limpieza final si la mesa quedó completamente vacía
    if (this.match.players.length === 0) {
      const Torneo = require('../torneo')
      Torneo.getTorneos().delete(this.match.torneoId)
      this.log
        .Template({
          name: 'brakets',
          title: 'LOBBY:MATCH_DELETED',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          reason: 'All players left',
        })
    }
  }
}

module.exports = MatchLobby
