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
  return this.torneoSockets.get(idTorneo) || null
}static getSocket(idTorneo, id) {
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

  static sendToPlayer(idTorneo, playerName, data) {
    const torneoSockets = this.getSocketsByTorneo(idTorneo)
    if (!torneoSockets) return

    const playerSocketWrapper = torneoSockets.get(playerName)

    if (
      playerSocketWrapper &&
      playerSocketWrapper.socket &&
      playerSocketWrapper.socket.readyState === 1
    ) {
      playerSocketWrapper.socket.send(JSON.stringify({ message: data }))
    } else {
      console.log(`Socket not found or invalid for ${playerName}`)
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
