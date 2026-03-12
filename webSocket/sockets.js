class Socket {
  static torneoSockets = new Map() // Map<idTorneo, Map<secretCode, socket>>

  static addSocket(socket, idTorneo) {
    const { id, name, secretCode } = socket

    if (!this.torneoSockets.has(idTorneo)) {
      this.torneoSockets.set(idTorneo, new Map())
    }

    const torneoSockets = this.torneoSockets.get(idTorneo)

    if (torneoSockets.has(secretCode)) {
      torneoSockets.set(secretCode, socket)
      console.log(
        `Socket - addSocket - Reconnected - ${name} (${secretCode}) - ${id}`,
      )
    } else {
      torneoSockets.set(secretCode, socket)
      console.log(
        `Socket - addSocket - Connected - ${name} (${secretCode}) - ${id}.`,
      )
    }
  }

  static removeSocket(socket, idTorneo) {
    const torneoSockets = this.torneoSockets.get(idTorneo)
    if (torneoSockets?.has(socket.secretCode)) {
      torneoSockets.delete(socket.secretCode)
      console.log(
        `Socket - removeSocket - Removed - ${socket.name} (${socket.secretCode}) - ${socket.id}.`,
      )
    } else if (torneoSockets) {
      console.log(
        `Socket - removeSocket - Not Found in Torneo - ${socket.name} (${socket.secretCode}) - ${socket.id}.`,
      )
    } else {
      console.log(
        `Socket - removeSocket - Not Found - ${socket.name} (${socket.secretCode}) - ${socket.id}.`,
      )
    }
  }


  static getSocketsByTorneo(idTorneo) {
    return this.torneoSockets.get(idTorneo) || null
  }

  static getAllSockets() {
    const all = []
    for (const torneoMap of this.torneoSockets.values()) {
      for (const socket of torneoMap.values()) {
        all.push(socket)
      }
    }
    return all
  }

  static getSocket(idTorneo, id) {
    const torneoSockets = this.torneoSockets.get(idTorneo)
    if (!torneoSockets) return null

    for (const socket of torneoSockets.values()) {
      if (socket.id === id) return socket
    }
    return null
  }

  static socketExists(idTorneo, id) {
    const torneoSockets = this.torneoSockets.get(idTorneo)
    if (!torneoSockets) return false

    for (const socket of torneoSockets.values()) {
      if (socket.id === id) return true
    }
    return false
  }

  static sendToPlayer(idTorneo, secretCode, data) {
    const torneoSockets = this.getSocketsByTorneo(idTorneo)
    if (!torneoSockets) return

    const playerSocketWrapper = torneoSockets.get(secretCode)

    if (
      playerSocketWrapper &&
      playerSocketWrapper.socket &&
      playerSocketWrapper.socket.readyState === 1
    ) {
      playerSocketWrapper.socket.send(JSON.stringify({ message: data }))
    } else {
      console.log(`Socket not found or invalid for secretCode: ${secretCode}`)
    }
  }

  static broadcastToTorneo(idTorneo, data) {
    const torneoSockets = this.getSocketsByTorneo(idTorneo)
    if (!torneoSockets) return

    for (const socketWrapper of torneoSockets.values()) {
      if (
        socketWrapper &&
        socketWrapper.socket &&
        socketWrapper.socket.readyState === 1
      ) {
        socketWrapper.socket.send(JSON.stringify({ message: data }))
      }
    }
  }
}

module.exports = Socket
