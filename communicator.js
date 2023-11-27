class Communicator {
  constructor(gameId, torneoId, pot, playerFold, stepChecker, players) {
    this.gameId = gameId;
    this.torneoId = torneoId;
    this.stepChecker = stepChecker;
    this.pot = pot;
    this.playerFold = playerFold;
    this.players = players;
  }

  msg = {};
  player = {};

  censoredPlayersInfo(players) {
    if (!players) return {};
    //const {}
    const censoredPlayers = JSON.parse(JSON.stringify(players));
    censoredPlayers.forEach((player) => {
      delete player.cards; // Eliminar el campo "cards"
    });
    return censoredPlayers;
  }

  playerPuplic(player) {
    if (!player) return {};
    const { id: playerId, name: playerName } = player;
    const chips = player.getChips();
    const currentBet = player.getCurrentBet();
    return { playerId, playerName, chips, currentBet };
  }
  playerPrivate(player) {
    if (!player) return {};
    const { id: playerId, name: playerName } = player;
    const privateCards = player.getCards();
    const chips = player.getChips();
    const currentBet = player.getCurrentBet();
    return { playerId, playerName, privateCards, chips, currentBet };
  }

  msgBuilder(action, type, player, data) {
    const pot = this.pot;
    const players = this.players;
    let playerInfo;
    if (type == "private") {
      playerInfo = this.playerPrivate(player);
    } else if (type == "public") {
      playerInfo = this.playerPuplic(player);
    }

    ///For Players/System
    this.msg = {
      action,
      type,
      pot,
      playerInfo,
      data,
      stepChecker: this.stepChecker.getChecker(),
      players: this.censoredPlayersInfo(players),
    };

    ///For OsoLog
    this.fullInfo = {
      action,
      type,
      pot,
      Info: this.playerPrivate(player),
      data,
      stepChecker: this.stepChecker.getChecker(),
      players: this.censoredPlayersInfo(players),
    };
  }

  getMsg() {
    return this.msg;
  }

  getFullInfo() {
    return this.fullInfo;
  }
}
module.exports = Communicator;
