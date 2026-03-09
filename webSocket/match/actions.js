const Socket = require('../sockets')

class MatchActions {
  constructor(match) {
    this.match = match
  }

  autofold() {
    const foundPlayer = this.match.players.find((p) => p.id == this.match.activePlayerId)
    if (foundPlayer) {
      this.match.log
        .Template({ name: 'brakets', title: 'MATCH - AUTOFOLD', date: true })
        .R({ player: foundPlayer.name })
      this.fold({ id: foundPlayer.id })
    }
  }

  startAutofold() {
    this.clearAutofold()
    this.match.autofoldTimer = setTimeout(() => {
      this.autofold()
    }, this.match.autofoldDuration)
  }

  clearAutofold() {
    if (this.match.autofoldTimer) {
      clearTimeout(this.match.autofoldTimer)
      this.match.autofoldTimer = null
    }
  }

  fold(thisSocket) {
    if (!this.match.activePlayerId || this.match.activePlayerId !== thisSocket.id) return

    const foundPlayer = this.match.players.find((p) => p.id == thisSocket.id)
    if (foundPlayer && !foundPlayer.folded) {
      this.clearAutofold()
      if (this.match.acceptingPlayers) {
        this.match.lobby.noMorePlayers()
      }
      this.match.activePlayerId = null // ✅ CLEAR TURN IMMEDIATELY

      foundPlayer.setLastAction('Fold')
      foundPlayer.setFolded(true)
      this.match.playersFold.push(foundPlayer.name)
      this.match.dealer.setPlayerActed(foundPlayer.id)

      this.match.log
        .Template({ name: 'brakets', title: 'MATCH - FOLD', date: true })
        .R({ player: foundPlayer.name })

      this.match.communicator.msgBuilder('fold', 'public', foundPlayer, {
        displayMsg: `${foundPlayer.name} folded.`,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())
      this.match.comms.sendOdds()
      this.match.continue(thisSocket, this.match.constructor.timeouts.fast) // ✅ Fast transition
    }
  }

  performCheck(foundPlayer) {
    if (foundPlayer.getCurrentBet() === this.match.dealer.getCurrentHighestBet()) {
      this.clearAutofold()
      this.match.activePlayerId = null // ✅ CLEAR TURN IMMEDIATELY
      this.match.dealer.setPlayerActed(foundPlayer.id)

      foundPlayer.setLastAction('Check')
      this.match.log
        .Template({ name: 'brakets', title: 'MATCH - CHECK', date: true })
        .R({ player: foundPlayer.name })
      this.match.communicator.msgBuilder('setCheck', 'public', foundPlayer, {
        displayMsg: `${foundPlayer.name} checks`,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())
      return true
    } else {
      this.match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Invalid Check',
          date: true,
        })
        .R({
          player: foundPlayer.name,
          currentBet: foundPlayer.getCurrentBet(),
          maxBet: this.match.dealer.getCurrentHighestBet(),
        })
      return false
    }
  }

