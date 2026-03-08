const Socket = require('../sockets')

/**
 * Perform a check action for a player.
 */
function performCheck(match, foundPlayer) {
  if (foundPlayer.getCurrentBet() === match.dealer.getCurrentHighestBet()) {
    match.clearAutofold()
    match.activePlayerId = null // ✅ CLEAR TURN IMMEDIATELY
    match.dealer.setPlayerActed(foundPlayer.id)

    foundPlayer.setLastAction('Check')
    match.log
      .Template({ name: 'brakets', title: 'MATCH - CHECK', date: true })
      .R({ player: foundPlayer.name })
    match.communicator.msgBuilder('setCheck', 'public', foundPlayer, {
      displayMsg: `${foundPlayer.name} checks`,
    })
    Socket.broadcastToTorneo(match.torneoId, match.communicator.getMsg())
    return true
  } else {
    match.log
      .Template({
        name: 'brakets',
        title: 'MATCH - Invalid Check',
        date: true,
      })
      .R({
        player: foundPlayer.name,
        currentBet: foundPlayer.getCurrentBet(),
        maxBet: match.dealer.getCurrentHighestBet(),
      })
    return false
  }
}

/**
 * Handle a bet or rise action.
 */
function setBet(match, thisSocket, chipsToBet, type = 'setBet') {
  if (!match.activePlayerId || match.activePlayerId !== thisSocket.id) {
    match.log
      .Template({
        name: 'brakets',
        title: 'MATCH - Action Rejected',
        date: true,
      })
      .R({
        player: thisSocket.name,
        reason: 'Not your turn or no active player',
        expected: match.activePlayerId,
        received: thisSocket.id,
      })
    return
  }

  const foundPlayer = match.players.find((p) => p.id == thisSocket.id)
  if (!foundPlayer) return

  const amount = Number(chipsToBet)

  // Validar que si es un Raise, realmente aumente la apuesta
  if (type === 'setRise' && amount <= match.dealer.getCurrentHighestBet()) {
    match.log
      .Template({
        name: 'brakets',
        title: 'MATCH - Raise Rejected',
        date: true,
      })
      .R({
        player: foundPlayer.name,
        amount,
        currentMax: match.dealer.getCurrentHighestBet(),
        reason: 'Raise must be higher than current highest bet',
      })
    return
  }

  match.clearAutofold()
  if (match.acceptingPlayers) {
    match.noMorePlayers()
  }

  const currentBetBefore = foundPlayer.getCurrentBet()
  const success = foundPlayer.setTotalBet(amount)

  if (success) {
    match.activePlayerId = null // ✅ CLEAR TURN IMMEDIATELY
    const currentBetAfter = foundPlayer.getCurrentBet()
    const addedChips = currentBetAfter - currentBetBefore

    let actionType = type === 'setBet' ? 'Bet' : 'Raise'
    let broadcastAction = 'setBet'

    if (foundPlayer.isAllIn) {
      actionType = 'All-In'
      broadcastAction = 'setCall'
    }

    foundPlayer.setLastAction(actionType)
    match.dealer.setPot(addedChips)

    if (currentBetAfter > match.dealer.getCurrentHighestBet()) {
      match.dealer.setCurrentHighestBet(currentBetAfter)
      match.dealer.setLastRaiser(foundPlayer.id)
      match.dealer.clearActedPlayers()
    }

    match.dealer.setPlayerActed(foundPlayer.id)

    match.log
      .Template({
        name: 'brakets',
        title: `MATCH - ${actionType.toUpperCase()}`,
        date: true,
      })
      .R({
        player: foundPlayer.name,
        added: addedChips,
        totalBet: currentBetAfter,
        newPot: match.dealer.getPot(),
      })

    match.communicator.msgBuilder(broadcastAction, 'public', foundPlayer, {
      displayMsg: `${foundPlayer.name} ${actionType === 'All-In' ? 'goes all-in' : type === 'setBet' ? 'bets' : 'raises to'} ${currentBetAfter}`,
      name: foundPlayer.name,
      bet: currentBetAfter,
    })
    Socket.broadcastToTorneo(match.torneoId, match.communicator.getMsg())

    // If we are in blinds phase, use shorter delay to avoid test timeouts/race conditions
    const delay = !match.stepChecker.checkStep('blindsBetting') ? match.constructor.timeouts.fast : match.constructor.timeouts.standard
    match.continue(thisSocket, delay)
  } else {
    match.log
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

/**
 * Handle a call action.
 */
function setCall(match, thisSocket) {
  if (!match.activePlayerId || match.activePlayerId !== thisSocket.id) {
    match.log
      .Template({
        name: 'brakets',
        title: 'MATCH - Action Rejected',
        date: true,
      })
      .R({
        player: thisSocket.name,
        reason: 'Not your turn',
        action: 'Call',
        expected: match.activePlayerId,
        received: thisSocket.id,
      })
    return
  }

  const maxBet = match.dealer.getCurrentHighestBet()
  const foundPlayer = match.players.find((p) => p.id == thisSocket.id)
  if (!foundPlayer) return

  match.clearAutofold()
  if (match.acceptingPlayers) {
    match.noMorePlayers()
  }

  const currentBetBefore = foundPlayer.getCurrentBet()
  const diff = maxBet - currentBetBefore

  // Si no hay nada que igualar, se trata como un Check
  if (diff <= 0) {
    match.log
      .Template({
        name: 'brakets',
        title: 'MATCH - CALL AS CHECK',
        date: true,
      })
      .R({ player: foundPlayer.name, diff })

    const checkSuccess = performCheck(match, foundPlayer)
    if (checkSuccess) {
      match.continue(thisSocket, match.constructor.timeouts.fast)
    }
    return
  }

  match.activePlayerId = null // ✅ CLEAR TURN IMMEDIATELY

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

  match.dealer.setPot(amountAdded)
  match.dealer.setPlayerActed(foundPlayer.id)
  foundPlayer.setLastAction(actionType)

  match.log
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
      newPot: match.dealer.getPot(),
    })

  match.communicator.msgBuilder('setCall', 'public', foundPlayer, {
    displayMsg: `${foundPlayer.name} ${actionType === 'All-In' ? 'goes all-in' : 'calls'}`,
    name: foundPlayer.name,
    bet: foundPlayer.getCurrentBet(),
  })

  Socket.broadcastToTorneo(match.torneoId, match.communicator.getMsg())
  match.continue(thisSocket, match.constructor.timeouts.fast) // ✅ Fast transition
}

