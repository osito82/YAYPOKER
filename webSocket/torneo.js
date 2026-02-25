class Torneo {
  static torneos = new Map();

  static getTorneos() {
    return this.torneos;
  }

  static addMatch(match, idTorneo) {
    // Solo guardamos un match por torneo por ahora para simplificar
    if (!this.torneos.has(idTorneo)) {
      this.torneos.set(idTorneo, match);
      console.log(`Torneo ${idTorneo} creado con match ${match.gameId}`);
    }
  }

  static getMatch(idTorneo) {
    return this.torneos.get(idTorneo);
  }

  static torneoExists(idTorneo) {
    return this.torneos.has(idTorneo);
  }
}

module.exports = Torneo;
