// socket.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
const Socket = require('../sockets')

describe('Socket Manager', () => {
  const torneoId = 'torneo-test'
  const socket1 = {
    id: '1',
    name: 'Alice',
    secretCode: '1111',
    socket: { send: vi.fn(), readyState: 1 },
  }
  const socket2 = {
    id: '2',
    name: 'Bob',
    secretCode: '2222',
    socket: { send: vi.fn(), readyState: 1 },
  }

  beforeEach(() => {
    Socket.torneoSockets.clear()
    vi.clearAllMocks()
  })

  it('should add a new socket', () => {
    Socket.addSocket(socket1, torneoId)
    const sockets = Socket.getSocketsByTorneo(torneoId)
    expect(sockets.size).toBe(1)
    expect(sockets.get('1')).toEqual(socket1)
  })

  it('should replace socket on reconnection', () => {
    Socket.addSocket(socket1, torneoId)
    const socket1New = {
      id: '3',
      name: 'Alice',
      secretCode: '1111',
      socket: { send: vi.fn(), readyState: 1 },
    }
    Socket.addSocket(socket1New, torneoId)

    const sockets = Socket.getSocketsByTorneo(torneoId)
    expect(sockets.size).toBe(1)
    expect(sockets.get('3')).toEqual(socket1New)
    expect(sockets.has('1')).toBe(false)
  })

  it('should remove a socket', () => {
    Socket.addSocket(socket1, torneoId)
    Socket.addSocket(socket2, torneoId)
    Socket.removeSocket(socket1, torneoId)

    const sockets = Socket.getSocketsByTorneo(torneoId)
    expect(sockets.size).toBe(1)
    expect(sockets.get('2')).toEqual(socket2)
    expect(sockets.has('1')).toBe(false)
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

  describe('sendToPlayer', () => {
    it('should send data to a specific player', () => {
      Socket.addSocket(socket1, torneoId)
      const data = { action: 'test' }
      Socket.sendToPlayer(torneoId, '1111', data)

      expect(socket1.socket.send).toHaveBeenCalledWith(
        JSON.stringify({ message: data }),
      )
    })

    it('should not send data if socket is not open', () => {
      const closedSocket = {
        id: '4',
        name: 'Dave',
        secretCode: '4444',
        socket: { send: vi.fn(), readyState: 3 },
      } // 3 is CLOSED
      Socket.addSocket(closedSocket, torneoId)
      Socket.sendToPlayer(torneoId, '4444', { action: 'test' })

      expect(closedSocket.socket.send).not.toHaveBeenCalled()
    })
  })

  describe('broadcastToTorneo', () => {
    it('should send data to all players in a torneo', () => {
      Socket.addSocket(socket1, torneoId)
      Socket.addSocket(socket2, torneoId)
      const data = { action: 'broadcast' }
      Socket.broadcastToTorneo(torneoId, data)

      expect(socket1.socket.send).toHaveBeenCalledWith(
        JSON.stringify({ message: data }),
      )
      expect(socket2.socket.send).toHaveBeenCalledWith(
        JSON.stringify({ message: data }),
      )
    })
  })
})
