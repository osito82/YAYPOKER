const log = require('./logger')

class Socket {
  static torneoSockets = new Map() // Map<idTorneo, Map<socketId, socketWrapper>>
  static log = log

  static addSocket(socket, idTorneo) {
    const { id, name, secretCode } = socket

    if (!this.torneoSockets.has(idTorneo)) {
      this.torneoSockets.set(idTorneo, new Map())
    }

    const torneoSockets = this.torneoSockets.get(idTorneo)

    // Handle re-connections based on secretCode:
    // If a socket already exists with the same secretCode, we remove it to make way for the new one.
    // This allows the player to "take over" their previous session.
    for (const [existingId, existingSocket] of torneoSockets.entries()) {
      if (existingSocket.secretCode === secretCode) {
        torneoSockets.delete(existingId)
        this.log
          .Template({
            name: 'brakets',
            title: 'SERVER:RECONNECTED',
            date: true,
          })
          .R({
            playerName: name,
            id,
            torneo: idTorneo,
            secretCode,
            replacedId: existingId,
          })
        break
      }
    }

    torneoSockets.set(id, socket)

    // If not a reconnection, it's a new connection
    if (!this.log.lastTitle?.includes('RECONNECTED')) {
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
    return torneoSockets.get(id) || null
  }

  static socketExists(idTorneo, id) {
    const torneoSockets = this.torneoSockets.get(idTorneo)
    return !!torneoSockets?.has(id)
  }

  static sendToPlayer(idTorneo, secretCode, data) {
    const torneoSockets = this.getSocketsByTorneo(idTorneo)
    if (!torneoSockets) return

    // Find the socket by secretCode
    let playerSocketWrapper = null
    for (const socket of torneoSockets.values()) {
      if (socket.secretCode === secretCode) {
        playerSocketWrapper = socket
        break
      }
    }

    if (
      playerSocketWrapper &&
      playerSocketWrapper.socket &&
      playerSocketWrapper.socket.readyState === 1
    ) {
      playerSocketWrapper.socket.send(JSON.stringify({ message: data }))
    }
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
