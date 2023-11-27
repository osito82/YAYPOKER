class Communicator {
  constructor(gameId, torneoId, pot, playerFold, stepChecker) {
    this.gameId = gameId;
    this.torneoId = torneoId;
    this.stepChecker = stepChecker;
    this.pot = pot;
    this.playerFold = playerFold;
  }

  msg = {};
  player = {};

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
    const cards = player.getCards();
    const chips = player.getChips();
    const currentBet = player.getCurrentBet();
    return { playerId, playerName, cards, chips, currentBet };
  }

  msgBuilder(action, type, player, data) {
    const pot = this.pot;
    let playerInfo;
    if (type == "private") {
      playerInfo = this.playerPrivate(player);
    } else if (type == "public") {
      playerInfo = this.playerPuplic(player);
    }

    this.msg = {
      action,
      type,
      pot,
      playerInfo,
      data,
      stepChecker: this.stepChecker.getChecker(),
    };
  }

  getMsgPlayer() {
    return this.msg;
  }
}
module.exports = Communicator;
