const Socket = require('../sockets')

class MatchComms {
  constructor(match) {
    this.match = match
  }

  sendMessage(data) {
    const { targetPlayerId, targetMessage } = data
    const targetSocket = Socket.getSocket(this.match.torneoId, targetPlayerId)

    if (targetSocket?.socket) {
      targetSocket.socket.send(
        JSON.stringify({ message: { displayMsg: targetMessage } }),
      )
    } else {
      this.match.log
        .Template({ name: 'brakets', title: 'MATCH - Chat Error', date: true })
        .R({ msg: 'Target not found', targetPlayerId })
    }
  }

  stats(socketId) {
    this.match.log
      .Template({ name: 'brakets', title: 'MATCH - Stats', date: true })
      .R({
        pot: this.match.dealer.getPot(),
        players: this.match.players.length,
      })
  }

  sendOdds(targetPlayer = null) {
    const activePlayers = this.match.players.filter(
      (p) => !p.folded && p.connected,
    )
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
      this.match.communicator.msgBuilder('oddsUpdate', 'private', p, {
        odds: playerOdds,
      })
      Socket.sendToPlayer(
        this.match.torneoId,
        p.secretCode,
        this.match.communicator.getMsg(),
      )
    })
  }
}

module.exports = MatchComms
