// socket.test.js
import { describe, it, expect, beforeEach } from 'vitest'
//import Socket from '../Socket.js' // asegúrate de la ruta correcta
const Socket = require('../sockets')

describe('Socket Manager', () => {
  const torneoId = 'torneo-test'
  const socket1 = { id: '1', name: 'Alice' }
  const socket2 = { id: '2', name: 'Bob' }

  beforeEach(() => {
    // limpiar todos los torneos antes de cada test
    Socket.torneoSockets.clear()
  })

  it('should add a new socket', () => {
    Socket.addSocket(socket1, torneoId)
    const sockets = Socket.getSocketsByTorneo(torneoId)
    expect(sockets).toHaveLength(1)
    expect(sockets[0]).toEqual(socket1)
  })

  it('should replace socket on reconnection', () => {
    Socket.addSocket(socket1, torneoId)
    const socket1New = { id: '3', name: 'Alice' }
    Socket.addSocket(socket1New, torneoId)

    const sockets = Socket.getSocketsByTorneo(torneoId)
    expect(sockets).toHaveLength(1)
    expect(sockets[0]).toEqual(socket1New)
  })

  it('should remove a socket', () => {
    Socket.addSocket(socket1, torneoId)
    Socket.addSocket(socket2, torneoId)
    Socket.removeSocket(socket1, torneoId)

    const sockets = Socket.getSocketsByTorneo(torneoId)
    expect(sockets).toHaveLength(1)
    expect(sockets[0]).toEqual(socket2)
  })

  it('should check if a socket exists', () => {
    Socket.addSocket(socket1, torneoId)
    expect(Socket.socketExists(torneoId, '1')).toBe(true)
    expect(Socket.socketExists(torneoId, '999')).toBe(false)
  })

  it('should get a socket by id', () => {
    Socket.addSocket(socket2, torneoId)
    const found = Socket.getSocket(torneoId, '2')
    expect(found).toEqual(socket2)
  })
})
