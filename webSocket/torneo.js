const osolog = require('osolog')
const log = new osolog()

class Torneo {
  static torneos = new Map()

  static getTorneos() {
    return this.torneos
  }

  static getAllTournaments() {
    return Array.from(this.torneos.keys())
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

  static removeInactiveMatches(maxIdleTimeMs = 3600000) {
    // 1 hora por defecto
    const now = Date.now()
    let removedCount = 0

    for (const [idTorneo, matches] of this.torneos.entries()) {
      const activeMatches = matches.filter((match) => {
        const idleTime = now - (match.lastActivity || 0)
        const isInactive = idleTime > maxIdleTimeMs

        // También limpiar si no hay jugadores y ha pasado un tiempo prudencial (ej. 10 min)
        const hasNoPlayers = !match.players || match.players.length === 0
        const isAbandoned = hasNoPlayers && idleTime > 600000

        if (isInactive || isAbandoned) {
          removedCount++
          return false
        }
        return true
      })

      if (activeMatches.length === 0) {
        this.torneos.delete(idTorneo)
      } else if (activeMatches.length !== matches.length) {
        this.torneos.set(idTorneo, activeMatches)
      }
    }

    if (removedCount > 0) {
      log
        .Template({ name: 'brakets', title: 'TORNEO:CLEANUP', date: true })
        .R({
          removedMatches: removedCount,
          remainingTorneos: this.torneos.size,
        })
    }

    return removedCount
  }
}

module.exports = Torneo
