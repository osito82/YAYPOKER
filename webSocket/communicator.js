class Communicator {
  constructor(gameId, torneoId, playerFold, stepChecker, players, dealer) {
    this.gameId = gameId
    this.torneoId = torneoId
    this.stepChecker = stepChecker
    this.playerFold = playerFold
    this.players = players
    this.dealer = dealer
  }

  msg = {}
  player = {}

  censoredPlayersInfo(players) {
    if (!players) return []
    return players.map((p) => p.toJson())
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
      pot: this.dealer.getPot(),
      currentHighestBet: this.dealer.getCurrentHighestBet(),
      myPlayerInfo,
      data,
      stepChecker: this.stepChecker.getChecker(),
      players: this.censoredPlayersInfo(players),
      dealerCards: this.dealer.getDealerCards(),
      //  currentPrize:this.player.getCurrentPrize()
    }

    ///For OsoLog
    this.fullInfo = {
      action,
      type,
      pot: this.dealer.getPot(),
      currentHighestBet: this.dealer.getCurrentHighestBet(),
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
