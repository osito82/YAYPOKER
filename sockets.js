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
      console.log(`Usuario ${name} se ha reconectado.`);
    } else {
      torneoSockets.push(socket);
      console.log(`Nuevo usuario ${name} ha sido agregado.`);
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
        console.log(`Usuario ${socket.name} ha sido eliminado.`);
      } else {
        console.log(`Usuario ${socket.name} no encontrado en el torneo.`);
      }
    } else {
      console.log(`Torneo con ID ${idTorneo} no encontrado.`);
    }
  }

  static getSockets() {
    return this.torneoSockets;
  }


  static getSocketByTorneo(idTorneo) {
    const torneoSockets = this.torneoSockets.get(idTorneo);
    if (torneoSockets) {
      return torneoSockets
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
