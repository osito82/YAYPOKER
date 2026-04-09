const Socket = require('../sockets')
const { WinnerCore } = require('../winnerCore')
const PokerCore = require('../pokerCore')
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

  // --- PRIVATE / PUBLIC DIFFERENTIATION HELPERS ---

  isPublic = () => {
    return !!this.match.isPublic
  }

  getMinPlayers = () => {
    return this.isPublic()
      ? GAME_RULES.MIN_PLAYERS_PUBLIC
      : GAME_RULES.MIN_PLAYERS
  }

  resetConsecutiveAutofolds = (player) => {
    if (player) player.consecutiveAutofolds = 0
  }

  disconnectPlayer = (player) => {
    if (!player) return
    player.setConnected(false)
    this.log
      .Template({
        name: 'brakets',
        title: 'MATCH:PLAYER_ABANDONED',
        date: true,
      })
      .R({
        torneoId: this.match.torneoId,
        playerName: player.name,
        reason: 'Consecutive autofolds',
      })

    // Find and close the actual socket
    const torneoSockets = Socket.getSocketsByTorneo(this.match.torneoId)
    if (torneoSockets) {
      for (const [secretCode, socketWrapper] of torneoSockets.entries()) {
        if (socketWrapper.id === player.id) {
          // Send a last message to the player explaining why they are being disconnected
          if (socketWrapper.socket && socketWrapper.socket.readyState === 1) {
            this.communicator.msgBuilder('disconnected', 'private', player, {
              reason: 'abandoned',
              displayMsg:
                'You have been disconnected for being inactive for 2 consecutive turns.',
            })
            socketWrapper.socket.send(
              JSON.stringify({ message: this.communicator.getMsg() }),
            )

            setTimeout(() => {
              if (
                socketWrapper.socket &&
                socketWrapper.socket.readyState === 1
              ) {
                socketWrapper.socket.close(1000, 'Abandoned')
              }
            }, 500)
          }
          torneoSockets.delete(secretCode)
          break
        }
      }
    }
  }

  // --- CORE GAME LOGIC ---

  autofold = () => {
    const foundPlayer = this.match.players.find(
      (p) => p.id == this.match.activePlayerId,
    )
    if (foundPlayer) {
      foundPlayer.consecutiveAutofolds++

      this.log
        .Template({ name: 'brakets', title: 'ACTION:AUTOFOLD', date: true })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          playerName: foundPlayer.name,
          playerId: foundPlayer.id,
          consecutive: foundPlayer.consecutiveAutofolds,
          limit: GAME_RULES.MAX_CONSECUTIVE_AUTOFOLDS,
          isPublic: this.isPublic(),
          reason: 'Timeout',
        })

      const isAbandoned =
        this.isPublic() &&
        foundPlayer.consecutiveAutofolds >= GAME_RULES.MAX_CONSECUTIVE_AUTOFOLDS

      if (isAbandoned) {
        this.disconnectPlayer(foundPlayer)
      }

      this.fold({ id: foundPlayer.id }, true)
    }
  }

  startAutofold = () => {
    this.clearAutofold()
    this.match.autofoldTimer = setTimeout(() => {
      this.autofold()
    }, this.match.autofoldDuration)
  }

  clearAutofold = () => {
    if (this.match.autofoldTimer) {
      clearTimeout(this.match.autofoldTimer)
      this.match.autofoldTimer = null
    }
  }

  fold = (thisSocket, isAutofold = false) => {
    if (
      !this.match.activePlayerId ||
      this.match.activePlayerId !== thisSocket.id
    )
      return

    const foundPlayer = this.match.players.find((p) => p.id == thisSocket.id)
    if (foundPlayer && !foundPlayer.folded) {
      if (!isAutofold) this.resetConsecutiveAutofolds(foundPlayer)
      this.clearAutofold()
      if (this.match.acceptingPlayers) {
        this.match.lobby.noMorePlayers()
      }
      this.match.activePlayerId = null

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

      const activePlayers = this.match.getActivePlayers(true)

      if (activePlayers.length === 1) {
        return this.winner(activePlayers[0], true)
      }

      this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.fast)
    }
  }

  performCheck = (foundPlayer) => {
    if (foundPlayer.getCurrentBet() === this.dealer.getCurrentHighestBet()) {
      this.resetConsecutiveAutofolds(foundPlayer)
      this.clearAutofold()
      this.match.activePlayerId = null
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
    )
      return

    const foundPlayer = this.match.players.find((p) => p.id == thisSocket.id)
    if (foundPlayer) {
      this.clearAutofold()
      const success = this.performCheck(foundPlayer)
      if (success) {
        this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.fast)
      }
    }
  }

  setCall = (thisSocket) => {
    if (
      !this.match.activePlayerId ||
      this.match.activePlayerId !== thisSocket.id
    )
      return

    const foundPlayer = this.match.players.find((p) => p.id == thisSocket.id)
    if (!foundPlayer) return

    const currentMaxBet = this.dealer.getCurrentHighestBet()
    let amountAdded = currentMaxBet - foundPlayer.getCurrentBet()

    if (amountAdded <= 0) {
      return this.setCheck(thisSocket)
    }

    this.resetConsecutiveAutofolds(foundPlayer)
    this.clearAutofold()
    if (this.match.acceptingPlayers) {
      this.match.lobby.noMorePlayers()
    }

    const currentBetBefore = foundPlayer.getCurrentBet()
    const success = foundPlayer.setTotalBet(currentMaxBet)
    if (!success) return

    this.match.activePlayerId = null
    const currentBetAfter = foundPlayer.getCurrentBet()
    amountAdded = currentBetAfter - currentBetBefore

    this.dealer.setPlayerActed(foundPlayer.id)
    this.dealer.setPot(amountAdded)

    let actionType = 'Call'
    if (foundPlayer.isAllIn) {
      actionType = 'All-In'
    }

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
    this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.fast)
  }

  setBet = (thisSocket, chipsToBet, type = 'setBet') => {
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
    const lastRaise = this.dealer.getLastRaiseAmount() || this.match.bigBlind

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

    this.resetConsecutiveAutofolds(foundPlayer)
    this.clearAutofold()
    if (this.match.acceptingPlayers) {
      this.match.lobby.noMorePlayers()
    }

    const currentBetBefore = foundPlayer.getCurrentBet()
    const previousMaxBet = currentMaxBet
    const success = foundPlayer.setTotalBet(amount)

    if (success) {
      this.match.activePlayerId = null
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

  setRise = (thisSocket, chipsToBet) => {
    this.setBet(thisSocket, chipsToBet, 'setRise')
  }

  sendCurrentPrompt = (player) => {
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

  askForBlindBets = (thisSocket, isRefresh = false) => {
    const activePlayers = this.match.getActivePlayers(true)
    const minPlayers = this.getMinPlayers()

    if (activePlayers.length < minPlayers) {
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

    if (this.isPublic()) {
      this.stepChecker.grantStep('blindsBetting')
      return this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.fast)
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
      this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.fast)
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

    let winnersInfo = winnerData

    if (winnersInfo && !Array.isArray(winnersInfo)) {
      winnersInfo = [winnersInfo]
    }

    if (!winnersInfo || winnersInfo.length === 0) {
      if (isFold) {
        // Find the only player who didn't fold
        const lastPlayer = this.match.players.find((p) => !p.folded)
        if (lastPlayer) {
          winnersInfo = [
            {
              name: lastPlayer.name,
              playerId: lastPlayer.id,
              pokerHand: 'High Card',
              prizeRank: 10,
            },
          ]
        }
      }

      if (!winnersInfo || winnersInfo.length === 0) {
        // Evaluate hands if not already done
        const dealerCards = this.dealer.getDealerCards()
        const playerEvaluations = this.match.players.map((p) => {
          let prize = p.folded
            ? { prizeRank: 11, pokerHand: 'folded' }
            : PokerCore.betterHand(dealerCards, p.cards)

          if (!prize) {
            prize = { prizeRank: 10, pokerHand: 'High Card' }
          }

          return {
            ...prize,
            name: p.name,
            playerId: p.id,
            gameId: p.gameId,
            chips: p.chips,
            playerCards: p.cards,
            folded: p.folded,
          }
        })
        winnersInfo = WinnerCore.Winner(playerEvaluations)
      }
    }

    // NORMALIZE: Ensure each entry has playerId and other expected fields
    // This handles cases where a Player object was passed directly
    const currentPot = this.dealer.getPot()
    winnersInfo = winnersInfo.map((w) => {
      const isPlayerObject = typeof w.getPlayerId === 'function'
      const pId = isPlayerObject ? w.id : (w.playerId || w.id)
      
      return {
        name: w.name,
        playerId: pId,
        pokerHand: isPlayerObject ? 'High Card' : (w.pokerHand || 'High Card'),
        prizeRank: isPlayerObject ? 10 : (w.prizeRank || 10),
        handName: isPlayerObject ? 'High Card' : (w.pokerHand || 'High Card'),
        amount: w.amount || (winnersInfo.length === 1 ? currentPot : Math.floor(currentPot / winnersInfo.length))
      }
    })

    const finalHands = this.dealer.getFinalHands()
    const pot = this.dealer.getPot()

    this.log
      .Template({ name: 'brakets', title: 'MATCH:HAND_RESULT', date: true })
      .R({
        torneoId: this.match.torneoId,
        handId: this.match.currentHandId,
        winners: winnersInfo.map((w) => w.name),
        pot,
        isFold,
        dealerCards: this.match.cardsDealer,
      })

    let displayMsg = ''
    if (winnersInfo.length === 1) {
      const winner = winnersInfo[0]
      const player = this.match.players.find((p) => p.id === winner.playerId)
      if (player) {
        player.chips += pot
        winner.amount = pot
      }
      displayMsg = isFold
        ? `${winner.name} wins ${pot} (others folded)`
        : `${winner.name} wins ${pot} with ${winner.pokerHand}`
    } else {
      const splitPot = Math.floor(pot / winnersInfo.length)
      winnersInfo.forEach((winner) => {
        const player = this.match.players.find((p) => p.id === winner.playerId)
        if (player) {
          player.chips += splitPot
          winner.amount = splitPot
        }
      })
      displayMsg = `Split pot: ${winnersInfo.map((w) => w.name).join(', ')} win ${splitPot} each`
    }

    this.communicator.msgBuilder('winner', 'public', null, {
      method: 'winner',
      displayMsg,
      winners: winnersInfo,
      allHands: finalHands,
      isFold,
      isTournamentWinner: false,
    })

    Socket.broadcastToTorneo(this.match.torneoId, this.communicator.getMsg())

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

    if (this.match.handCount % GAME_RULES.BLIND_INCREASE_INTERVAL === 0) {
      this.match.increaseBlinds()
    }

    if (isFold && !isTournamentWinner) {
      setTimeout(() => {
        this.emitter.emit('NEXT_ROUND')
      }, TIMEOUTS.nextRound)
    } else if (this.isPublic()) {
      // En mesas públicas, siempre intentamos ir a la siguiente ronda (que reseteará si el torneo terminó)
      setTimeout(() => {
        this.emitter.emit('NEXT_ROUND')
      }, TIMEOUTS.nextRound)
    }
  }

  winnerHand = (winnersInfo, isFold, pot, finalHands) => {
    if (!winnersInfo || winnersInfo.length === 0) {
      this.log.R({ info: 'No winners to announce' })
      return
    }

    winnersInfo.forEach((winner, index) => {
      this.log
        .Template({
          name: 'brakets',
          title: `MATCH:POT_${index}_WINNER`,
          date: true,
        })
        .R({
          torneoId: this.match.torneoId,
          handId: this.match.currentHandId,
          winner: winner.name,
          potIndex: index,
          amount: winner.amount || pot,
          isFold,
        })
    })
  }

  winnerTournament = (winnersInfo) => {
    const winnerData = winnersInfo[0]
    const totalPlayers = this.match.players.length

    const realPlayer = this.match.players.find(
      (p) => p.id === winnerData.playerId,
    )

    const winnerForCert = {
      ...winnerData,
      secretCode: realPlayer ? realPlayer.secretCode : '0000',
      amount: realPlayer ? realPlayer.chips : (winnerData.amount || 0),
    }

    this.log
      .Template({
        name: 'brakets',
        title: 'MATCH:TOURNAMENT_WINNER',
        date: true,
      })
      .R({
        torneoId: this.match.torneoId,
        handId: this.match.currentHandId,
        winner: winnerForCert.name,
        playerId: winnerForCert.playerId,
        dealerCards: this.match.cardsDealer,
        chipsWon: winnerForCert.amount,
      })

    const certificate = WinnerCertificate.registerWinner(
      this.match.torneoId,
      winnerForCert,
      totalPlayers,
    )

    this.communicator.msgBuilder('winnerTournament', 'public', null, {
      method: 'winnerTournament',
      displayMsg: `${winnerForCert.name} wins the tournament!`,
      winner: winnerForCert,
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
        this.stepChecker.grantStep('showDown')
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
          pot: this.dealer.getPot(),
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
    if (this.isPublic()) {
      sorted = [...allPlayers]
    } else if (bettingFor === 'firstBetting') {
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
      this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.collectChips)
    } else {
      const p = playersToAct[0]
      if (!isRefresh && this.match.activePlayerId === p.id) return

      this.match.activePlayerId = p.id
      this.match.turnStartedAt = Date.now()

      if (p.lastAction !== 'Out') p.setLastAction('')

      let opts = []
      if (maxBet === 0) {
        opts = ['check', 'bet', 'fold']
      } else {
        if (p.getCurrentBet() < maxBet) {
          opts = ['fold', 'call', 'raise']
        } else {
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
    this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.standard)
  }

  checkPrizes = (thisSocket) => {
    const cards = this.dealer.getDealerCards()
    const cardCount = cards.length

    if (cardCount >= 3) {
      this.match.players.forEach((p) => {
        if (p && !p.folded) p.setCurrentPrize(p.checkPrize(cards))
      })
    }

    const steps = {
      3: 'flop_Check_Prize_Step',
      4: 'turn_Check_Prize_Step',
      5: 'river_Check_Prize_Step',
    }

    const stepToGrant = steps[cardCount]
    if (stepToGrant) {
      this.stepChecker.grantStep(stepToGrant)
    } else {
      // Emergency: If we're here but have wrong number of cards, we must still progress
      // to avoid infinite loops. We'll grant the next expected step.
      const sc = this.stepChecker
      if (!sc.checkStep('flop_Check_Prize_Step')) {
        sc.grantStep('flop_Check_Prize_Step')
      } else if (!sc.checkStep('turn_Check_Prize_Step')) {
        sc.grantStep('turn_Check_Prize_Step')
      } else if (!sc.checkStep('river_Check_Prize_Step')) {
        sc.grantStep('river_Check_Prize_Step')
      }
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
        cardsCount: cardCount,
        dealerCards: cards,
      })

    this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.fast)
  }

  dealtPrivateCards = (thisSocket) => {
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
      this.emitter.emit('CONTINUE', thisSocket, TIMEOUTS.standard)
    } catch (error) {
      console.error('Error in dealtPrivateCards:', error)
    }
  }
}

module.exports = MatchActions