  setCheck = (thisSocket) => {
    if (!this.match.activePlayerId || this.match.activePlayerId !== thisSocket.id) {
      this.match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Action Rejected',
          date: true,
        })
        .R({
          player: thisSocket.name,
          reason: 'Not your turn',
          action: 'Check',
        })
      return
    }

    const foundPlayer = this.match.players.find((p) => p.id == thisSocket.id)
    if (foundPlayer) {
      const success = this.performCheck(foundPlayer)
      if (success) {
        this.match.continue(thisSocket, this.match.constructor.timeouts.fast) // ✅ Fast transition
      }
    }
  }

  setCall(thisSocket) {
    if (!this.match.activePlayerId || this.match.activePlayerId !== thisSocket.id) {
      this.match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Action Rejected',
          date: true,
        })
        .R({
          player: thisSocket.name,
          reason: 'Not your turn',
          action: 'Call',
          expected: this.match.activePlayerId,
          received: thisSocket.id,
        })
      return
    }

    const maxBet = this.match.dealer.getCurrentHighestBet()
    const foundPlayer = this.match.players.find((p) => p.id == thisSocket.id)
    if (!foundPlayer) return

    this.clearAutofold()
    if (this.match.acceptingPlayers) {
      this.match.lobby.noMorePlayers()
    }

    const currentBetBefore = foundPlayer.getCurrentBet()
    const diff = maxBet - currentBetBefore

    // Si no hay nada que igualar, se trata como un Check
    if (diff <= 0) {
      this.match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - CALL AS CHECK',
          date: true,
        })
        .R({ player: foundPlayer.name, diff })

      const checkSuccess = this.performCheck(foundPlayer)
      if (checkSuccess) {
        this.match.continue(thisSocket, this.match.constructor.timeouts.fast)
      }
      return
    }

    this.match.activePlayerId = null // ✅ CLEAR TURN IMMEDIATELY

    let amountAdded = 0
    let actionType = 'Call'

    if (foundPlayer.chips <= diff) {
      amountAdded = foundPlayer.chips
      foundPlayer.setTotalBet(currentBetBefore + amountAdded)
      foundPlayer.chips = 0
      foundPlayer.isAllIn = true
      actionType = 'All-In'
    } else {
      amountAdded = diff
      foundPlayer.setTotalBet(maxBet)
    }

    this.match.dealer.setPot(amountAdded)
    this.match.dealer.setPlayerActed(foundPlayer.id)
    foundPlayer.setLastAction(actionType)

    this.match.log
      .Template({
        name: 'brakets',
        title: `MATCH - ${actionType.toUpperCase()}`,
        date: true,
      })
      .R({
        player: foundPlayer.name,
        added: amountAdded,
        totalBet: foundPlayer.getCurrentBet(),
        remainingChips: foundPlayer.chips,
        newPot: this.match.dealer.getPot(),
      })

    this.match.communicator.msgBuilder('setCall', 'public', foundPlayer, {
      displayMsg: `${foundPlayer.name} ${actionType === 'All-In' ? 'goes all-in' : 'calls'}`,
      name: foundPlayer.name,
      bet: foundPlayer.getCurrentBet(),
    })

    Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())
    this.match.continue(thisSocket, this.match.constructor.timeouts.fast) // ✅ Fast transition
  }

  setBet(thisSocket, chipsToBet, type = 'setBet') {
    if (!this.match.activePlayerId || this.match.activePlayerId !== thisSocket.id) {
      this.match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Action Rejected',
          date: true,
        })
        .R({
          player: thisSocket.name,
          reason: 'Not your turn or no active player',
          expected: this.match.activePlayerId,
          received: thisSocket.id,
        })
      return
    }

    const foundPlayer = this.match.players.find((p) => p.id == thisSocket.id)
    if (!foundPlayer) return

    const amount = Number(chipsToBet)

    // Validar que si es un Raise, realmente aumente la apuesta
    if (type === 'setRise' && amount <= this.match.dealer.getCurrentHighestBet()) {
      this.match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Raise Rejected',
          date: true,
        })
        .R({
          player: foundPlayer.name,
          amount,
          currentMax: this.match.dealer.getCurrentHighestBet(),
          reason: 'Raise must be higher than current highest bet',
        })
      return
    }

    this.clearAutofold()
    if (this.match.acceptingPlayers) {
      this.match.lobby.noMorePlayers()
    }

    const currentBetBefore = foundPlayer.getCurrentBet()
    const success = foundPlayer.setTotalBet(amount)

    if (success) {
      this.match.activePlayerId = null // ✅ CLEAR TURN IMMEDIATELY
      const currentBetAfter = foundPlayer.getCurrentBet()
      const addedChips = currentBetAfter - currentBetBefore

      let actionType = type === 'setBet' ? 'Bet' : 'Raise'
      let broadcastAction = 'setBet'

      if (foundPlayer.isAllIn) {
        actionType = 'All-In'
        broadcastAction = 'setCall'
      }

      foundPlayer.setLastAction(actionType)
      this.match.dealer.setPot(addedChips)

      if (currentBetAfter > this.match.dealer.getCurrentHighestBet()) {
        this.match.dealer.setCurrentHighestBet(currentBetAfter)
        this.match.dealer.setLastRaiser(foundPlayer.id)
        this.match.dealer.clearActedPlayers()
      }

      this.match.dealer.setPlayerActed(foundPlayer.id)

      this.match.log
        .Template({
          name: 'brakets',
          title: `MATCH - ${actionType.toUpperCase()}`,
          date: true,
        })
        .R({
          player: foundPlayer.name,
          added: addedChips,
          totalBet: currentBetAfter,
          newPot: this.match.dealer.getPot(),
        })

      this.match.communicator.msgBuilder(broadcastAction, 'public', foundPlayer, {
        displayMsg: `${foundPlayer.name} ${actionType === 'All-In' ? 'goes all-in' : type === 'setBet' ? 'bets' : 'raises to'} ${currentBetAfter}`,
        name: foundPlayer.name,
        bet: currentBetAfter,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())

      // If we are in blinds phase, use shorter delay to avoid test timeouts/race conditions
      const delay = !this.match.stepChecker.checkStep('blindsBetting') ? this.match.constructor.timeouts.fast : this.match.constructor.timeouts.standard
      this.match.continue(thisSocket, delay)
    } else {
      this.match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Bet Failed',
          date: true,
        })
        .R({
          player: foundPlayer.name,
          amount,
          chips: foundPlayer.chips,
          reason: 'Insufficient chips or invalid amount',
        })
    }
  }

  setRise(thisSocket, chipsToBet) {
    this.setBet(thisSocket, chipsToBet, 'setRise')
  }

  askForBlindBets(thisSocket) {
    const activePlayers = this.match.players.filter(
      (p) =>
        p.connected &&
        (p.chips > 0 || p.getCurrentBet() > 0) &&
        p.isStarted &&
        !p.folded,
    )

    if (activePlayers.length < 2) {
      this.match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Not Enough Active Players',
          date: true,
        })
        .R({ activeCount: activePlayers.length })
      return
    }

    const p1 = activePlayers[0]
    const p2 = activePlayers[1]

    const p1Bet = p1.getCurrentBet()
    const p2Bet = p2.getCurrentBet()

    if (p1Bet > 0 && p2Bet > 0) {
      this.match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Blinds Completed',
          date: true,
        })
        .R({ pot: this.match.dealer.getPot() })
      this.match.activePlayerId = null
      this.match.stepChecker.grantStep('blindsBetting')
      this.match.continue(thisSocket, this.match.constructor.timeouts.fast) // ✅ Fast transition
    } else {
      let p = null
      if (p1Bet === 0) {
        p = p1
      } else if (p2Bet === 0) {
        p = p2
      }

      if (p) {
        if (this.match.activePlayerId === p.id) return

        const isSB = p === p1
        this.match.activePlayerId = p.id

        if (p.lastAction !== 'Out') p.setLastAction('')

        this.match.log
          .Template({
            name: 'brakets',
            title: 'MATCH - Asking Blinds',
            date: true,
          })
          .R({ player: p.name, type: isSB ? 'SB' : 'BB' })
        this.match.communicator.msgBuilder(`askForBlindBets`, 'public', p, {
          displayMsg: `Waiting for ${p.name} (${isSB ? 'SB' : 'BB'})`,
        })
        Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())
        this.match.communicator.msgBuilder(`askForBlindBets`, 'private', p, {
          id: p.id,
          displayMsg: `YOUR TURN: ${isSB ? 'Small' : 'Big'} Blind`,
        })
        Socket.sendToPlayer(
          this.match.torneoId,
          p.secretCode,
          this.match.communicator.getMsg(),
        )
        this.startAutofold()
      }
    }
  }
}

module.exports = MatchActions
