class Socket {
  static torneoSockets = new Map();

  static addSocket(socket, idTorneo) {
    if (!this.torneoSockets.has(idTorneo)) {
      this.torneoSockets.set(idTorneo, []);
    }

    this.torneoSockets.get(idTorneo).push(socket);
  }

  static getSockets() {
    return this.torneoSockets;
  }

  static getSocket(idTorneo, id) {
    const torneoSockets = this.torneoSockets.get(idTorneo);
    if (torneoSockets) {
      return torneoSockets.find((socket) => socket.id === id);
    }
    return null;
  }

  static socketExists(idTorneo, id) {
    const torneoSockets = this.torneoSockets.get(idTorneo);
    if (torneoSockets) {
      return torneoSockets.some((socket) => socket.id === id);
    }
    return false;
  }
}

module.exports = Socket;
