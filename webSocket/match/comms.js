const Socket = require('../sockets')

class MatchComms {
  constructor(match) {
    this.match = match
  }

  sendOdds(targetPlayer = null) {
    const activePlayers = this.match.players.filter((p) => !p.folded && p.connected)
    if (activePlayers.length < 2) return

    const playerHands = activePlayers.map((p) => p.getCards())
    const boardCards = this.match.dealer.getDealerCards()

    const results = this.match.oddsCalculator.calculateOdds(playerHands, boardCards)

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
