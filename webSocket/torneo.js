class Torneo {
  static torneos = new Map()

  static getTorneos() {
    return this.torneos
  }

  static addMatch(match, idTorneo) {
    if (!this.torneos.has(idTorneo)) {
      this.torneos.set(idTorneo, [])
    }

    const torneoMatches = this.torneos.get(idTorneo)

    const matchExists = torneoMatches.some(
      (existingMatch) => existingMatch.gameId === match.gameId,
    )

    if (!matchExists) {
      const nuevaLista = [...torneoMatches, match]
      this.torneos.set(idTorneo, nuevaLista)
    } else {
      console.warn(
        `El partido con ID ${match.gameId} ya existe en el torneo ${idTorneo}. No se añadió duplicado.`,
      )
    }
  }

  static getMatch(idTorneo) {
    const torneoMatches = this.torneos.get(idTorneo)

    if (torneoMatches && torneoMatches.length > 0) {
      return torneoMatches[0]
    }
    return null
  }

  static torneoExists(idTorneo) {
    return this.torneos.has(idTorneo)
  }
}

module.exports = Torneo
