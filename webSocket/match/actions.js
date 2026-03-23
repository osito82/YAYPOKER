const Socket = require('../sockets')
const { WinnerCore } = require('../winnerCore')
const { GAME_RULES, TIMEOUTS } = require('../constants')
const WinnerCertificate = require('../winnerCertificate')

class MatchActions {
  constructor(context) {
    this.match = context.match
    this.emitter = context.emitter
    this.log = context.log
    this.communicator = context.communicator
    this.dealer = context.dealer
    this.stepChecker = context.stepChecker
  }

  autofold() {
    const foundPlayer = this.match.players.find(
      (p) => p.id == this.match.activePlayerId,
    )
    if (foundPlayer) {
      this.log
        .Template({ name: 'brakets', title: 'ACTION:AUTOFOLD', date: true })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          player: foundPlayer.name,
          playerCards: foundPlayer.cards,
          playerSecret: foundPlayer.secretCode,
          dealerCards: this.match.cardsDealer,
          reason: 'Timeout',
        })
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
    if (
      !this.match.activePlayerId ||
      this.match.activePlayerId !== thisSocket.id
    )
      return

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
      this.dealer.setPlayerActed(foundPlayer.id)

      this.log
        .Template({ name: 'brakets', title: 'ACTION:FOLD', date: true })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          player: foundPlayer.name,
          playerCards: foundPlayer.cards,
          playerSecret: foundPlayer.secretCode,
          dealerCards: this.match.cardsDealer,
          pot: this.dealer.getPot(),
        })

      this.communicator.msgBuilder('fold', 'public', foundPlayer, {
        displayMsg: `${foundPlayer.name} folded.`,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())
      this.match.comms.sendOdds()

      // Check if only one player remains after folding
      const activePlayers = this.match.getActivePlayers(true)

      if (activePlayers.length === 1) {
        return this.winner(activePlayers[0], true)
      }

      this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.fast) // ✅ Fast transition via events
    }
  }

  performCheck(foundPlayer) {
    if (foundPlayer.getCurrentBet() === this.dealer.getCurrentHighestBet()) {
      this.clearAutofold()
      this.match.activePlayerId = null // ✅ CLEAR TURN IMMEDIATELY
      this.dealer.setPlayerActed(foundPlayer.id)

      foundPlayer.setLastAction('Check')
      this.log
        .Template({
          name: 'brakets',
          title: 'ACTION:CHECK',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          player: foundPlayer.name,
          playerCards: foundPlayer.cards,
          playerSecret: foundPlayer.secretCode,
          dealerCards: this.match.cardsDealer,
          pot: this.dealer.getPot(),
        })
      this.communicator.msgBuilder('setCheck', 'public', foundPlayer, {
        displayMsg: `${foundPlayer.name} checks`,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())
      return true
    } else {
      this.log
        .Template({
          name: 'brakets',
          title: 'ERROR:INVALID_CHECK',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          player: foundPlayer.name,
          playerCards: foundPlayer.cards,
          playerSecret: foundPlayer.secretCode,
          dealerCards: this.match.cardsDealer,
          currentBet: foundPlayer.getCurrentBet(),
          maxBet: this.dealer.getCurrentHighestBet(),
        })

      this.communicator.msgBuilder('actionRejected', 'private', foundPlayer, {
        reason: 'check',
        displayMsg: 'Check invalid: there is an active bet.',
      })
      Socket.sendToPlayer(
        this.match.torneoId,
        foundPlayer.secretCode,
        this.communicator.getMsg(),
      )

      return false
    }
  }

  setCheck = (thisSocket) => {
    if (
      !this.match.activePlayerId ||
      this.match.activePlayerId !== thisSocket.id
    ) {
      this.log
        .Template({
          name: 'brakets',
          title: 'ERROR:ACTION_REJECTED',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
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
        this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.fast) // ✅ Fast transition via events
      }
    }
  }

  setCall(thisSocket) {
    if (
      !this.match.activePlayerId ||
      this.match.activePlayerId !== thisSocket.id
    ) {
      this.log
        .Template({
          name: 'brakets',
          title: 'ERROR:ACTION_REJECTED',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          player: thisSocket.name,
          reason: 'Not your turn',
          action: 'Call',
          expected: this.match.activePlayerId,
          received: thisSocket.id,
        })
      return
    }

    const maxBet = this.dealer.getCurrentHighestBet()
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
      const checkSuccess = this.performCheck(foundPlayer)
      if (checkSuccess) {
        this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.fast)
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

    this.dealer.setPot(amountAdded)
    this.dealer.setPlayerActed(foundPlayer.id)
    foundPlayer.setLastAction(actionType)

    this.log
      .Template({
        name: 'brakets',
        title: `ACTION:${actionType.toUpperCase()}`,
        date: true,
      })
      .R({
        torneoId: this.match.torneoId,
        handId: this.match.currentHandId,
        player: foundPlayer.name,
        playerCards: foundPlayer.cards,
        playerSecret: foundPlayer.secretCode,
        dealerCards: this.match.cardsDealer,
        added: amountAdded,
        totalBet: foundPlayer.getCurrentBet(),
        remainingChips: foundPlayer.chips,
        newPot: this.dealer.getPot(),
      })

    this.communicator.msgBuilder('setCall', 'public', foundPlayer, {
      displayMsg: `${foundPlayer.name} ${actionType === 'All-In' ? 'goes all-in' : 'calls'}`,
      name: foundPlayer.name,
      bet: foundPlayer.getCurrentBet(),
    })

    Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())
    this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.fast) // ✅ Fast transition via events
  }

  setBet(thisSocket, chipsToBet, type = 'setBet') {
    if (
      !this.match.activePlayerId ||
      this.match.activePlayerId !== thisSocket.id
    ) {
      this.log
        .Template({
          name: 'brakets',
          title: 'ERROR:ACTION_REJECTED',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
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
    const currentMaxBet = this.dealer.getCurrentHighestBet()
    const lastRaise = this.dealer.getLastRaiseAmount() || this.match.bigBlind // Default to Big Blind if no raise yet

    // REGLA DE MIN-RAISE: El aumento debe ser al menos igual al aumento anterior
    if (type === 'setRise') {
      const myRaiseAmount = amount - currentMaxBet
      if (myRaiseAmount < lastRaise && !foundPlayer.isAllIn) {
        this.log
          .Template({
            name: 'brakets',
            title: 'ERROR:RAISE_REJECTED',
            date: true,
          })
          .R({
            torneoId: this.match.torneoId,
            handId: this.match.currentHandId,
            player: foundPlayer.name,
            playerCards: foundPlayer.cards,
            playerSecret: foundPlayer.secretCode,
            dealerCards: this.match.cardsDealer,
            amount,
            currentMax: currentMaxBet,
            myRaise: myRaiseAmount,
            requiredMinRaise: lastRaise,
            reason: 'Raise must be at least the size of the previous raise',
          })

        this.communicator.msgBuilder('actionRejected', 'private', foundPlayer, {
          reason: 'minimum raise',
          displayMsg: `Raise invalid: minimum raise is ${currentMaxBet + lastRaise}.`,
        })
        Socket.sendToPlayer(
          this.match.torneoId,
          foundPlayer.secretCode,
          this.communicator.getMsg(),
        )
        return
      }
    }

    // Validar que al menos sea mayor que la apuesta actual si es raise
    if (type === 'setRise' && amount <= currentMaxBet) {
      this.log
        .Template({
          name: 'brakets',
          title: 'ERROR:RAISE_REJECTED',
          date: true,
          displayMsg: `Raise invalid: must be higher than ${currentMaxBet}.`,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          player: foundPlayer.name,
          playerCards: foundPlayer.cards,
          playerSecret: foundPlayer.secretCode,
          dealerCards: this.match.cardsDealer,
          amount,
          currentMax: currentMaxBet,
          reason: 'Raise must be higher than current highest bet',
        })

      this.communicator.msgBuilder('actionRejected', 'private', foundPlayer, {
        reason: 'minimum raise',
        displayMsg: `Raise invalid: must be higher than ${currentMaxBet}.`,
      })
      Socket.sendToPlayer(
        this.match.torneoId,
        foundPlayer.secretCode,
        this.communicator.getMsg(),
      )

      return
    }

    this.clearAutofold()
    if (this.match.acceptingPlayers) {
      this.match.lobby.noMorePlayers()
    }

    const currentBetBefore = foundPlayer.getCurrentBet()
    const previousMaxBet = currentMaxBet
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
      this.dealer.setPot(addedChips)

      if (currentBetAfter > previousMaxBet) {
        const raiseAmount = currentBetAfter - previousMaxBet
        this.dealer.setCurrentHighestBet(currentBetAfter)
        this.dealer.setLastRaiseAmount(raiseAmount)
        this.dealer.setLastRaiser(foundPlayer.id)
        this.dealer.clearActedPlayers()
      }

      this.dealer.setPlayerActed(foundPlayer.id)

      this.log
        .Template({
          name: 'brakets',
          title: `ACTION:${actionType.toUpperCase()}`,
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          player: foundPlayer.name,
          playerCards: foundPlayer.cards,
          playerSecret: foundPlayer.secretCode,
          dealerCards: this.match.cardsDealer,
          added: addedChips,
          totalBet: currentBetAfter,
          newPot: this.dealer.getPot(),
        })

      this.communicator.msgBuilder(broadcastAction, 'public', foundPlayer, {
        displayMsg: `${foundPlayer.name} ${actionType === 'All-In' ? 'goes all-in' : type === 'setBet' ? 'bets' : 'raises to'} ${currentBetAfter}`,
        name: foundPlayer.name,
        bet: currentBetAfter,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())

      // If we are in blinds phase, use shorter delay to avoid test timeouts/race conditions
      const delay = !this.stepChecker.checkStep('blindsBetting')
        ? TIMEOUTS.fast
        : TIMEOUTS.standard
      this.emitter.emit('CONTINUE', thisSocket, delay)
    } else {
      this.log
        .Template({
          name: 'brakets',
          title: 'ERROR:BET_FAILED',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          player: foundPlayer.name,
          playerCards: foundPlayer.cards,
          playerSecret: foundPlayer.secretCode,
          dealerCards: this.match.cardsDealer,
          amount,
          chips: foundPlayer.chips,
          reason: 'Insufficient chips or invalid amount',
        })

      this.communicator.msgBuilder('actionRejected', 'private', foundPlayer, {
        reason: 'insufficient chips',
        displayMsg: 'Bet failed: insufficient chips.',
      })
      Socket.sendToPlayer(
        this.match.torneoId,
        foundPlayer.secretCode,
        this.communicator.getMsg(),
      )
    }
  }

  setRise(thisSocket, chipsToBet) {
    this.setBet(thisSocket, chipsToBet, 'setRise')
  }

  sendCurrentPrompt(player) {
    if (!player) return
    const sc = this.stepChecker
    if (!sc.checkStep('blindsBetting')) {
      this.askForBlindBets(player, true)
    } else if (!sc.checkStep('firstBetting')) {
      this.bettingCore(player, 'firstBetting', true)
    } else if (!sc.checkStep('flop_Bet_Step')) {
      this.bettingCore(player, 'flopBetting', true)
    } else if (!sc.checkStep('turn_Bet_Step')) {
      this.bettingCore(player, 'turnBetting', true)
    } else if (!sc.checkStep('river_Bet_Step')) {
      this.bettingCore(player, 'riverBetting', true)
    }
  }

  askForBlindBets(thisSocket, isRefresh = false) {
    const activePlayers = this.match.getActivePlayers(true)

    if (activePlayers.length < GAME_RULES.MIN_PLAYERS) {
      this.log
        .Template({
          name: 'brakets',
          title: 'MATCH:NOT_ENOUGH_PLAYERS',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          activeCount: activePlayers.length,
          totalCount: this.match.players.length,
          players: this.match.players.map((p) => ({
            name: p.name,
            connected: p.connected,
            chips: p.chips,
            isStarted: p.isStarted,
            folded: p.folded,
          })),
        })

      if (activePlayers.length === 1) {
        this.winner(activePlayers[0], true)
      }
      return
    }

    const p1 = activePlayers[0]
    const p2 = activePlayers[1]

    const p1Bet = p1.getCurrentBet()
    const p2Bet = p2.getCurrentBet()

    if (p1Bet > 0 && p2Bet > 0) {
      this.log
        .Template({
          name: 'brakets',
          title: 'MATCH:BLINDS_COMPLETED',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          pot: this.dealer.getPot(),
          dealerCards: this.match.cardsDealer,
        })
      this.match.activePlayerId = null
      this.stepChecker.grantStep('blindsBetting')
      this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.fast) // ✅ Fast transition via events
    } else {
      let p = null
      if (p1Bet === 0) {
        p = p1
      } else if (p2Bet === 0) {
        p = p2
      }

      if (p) {
        if (!isRefresh && this.match.activePlayerId === p.id) return

        const isSB = p === p1
        const blindAmount = isSB ? this.match.smallBlind : this.match.bigBlind
        this.match.activePlayerId = p.id
        this.match.turnStartedAt = Date.now()

        if (p.lastAction !== 'Out') p.setLastAction('')

        this.log
          .Template({
            name: 'brakets',
            title: isRefresh ? 'MATCH:REFRESH_BLINDS' : 'MATCH:ASK_BLINDS',
            date: true,
          })
          .R({
            torneoId: this.match.torneoId,
            handId: this.match.currentHandId,
            player: p.name,
            playerCards: p.cards,
            playerSecret: p.secretCode,
            dealerCards: this.match.cardsDealer,
            type: isSB ? 'SB' : 'BB',
            amount: blindAmount,
          })
        this.communicator.msgBuilder(`askForBlindBets`, 'public', p, {
          displayMsg: `Waiting for ${p.name} (${isSB ? 'SB' : 'BB'})`,
          blindAmount,
        })
        Socket.broadcastToTorneo(
          this.match.torneoId,
          this.communicator.getMsg(),
        )
        this.communicator.msgBuilder(`askForBlindBets`, 'private', p, {
          id: p.id,
          displayMsg: `YOUR TURN: ${isSB ? 'Small' : 'Big'} Blind`,
          blindAmount,
        })
        Socket.sendToPlayer(
          this.match.torneoId,
          p.secretCode,
          this.communicator.getMsg(),
        )
        this.startAutofold()
      }
    }
  }

  winner = (winnerData, isFold = false) => {
    if (this.stepChecker.checkStep('winner')) return

    this.stepChecker.grantStep('blindsBetting')
    this.stepChecker.grantStep('dealtPrivateCards')
    this.stepChecker.grantStep('firstBetting')
    this.stepChecker.grantStep('flop_Dealer_Hand')
    this.stepChecker.grantStep('flop_Check_Prize_Step')
    this.stepChecker.grantStep('flop_Bet_Step')
    this.stepChecker.grantStep('turn_Dealer_Hand')
    this.stepChecker.grantStep('turn_Check_Prize_Step')
    this.stepChecker.grantStep('turn_Bet_Step')
    this.stepChecker.grantStep('river_Dealer_Hand')
    this.stepChecker.grantStep('river_Check_Prize_Step')
    this.stepChecker.grantStep('river_Bet_Step')
    this.stepChecker.grantStep('finalHands')
    this.stepChecker.grantStep('showDown')
    this.stepChecker.grantStep('winner')

    this.match.activePlayerId = null
    this.clearAutofold()

    this.dealer.setFinalHands()
    const finalHands = this.dealer.getFinalHands()
    const pots = this.dealer.calculatePots()

    const winnersAggregation = {}
    let totalPotDistributed = 0

    if (pots.length === 0 && isFold) {
      const winnerPlayerId = winnerData.playerId || winnerData.id
      const player = this.match.players.find((p) => p.id === winnerPlayerId)
      if (player) {
        winnersAggregation[player.id] = {
          name: player.name,
          playerId: player.id,
          amount: 0,
          handName: 'Fold Victory',
          winningCards: [],
        }
      }
    }

    pots.forEach((pot, index) => {
      let potWinners = []

      if (isFold) {
        // En caso de fold, el único jugador activo se lleva todos los pots
        const winnerPlayerId = winnerData.playerId || winnerData.id
        potWinners = [this.match.players.find((p) => p.id === winnerPlayerId)]
      } else {
        // Filtrar manos finales elegibles para este pot (jugadores que contribuyeron y no foldearon)
        const eligibleHands = finalHands.filter(
          (h) => pot.eligiblePlayerIds.includes(h.playerId) && !h.folded,
        )

        if (eligibleHands.length > 0) {
          potWinners = WinnerCore.Winner(eligibleHands)
        }
      }

      if (potWinners.length > 0) {
        const splitAmount = Math.floor(pot.amount / potWinners.length)
        const remainder = pot.amount % potWinners.length

        potWinners.forEach((pw, pwIndex) => {
          const playerId = pw.playerId || pw.id
          const player = this.match.players.find((p) => p.id === playerId)

          if (player) {
            const amountToGive =
              pwIndex === 0 ? splitAmount + remainder : splitAmount
            player.chips += amountToGive
            totalPotDistributed += amountToGive

            if (!winnersAggregation[playerId]) {
              const winningHand = isFold
                ? null
                : finalHands.find((h) => h.playerId === playerId)
              winnersAggregation[playerId] = {
                name: player.name,
                playerId: player.id,
                amount: 0,
                handName: isFold
                  ? 'Fold Victory'
                  : winningHand?.pokerHand || 'High Card',
                winningCards: isFold ? [] : winningHand?.show || [],
                playerCards: player.getCards(),
              }
            }
            winnersAggregation[playerId].amount += amountToGive

            this.log
              .Template({
                name: 'brakets',
                title: `MATCH:POT_${index}_WINNER`,
                date: true,
              })
              .R({
                torneoId: this.match.torneoId,
                handId: this.match.currentHandId,
                winner: player.name,
                potIndex: index,
                amount: amountToGive,
                isFold,
              })
          }
        })
      }
    })

    const winnersInfo = Object.values(winnersAggregation)
    const pot = this.dealer.getPot()

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

    // Blind increase check
    if (this.match.handCount % GAME_RULES.BLIND_INCREASE_INTERVAL === 0) {
      this.match.increaseBlinds()
    }

    // Si es victoria por FOLD, auto-iniciar la siguiente ronda tras el delay estándar
    if (isFold && !isTournamentWinner) {
      setTimeout(() => {
        this.emitter.emit('NEXT_ROUND')
      }, TIMEOUTS.nextRound)
    }
  }

  winnerHand(winnersInfo, isFold, pot, finalHands) {
    if (!winnersInfo || winnersInfo.length === 0) {
      this.log.R({ info: 'No winners to announce' })
      return
    }

    const displayMsg =
      winnersInfo.length > 1
        ? `Tie! ${winnersInfo.map((w) => w.name).join(' and ')} split $${pot}!`
        : `${winnersInfo[0].name} wins $${pot}${isFold ? ' (Fold)' : ''}!`

    this.log
      .Template({
        name: 'brakets',
        title: 'MATCH:HAND_RESULT',
        date: true,
      })
      .R({
        torneoId: this.match.torneoId,
        handId: this.match.currentHandId,
        winners: winnersInfo.map((w) => w.name),
        pot,
        isFold,
        dealerCards: this.match.cardsDealer,
      })

    this.communicator.msgBuilder('winner', 'public', null, {
      method: 'winner',
      displayMsg,
      winners: winnersInfo,
      allHands: finalHands,
      isFold,
      isTournamentWinner: false,
    })

    Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())
  }

  winnerTournament(winnersInfo) {
    const winner = winnersInfo[0]
    const totalPlayers = this.match.players.length

    this.log
      .Template({
        name: 'brakets',
        title: 'MATCH:TOURNAMENT_WINNER',
        date: true,
      })
      .R({
        torneoId: this.match.torneoId,
        handId: this.match.currentHandId,
        winner: winner.name,
        playerId: winner.playerId,
        playerSecret: winner.secretCode, // Fixed to use winner object if provided, otherwise correct path
        dealerCards: this.match.cardsDealer,
        chipsWon: winner.amount,
      })

    const certificate = WinnerCertificate.registerWinner(
      this.match.torneoId,
      winner,
      totalPlayers,
    )

    this.communicator.msgBuilder('winnerTournament', 'public', null, {
      method: 'winnerTournament',
      displayMsg: `🏆 ${winner.name} wins the tournament!`,
      winner,
      isTournamentWinner: true,
      certificate: {
        code: certificate.code,
        torneoId: certificate.torneoId,
        date: certificate.date,
      },
    })

    Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())
  }

  bettingCore = (thisSocket, bettingFor, isRefresh = false) => {
    if (this.stepChecker.checkStep('winner')) return

    const activePlayers = this.match.getActivePlayers(true)

    if (activePlayers.length === 1) {
      this.winner(activePlayers[0], true)
      return
    }

    const maxBet = this.dealer.getCurrentHighestBet()
    const actedPlayers = this.dealer.getPlayersActed()
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
        this.stepChecker.grantStep('showDown') // 🔥 Activar showdown para que se vean las cartas
        this.log
          .Template({ name: 'brakets', title: 'MATCH:RUNOUT', date: true })
          .R({
            torneoId: this.match.torneoId,
            handId: this.match.currentHandId,
            gameId: this.match.gameId,
            dealerCards: this.match.cardsDealer,
          })

        this.communicator.msgBuilder('runout', 'public', null, {
          displayMsg: 'All-in runout! Dealing remaining cards...',
        })
        Socket.broadcastToTorneo(
          this.match.torneoId,
          this.communicator.getMsg(),
        )
      }
    }

    if (this.match.isRunout) {
      this.stepChecker.grantStep(steps[bettingFor])
      return this.emitter.emit('CONTINUE', thisSocket)
    }

    let sorted = []
    const allPlayers = this.match.players
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
      this.log
        .Template({
          name: 'brakets',
          title: 'MATCH:BETTING_FINISHED',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          pot: this.dealer.getPot(),
          dealerCards: this.match.cardsDealer,
        })
      this.match.activePlayerId = null
      this.dealer.clearActedPlayers()
      this.dealer.setCurrentHighestBet(0)
      this.dealer.setLastRaiseAmount(0)
      this.dealer.setLastRaiser(null)

      this.stepChecker.grantStep(steps[bettingFor])
      this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.collectChips) // ✅ Delay for chip movement
    } else {
      const p = playersToAct[0]
      // Si no es un refresco y ya es el turno del jugador, no hacemos nada
      if (!isRefresh && this.match.activePlayerId === p.id) return

      this.match.activePlayerId = p.id
      this.match.turnStartedAt = Date.now()

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

      this.log
        .Template({
          name: 'brakets',
          title: isRefresh ? 'MATCH:REFRESH_TURN' : 'MATCH:WAITING_PLAYER',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          player: p.name,
          playerCards: p.cards,
          playerSecret: p.secretCode,
          dealerCards: this.match.cardsDealer,
          options: opts,
          maxBet,
          playerBet: p.getCurrentBet(),
          playerChips: p.chips,
          actedPlayers: actedPlayers.map(
            (id) => this.match.players.find((pl) => pl.id === id)?.name,
          ),
        })

      this.communicator.msgBuilder(`bettingCore-${bettingFor}`, 'private', p, {
        messageForId: p.id,
        action: opts,
        displayMsg: 'Your turn',
      })
      Socket.sendToPlayer(
        this.match.torneoId,
        p.secretCode,
        this.communicator.getMsg(),
      )
      this.communicator.msgBuilder(`bettingCore-${bettingFor}`, 'public', p, {
        messageForId: p.id,
        action: opts,
        displayMsg: `Waiting for ${p.name}`,
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())
      this.startAutofold()
    }
  }

  dealerHand = (thisSocket, whatHand) => {
    this.dealer.dealCardsDealer(whatHand === 'flop' ? 3 : 1)
    const steps = {
      flop: 'flop_Dealer_Hand',
      turn: 'turn_Dealer_Hand',
      river: 'river_Dealer_Hand',
    }
    this.stepChecker.grantStep(steps[whatHand])

    this.log
      .Template({
        name: 'brakets',
        title: 'DEALER:STREET',
        date: true,
      })
      .R({
        torneoId: this.match.torneoId,
        handId: this.match.currentHandId,
        street: whatHand.toUpperCase(),
        dealerCards: this.match.cardsDealer,
        pot: this.dealer.getPot(),
      })

    this.communicator.msgBuilder(`dealerHand-${whatHand}`, 'public', null, {
      displayMsg: `Dealer deals the ${whatHand}`,
      pot: this.dealer.getPot(),
    })
    Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())
    this.match.comms.sendOdds()
    this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.standard) // ✅ Standard transition for dealing
  }

  checkPrizes(thisSocket) {
    const cards = this.dealer.getDealerCards()
    if (cards.length >= 3) {
      this.match.players.forEach((p) => {
        if (p && !p.folded) p.setCurrentPrize(p.checkPrize(cards))
      })
      const steps = {
        3: 'flop_Check_Prize_Step',
        4: 'turn_Check_Prize_Step',
        5: 'river_Check_Prize_Step',
      }
      this.stepChecker.grantStep(steps[cards.length])
    }

    this.log
      .Template({
        name: 'brakets',
        title: 'DEALER:CHECK_PRIZES',
        date: true,
      })
      .R({
        torneoId: this.match.torneoId,
        handId: this.match.currentHandId,
        cardsCount: cards.length,
        dealerCards: cards,
      })

    this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.fast) // ✅ Fast transition via events
  }

  dealtPrivateCards(thisSocket) {
    try {
      this.dealer.dealCardsEachPlayer(GAME_RULES.INITIAL_CARDS_PER_PLAYER)
      this.stepChecker.grantStep('dealtPrivateCards')
      this.dealer.clearActedPlayers()

      this.log
        .Template({
          name: 'brakets',
          title: 'DEALER:PRIVATE_CARDS',
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          players: this.match.players.map((p) => ({
            name: p.name,
            playerCards: p.cards,
            playerSecret: p.secretCode,
          })),
          dealerCards: this.match.cardsDealer,
        })

      this.communicator.msgBuilder('dealtPrivateCards', 'public', null, {
        displayMsg: 'Cards dealt!',
      })
      Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())

      for (const player of this.match.players) {
        this.communicator.msgBuilder('dealtPrivateCards', 'private', player, {})
        Socket.sendToPlayer(
          this.match.torneoId,
          player.secretCode,
          this.communicator.getMsg(),
        )
      }
      this.match.comms.sendOdds()
      this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.standard) // ✅ Standard transition after dealing
    } catch (error) {
      console.error('Error in dealtPrivateCards:', error)
    }
  }
}

module.exports = MatchActions
