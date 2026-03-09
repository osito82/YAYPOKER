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
        .Template({
          name: 'brakets',
          title: 'MATCH - CHECK',
          date: true,
        })
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
        .R({ 
          activeCount: activePlayers.length,
          totalCount: this.match.players.length,
          players: this.match.players.map(p => ({
            name: p.name,
            connected: p.connected,
            chips: p.chips,
            isStarted: p.isStarted,
            folded: p.folded
          }))
        })
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

  winner = (winnerData, isFold = false) => {
    if (this.match.stepChecker.checkStep('winner')) return

    this.match.stepChecker.grantStep('blindsBetting')
    this.match.stepChecker.grantStep('dealtPrivateCards')
    this.match.stepChecker.grantStep('firstBetting')
    this.match.stepChecker.grantStep('flop_Dealer_Hand')
    this.match.stepChecker.grantStep('flop_Check_Prize_Step')
    this.match.stepChecker.grantStep('flop_Bet_Step')
    this.match.stepChecker.grantStep('turn_Dealer_Hand')
    this.match.stepChecker.grantStep('turn_Check_Prize_Step')
    this.match.stepChecker.grantStep('turn_Bet_Step')
    this.match.stepChecker.grantStep('river_Dealer_Hand')
    this.match.stepChecker.grantStep('river_Check_Prize_Step')
    this.match.stepChecker.grantStep('river_Bet_Step')
    this.match.stepChecker.grantStep('finalHands')
    this.match.stepChecker.grantStep('showDown')
    this.match.stepChecker.grantStep('winner')

    this.match.activePlayerId = null
    this.clearAutofold()

    this.match.dealer.setFinalHands()

    const winnerPlayers = Array.isArray(winnerData) ? winnerData : [winnerData]

    const pot = this.match.dealer.getPot()
    const splitPot = Math.floor(pot / winnerPlayers.length)
    const finalHands = this.match.dealer.getFinalHands()

    // repartir dinero
    winnerPlayers.forEach((wp) => {
      const player = this.match.players.find((p) => p.id === (wp.playerId || wp.id))

      if (player) {
        player.chips += splitPot

        this.match.log
          .Template({
            name: 'brakets',
            title: 'MATCH - HAND WINNER',
            date: true,
          })
          .R({
            winner: player.name,
            amount: splitPot,
            isFold,
          })
      }
    })

    const winnersInfo = winnerPlayers.map((wp) => {
      const player = this.match.players.find((p) => p.id === (wp.playerId || wp.id))
      const winningHand = finalHands.find((h) => h.playerId === player?.id)

      return {
        name: player?.name || 'Unknown',
        playerId: player?.id,
        amount: splitPot,
        handName: isFold
          ? 'Fold Victory'
          : winningHand?.pokerHand || 'High Card',
        winningCards: isFold ? [] : winningHand?.show || [],
      }
    })

    // verificar si ya hay ganador del torneo
    const playersWithChips = this.match.players.filter(
      (p) => p.chips > 0 && p.connected,
    )

    const isTournamentWinner = playersWithChips.length === 1

    if (isTournamentWinner) {
      this.winnerTournament(winnersInfo)
    } else {
      this.winnerHand(winnersInfo, isFold, pot, finalHands)
    }

    this.match.waitingForNextRound = true
  }

  winnerHand(winnersInfo, isFold, pot, finalHands) {
    const displayMsg =
      winnersInfo.length > 1
        ? `Tie! ${winnersInfo.map((w) => w.name).join(' and ')} split $${pot}!`
        : `${winnersInfo[0].name} wins $${pot}${isFold ? ' (Fold)' : ''}!`

    this.match.log
      .Template({
        name: 'brakets',
        title: 'MATCH - HAND RESULT',
        date: true,
      })
      .R({
        winners: winnersInfo.map((w) => w.name),
        pot,
        isFold,
      })

    this.match.communicator.msgBuilder('winner', 'public', null, {
      method: 'winner',
      displayMsg,
      winners: winnersInfo,
      allHands: finalHands,
      isFold,
      isTournamentWinner: false,
    })

    Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())
  }

  winnerTournament(winnersInfo) {
    const winner = winnersInfo[0]

    this.match.log
      .Template({
        name: 'brakets',
        title: 'MATCH - TOURNAMENT WINNER',
        date: true,
      })
      .R({
        winner: winner.name,
        playerId: winner.playerId,
        chipsWon: winner.amount,
      })

    this.match.communicator.msgBuilder('winnerTournament', 'public', null, {
      method: 'winnerTournament',
      displayMsg: `🏆 ${winner.name} wins the tournament!`,
      winner,
      isTournamentWinner: true,
    })

    Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())
  }

  bettingCore = (thisSocket, bettingFor) => {
    if (this.match.stepChecker.checkStep('winner')) return

    const allPlayers = this.match.players
    const activePlayers = allPlayers.filter(
      (p) => p.connected && !p.folded && p.isStarted,
    )

    if (activePlayers.length === 1) {
      this.winner(activePlayers[0], true)
      return
    }

    const maxBet = this.match.dealer.getCurrentHighestBet()
    const actedPlayers = this.match.dealer.getPlayersActed()
    const canActPlayers = activePlayers.filter((p) => !p.isAllIn)

    const steps = {
      firstBetting: 'firstBetting',
      flopBetting: 'flop_Bet_Step',
      turnBetting: 'turn_Bet_Step',
      riverBetting: 'river_Bet_Step',
    }

    if (
      !this.match.isRunout &&
      canActPlayers.length <= 1 &&
      activePlayers.length > 1
    ) {
      const p = canActPlayers[0]
      if (!p || (p.getCurrentBet() >= maxBet && actedPlayers.includes(p.id))) {
        this.match.isRunout = true
        this.match.log
          .Template({ name: 'brakets', title: 'MATCH - RUNOUT', date: true })
          .R({ gameId: this.match.gameId })

        this.match.communicator.msgBuilder('runout', 'public', null, {
          displayMsg: 'All-in runout! Dealing remaining cards...',
        })
        Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())
      }
    }

    if (this.match.isRunout) {
      this.match.stepChecker.grantStep(steps[bettingFor])
      return this.match.continue(thisSocket)
    }

    let sorted = []
    if (bettingFor === 'firstBetting') {
      if (allPlayers.length === 2) {
        sorted = [...allPlayers]
      } else {
        sorted = [...allPlayers.slice(2), ...allPlayers.slice(0, 2)]
      }
    } else {
      sorted = [...allPlayers.slice(1), ...allPlayers.slice(0, 1)]
    }

    const playersToAct = sorted.filter(
      (p) =>
        p.connected &&
        !p.folded &&
        !p.isAllIn &&
        p.isStarted &&
        (p.getCurrentBet() < maxBet || !actedPlayers.includes(p.id)),
    )

    if (playersToAct.length === 0) {
      this.match.log
        .Template({
          name: 'brakets',
          title: `MATCH - Betting Round ${bettingFor} Finished`,
          date: true,
        })
        .R({ pot: this.match.dealer.getPot() })
      this.match.activePlayerId = null
      this.match.dealer.clearActedPlayers()
      this.match.dealer.setCurrentHighestBet(0)
      this.match.dealer.setLastRaiser(null)

      this.match.stepChecker.grantStep(steps[bettingFor])
      this.match.continue(thisSocket, this.match.constructor.timeouts.collectChips) // ✅ Delay for chip movement
    } else {
      const p = playersToAct[0]
      if (this.match.activePlayerId === p.id) return

      this.match.activePlayerId = p.id
      if (p.lastAction !== 'Out') p.setLastAction('')

      let opts = []
      if (maxBet === 0) {
        // Nadie ha apostado aún en esta calle
        opts = ['check', 'bet', 'fold']
      } else {
        if (p.getCurrentBet() < maxBet) {
          // Alguien apostó más que yo
          opts = ['fold', 'call', 'raise']
        } else {
          // Ya igualé la apuesta máxima (ej. BB pre-flop o después de un Call mutuo)
          opts = ['check', 'raise', 'fold']
        }
      }

      this.match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Waiting Player Act',
          date: true,
        })
        .R({
          player: p.name,
          options: opts,
          maxBet,
          playerBet: p.getCurrentBet(),
          playerChips: p.chips,
          actedPlayers: actedPlayers.map(
            (id) => this.match.players.find((pl) => pl.id === id)?.name,
          ),
        })

      this.match.communicator.msgBuilder(`bettingCore-${bettingFor}`, 'private', p, {
        messageForId: p.id,
        action: opts,
        displayMsg: 'Your turn',
      })
      Socket.sendToPlayer(
        this.match.torneoId,
        p.secretCode,
        this.match.communicator.getMsg(),
      )
      this.match.communicator.msgBuilder(`bettingCore-${bettingFor}`, 'public', p, {
        messageForId: p.id,
        action: opts,
        displayMsg: `Waiting for ${p.name}`,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())
      this.startAutofold()
    }
  }

  dealerHand = (thisSocket, whatHand) => {
    this.match.log
      .Template({
        name: 'brakets',
        title: `MATCH - Dealer Hand: ${whatHand.toUpperCase()}`,
        date: true,
      })
      .R({ gameId: this.match.gameId })
    this.match.dealer.dealCardsDealer(whatHand === 'flop' ? 3 : 1)
    const steps = {
      flop: 'flop_Dealer_Hand',
      turn: 'turn_Dealer_Hand',
      river: 'river_Dealer_Hand',
    }
    this.match.stepChecker.grantStep(steps[whatHand])
    this.match.communicator.msgBuilder(`dealerHand-${whatHand}`, 'public', null, {
      displayMsg: `Dealer deals the ${whatHand}`,
    })
    Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())
    this.match.comms.sendOdds()
    this.match.continue(thisSocket, this.match.constructor.timeouts.standard) // ✅ Standard transition for dealing
  }

  checkPrizes(thisSocket) {
    const cards = this.match.dealer.getDealerCards()
    this.match.log
      .Template({
        name: 'brakets',
        title: 'MATCH - Checking Prizes',
        date: true,
      })
      .R({ cardsCount: cards.length })
    if (cards.length >= 3) {
      this.match.players.forEach((p) => {
        if (p && !p.folded) p.setCurrentPrize(p.checkPrize(cards))
      })
      const steps = {
        3: 'flop_Check_Prize_Step',
        4: 'turn_Check_Prize_Step',
        5: 'river_Check_Prize_Step',
      }
      this.match.stepChecker.grantStep(steps[cards.length])
    }
    this.match.continue(thisSocket, this.match.constructor.timeouts.fast) // ✅ Fast transition
  }

  dealtPrivateCards(thisSocket) {
    try {
      this.match.dealer.dealCardsEachPlayer(2)
      this.match.stepChecker.grantStep('dealtPrivateCards')
      this.match.dealer.clearActedPlayers()

      this.match.communicator.msgBuilder('dealtPrivateCards', 'public', null, {
        displayMsg: 'Cards dealt!',
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.match.communicator.getMsg())

      this.match.log
        .Template({
          name: 'brakets',
          title: 'MATCH - Private Cards Dealt',
          date: true,
        })
        .R(this.match.communicator.getFullInfo())

      for (const player of this.match.players) {
        this.match.communicator.msgBuilder('dealtPrivateCards', 'private', player, {})
        Socket.sendToPlayer(
          this.match.torneoId,
          player.secretCode,
          this.match.communicator.getMsg(),
        )
      }
      this.match.comms.sendOdds()
      this.match.continue(thisSocket, this.match.constructor.timeouts.standard) // ✅ Standard transition after dealing
    } catch (error) {
      console.error('Error in dealtPrivateCards:', error)
    }
  }
}

module.exports = MatchActions
