class Socket {
  static torneoSockets = new Map();

  static addSocket(socket, idTorneo) {
    const { id, name } = socket;

    if (!this.torneoSockets.has(idTorneo)) {
      this.torneoSockets.set(idTorneo, []);
    }

    const torneoSockets = this.torneoSockets.get(idTorneo);
    const existingSocketIndex = torneoSockets.findIndex((s) => s.name === name);

    if (existingSocketIndex !== -1) {
      torneoSockets[existingSocketIndex] = socket;
      console.log(`Socket - addSocket - Reconnected - ${name} - ${id}`);
    } else {
      torneoSockets.push(socket);
      console.log(`Socket - addSocket - Connected - ${name} - ${id}.`);
    }
  }

  static removeSocket(socket, idTorneo) {
    if (this.torneoSockets.has(idTorneo)) {
      const torneoSockets = this.torneoSockets.get(idTorneo);
      const socketIndex = torneoSockets.findIndex(
        (s) => s.name === socket.name
      );

      if (socketIndex !== -1) {
        torneoSockets.splice(socketIndex, 1);
        console.log(
          `Socket - removeSocket - Removed - ${socket.name} - ${socket.id}.`
        );
      } else {
        console.log(
          `Socket - removeSocket - Not Found in Torneo - ${socket.name} - ${socket.id}.`
        );
      }
    } else {
      console.log(
        `Socket - removeSocket - Not Found - ${socket.name} - ${socket.id}.`
      );
      //console.log(`Torneo con ID ${idTorneo} no encontrado.`);
    }
  }

  static getSockets() {
    return this.torneoSockets;
  }

  static getSocketsByTorneo(idTorneo) {
    const torneoSockets = this.torneoSockets.get(idTorneo);
    if (torneoSockets) {
      return torneoSockets;
    }
    return null;
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
