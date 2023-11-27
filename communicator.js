class Communicator {
  constructor(gameId, torneoId, playerFold, stepChecker, players, dealer) {
    this.gameId = gameId;
    this.torneoId = torneoId;
    this.stepChecker = stepChecker;
    this.playerFold = playerFold;
    this.players = players;
    this.dealer = dealer;
  }

  msg = {};
  player = {};

  censoredPlayersInfo(players) {
    if (!players) return {};

    const censoredPlayers = JSON.parse(JSON.stringify(players));
    censoredPlayers.forEach((player) => {
      delete player.cards;
    });
    return censoredPlayers;
  }

  myPrivateInfo(player) {
    if (!player) return {};
    const { id: playerId, name: playerName } = player;
    const privateCards = player.getCards();
    return { playerId, playerName, privateCards };
  }

  msgBuilder(action, type, player, data) {
    const pot = this.pot;
    const players = this.players;
    let myPlayerInfo;
    if (type == "private") {
      myPlayerInfo = this.myPrivateInfo(player);
    }

    ///For Players/System
    this.msg = {
      action,
      type,
      pot: this.dealer.getPot(),
      myPlayerInfo,
      data,
      stepChecker: this.stepChecker.getChecker(),
      players: this.censoredPlayersInfo(players),
    };

    ///For OsoLog
    this.fullInfo = {
      action,
      type,
      pot: this.dealer.getPot(),
      data,
      stepChecker: this.stepChecker.getChecker(),
      players: players,
    };
  }

  getMsg() {
    return this.msg;
  }

  getFullInfo() {
    console.log("");
    return this.fullInfo;
  }
}
module.exports = Communicator;
