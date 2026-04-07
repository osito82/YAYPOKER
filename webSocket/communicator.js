class Communicator {
  constructor(
    gameId,
    torneoId,
    playerFold,
    stepChecker,
    players,
    dealer,
    match,
  ) {
    this.gameId = gameId
    this.torneoId = torneoId
    this.stepChecker = stepChecker
    this.playerFold = playerFold
    this.players = players
    this.dealer = dealer
    this.match = match
  }

  msg = {}
  player = {}

  censoredPlayersInfo(players) {
    if (!players) return []
    const isShowDown = this.stepChecker.checkStep('showDown')
    const isRunout = this.match.isRunout

    return players.map((p) => {
      const info = p.toJson()
      if (isShowDown || isRunout) {
        info.cards = p.getCards()
      }
      return info
    })
  }

  myPrivateInfo(player) {
    if (!player) return {}
    const { id: playerId, name: playerName } = player
    const privateCards = player.getCards()
    return { playerId, playerName, privateCards }
  }

  msgBuilder(action, type, player, data) {
    const players = this.players
    let myPlayerInfo
    if (type == 'private') {
      myPlayerInfo = this.myPrivateInfo(player)
    }

    ///For Players/System
    this.msg = {
      action,
      type,
      gameId: this.gameId,
      torneoId: this.torneoId,
      pot: this.dealer.getPot(),
      pots: this.dealer.calculatePots(),
      currentHighestBet: this.dealer.getCurrentHighestBet(),
      lastRaiseAmount: this.dealer.getLastRaiseAmount(),
      myPlayerInfo,
      data,
      autofoldDuration: Math.floor(this.match.autofoldDuration / 1000), // Use match duration in seconds
      stepChecker: this.stepChecker.getChecker(),
      players: this.censoredPlayersInfo(players),
      dealerCards: this.dealer.getDealerCards(),
      //  currentPrize:this.player.getCurrentPrize()
    }

    ///For OsoLog
    this.fullInfo = {
      action,
      type,
      gameId: this.gameId,
      pot: this.dealer.getPot(),
      pots: this.dealer.calculatePots(),
      currentHighestBet: this.dealer.getCurrentHighestBet(),
      lastRaiseAmount: this.dealer.getLastRaiseAmount(),
      data,
      stepChecker: this.stepChecker.getChecker(),
      players: players.map((p) => {
        const info = p.toJson()
        info.cards = p.getCards()
        return info
      }),
      dealerCards: this.dealer.getDealerCards(),
      // currentPrize:this.player.getCurrentPrize()
    }
  }

  getMsg() {
    return this.msg
  }

  getFullInfo() {
    console.log('')
    return this.fullInfo
  }
}
module.exports = Communicator
