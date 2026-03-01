class Socket {
  static torneoSockets = new Map() // Map<idTorneo, Map<name, socket>>

  static addSocket(socket, idTorneo) {
    const { id, name } = socket

    if (!this.torneoSockets.has(idTorneo)) {
      this.torneoSockets.set(idTorneo, new Map())
    }

    const torneoSockets = this.torneoSockets.get(idTorneo)

    if (torneoSockets.has(name)) {
      torneoSockets.set(name, socket)
      console.log(`Socket - addSocket - Reconnected - ${name} - ${id}`)
    } else {
      torneoSockets.set(name, socket)
      console.log(`Socket - addSocket - Connected - ${name} - ${id}.`)
    }
  }

  static removeSocket(socket, idTorneo) {
    const torneoSockets = this.torneoSockets.get(idTorneo)
    if (torneoSockets?.has(socket.name)) {
      torneoSockets.delete(socket.name)
      console.log(
        `Socket - removeSocket - Removed - ${socket.name} - ${socket.id}.`,
      )
    } else if (torneoSockets) {
      console.log(
        `Socket - removeSocket - Not Found in Torneo - ${socket.name} - ${socket.id}.`,
      )
    } else {
      console.log(
        `Socket - removeSocket - Not Found - ${socket.name} - ${socket.id}.`,
      )
    }
  }

  static getSockets() {
    return this.torneoSockets
  }

  static getSocketsByTorneo(idTorneo) {
    const torneoSockets = this.torneoSockets.get(idTorneo)
    return torneoSockets ? Array.from(torneoSockets.values()) : null
  }

  static getSocket(idTorneo, id) {
    const torneoSockets = this.torneoSockets.get(idTorneo)
    if (torneoSockets) {
      return Array.from(torneoSockets.values()).find((socket) => socket.id === id)
    }
    return null
  }

  static socketExists(idTorneo, id) {
    const torneoSockets = this.torneoSockets.get(idTorneo)
    if (torneoSockets) {
      return Array.from(torneoSockets.values()).some((socket) => socket.id === id)
    }
    return false
  }
}

module.exports = Socket