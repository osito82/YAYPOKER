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
      // Si ya existe un socket con el mismo nombre, actualiza el socket
      torneoSockets[existingSocketIndex] = socket;
      console.log(`Usuario ${name} se ha reconectado.`);
    } else {
      // Si no existe, añade el nuevo socket
      torneoSockets.push(socket);
      console.log(`Nuevo usuario ${name} ha sido agregado.`);
    }
  }
//}

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
