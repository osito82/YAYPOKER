const Socket = require('../sockets')

class MatchComms {
  constructor(context) {
    this.match = context.match
    this.log = context.log
    this.communicator = context.communicator
  }

  sendMessage(data) {
    const { targetPlayerId, targetMessage } = data
    const targetSocket = Socket.getSocket(this.match.torneoId, targetPlayerId)

    if (targetSocket?.socket) {
      targetSocket.socket.send(
        JSON.stringify({ message: { displayMsg: targetMessage } }),
      )
    } else {
      this.log
        .Template({ name: 'brakets', title: 'ERROR:CHAT_ERROR', date: true })
        .R({ msg: 'Target not found', targetPlayerId })
    }
  }

  stats(socketId) {
    this.log
      .Template({ name: 'brakets', title: 'MATCH:STATS', date: true })
      .R({
        torneoId: this.match.torneoId,
        handId: this.match.currentHandId,
        pot: this.match.dealer.getPot(),
        playerCount: this.match.players.length,
        players: this.match.players.map((p) => ({
          name: p.name,
          connected: p.connected,
          chips: p.chips,
        })),
        dealerCards: this.match.cardsDealer,
      })
  }

  sendOdds(targetPlayer = null) {
    const activePlayers = this.match.getActivePlayers(true) // Only connected and in hand
    if (activePlayers.length < 2) return

    const playerHands = activePlayers.map((p) => p.getCards())
    const boardCards = this.match.dealer.getDealerCards()

    const results = this.match.oddsCalculator.calculateOdds(
      playerHands,
      boardCards,
    )

    activePlayers.forEach((p, idx) => {
      // Si se especificó un targetPlayer, solo enviar a él
      if (targetPlayer && p.id !== targetPlayer.id) return

      const playerOdds = {
        win: results.winProbabilities[idx],
        tie: results.tieProbability,
      }
      this.communicator.msgBuilder('oddsUpdate', 'private', p, {
        odds: playerOdds,
      })
      Socket.sendToPlayer(
        this.match.torneoId,
        p.secretCode,
        this.communicator.getMsg(),
      )
    })
  }
}

module.exports = MatchComms