/**
 * Handle a check action.
 */
function setCheck(match, thisSocket) {
  if (!match.activePlayerId || match.activePlayerId !== thisSocket.id) {
    match.log
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

  const foundPlayer = match.players.find((p) => p.id == thisSocket.id)
  if (foundPlayer) {
    const success = performCheck(match, foundPlayer)
    if (success) {
      match.continue(thisSocket, match.constructor.timeouts.fast) // ✅ Fast transition
    }
  }
}

/**
 * Handle a rise action.
 */
function setRise(match, thisSocket, chipsToBet) {
  setBet(match, thisSocket, chipsToBet, 'setRise')
}

/**
 * Handle a fold action.
 */
function fold(match, thisSocket) {
  if (!match.activePlayerId || match.activePlayerId !== thisSocket.id) return

  const foundPlayer = match.players.find((p) => p.id == thisSocket.id)
  if (foundPlayer && !foundPlayer.folded) {
    match.clearAutofold()
    if (match.acceptingPlayers) {
      match.noMorePlayers()
    }
    match.activePlayerId = null // ✅ CLEAR TURN IMMEDIATELY

    foundPlayer.setLastAction('Fold')
    foundPlayer.setFolded(true)
    match.playersFold.push(foundPlayer.name)
    match.dealer.setPlayerActed(foundPlayer.id)

    match.log
      .Template({ name: 'brakets', title: 'MATCH - FOLD', date: true })
      .R({ player: foundPlayer.name })

    match.communicator.msgBuilder('fold', 'public', foundPlayer, {
      displayMsg: `${foundPlayer.name} folded.`,
    })
    Socket.broadcastToTorneo(match.torneoId, match.communicator.getMsg())
    match.sendOdds()
    match.continue(thisSocket, match.constructor.timeouts.fast) // ✅ Fast transition
  }
}

module.exports = {
  setBet,
  setCall,
  setCheck,
  setRise,
  fold,
  performCheck,
}
