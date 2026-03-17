const log = require('./logger')

class Socket {
  static torneoSockets = new Map() // Map<idTorneo, Map<secretCode, socket>>
  static log = log

  static addSocket(socket, idTorneo) {
    const { id, name, secretCode } = socket

    if (!this.torneoSockets.has(idTorneo)) {
      this.torneoSockets.set(idTorneo, new Map())
    }

    const torneoSockets = this.torneoSockets.get(idTorneo)

    if (torneoSockets.has(secretCode)) {
      torneoSockets.set(secretCode, socket)
      this.log
        .Template({ name: 'brakets', title: 'SERVER:RECONNECTED', date: true })
        .R({ playerName: name, id, torneo: idTorneo, secretCode })
    } else {
      torneoSockets.set(secretCode, socket)
      this.log
        .Template({
          name: 'brakets',
          title: 'SERVER:NEW_CONNECTION',
          date: true,
        })
        .R({ playerName: name, id, torneo: idTorneo, secretCode })
    }
  }

  static removeSocket(socket, idTorneo) {
    const torneoSockets = this.torneoSockets.get(idTorneo)
    if (torneoSockets?.has(socket.secretCode)) {
      torneoSockets.delete(socket.secretCode)
      this.log
        .Template({
          name: 'brakets',
          title: 'SERVER:DISCONNECTION',
          date: true,
        })
        .R({
          playerName: socket.name,
          id: socket.id,
          torneo: idTorneo,
          secretCode: socket.secretCode,
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
    }
  }

  static sendToSocketId(idTorneo, socketId, data) {
    const torneoSockets = this.getSocketsByTorneo(idTorneo)
    if (!torneoSockets) return

    for (const socketWrapper of torneoSockets.values()) {
      if (socketWrapper.id === socketId) {
        if (socketWrapper.socket && socketWrapper.socket.readyState === 1) {
          socketWrapper.socket.send(JSON.stringify({ message: data }))
        }
        break
      }
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
