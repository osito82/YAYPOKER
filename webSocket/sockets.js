const log = require('./logger')

class Socket {
  static torneoSockets = new Map() // Map<idTorneo, Map<socketId, socketWrapper>>
  static log = log

  // Registers a connection. It never evicts another socket: two players may
  // share a PIN, and taking a seat over is decided in MatchLobby.signUp with
  // the session token (OPS-001).
  static addSocket(socket, idTorneo) {
    const { id, name } = socket

    if (!this.torneoSockets.has(idTorneo)) {
      this.torneoSockets.set(idTorneo, new Map())
    }
    this.torneoSockets.get(idTorneo).set(id, socket)

    this.log
      .Template({
        name: 'brakets',
        title: 'SERVER:NEW_CONNECTION',
        date: true,
      })
      .R({ playerName: name, id, tournament: idTorneo })
  }

  static removeSocket(socket, idTorneo) {
    const torneoSockets = this.torneoSockets.get(idTorneo)
    if (torneoSockets?.has(socket.id)) {
      torneoSockets.delete(socket.id)
      this.log
        .Template({
          name: 'brakets',
          title: 'SERVER:DISCONNECTION',
          date: true,
        })
        .R({
          playerName: socket.name,
          id: socket.id,
          tournament: idTorneo,
        })
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
    return torneoSockets.get(id) || null
  }

  static socketExists(idTorneo, id) {
    const torneoSockets = this.torneoSockets.get(idTorneo)
    return !!torneoSockets?.has(id)
  }

  // Private message to a seated player, routed by their current socket
  static sendToPlayer(idTorneo, player, data) {
    if (!player?.id) return
    this.sendToSocketId(idTorneo, player.id, data)
  }

  static sendToSocketId(idTorneo, socketId, data) {
    const socketWrapper = this.getSocket(idTorneo, socketId)
    if (
      socketWrapper &&
      socketWrapper.socket &&
      socketWrapper.socket.readyState === 1
    ) {
      socketWrapper.socket.send(JSON.stringify({ message: data }))
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
