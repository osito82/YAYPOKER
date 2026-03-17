import { ref, onBeforeUnmount } from 'vue'
import { usePokerStore } from '../store/pokerStore'
import log from '../logger'

export default function useWebSocket(url, options) {
  const socketUrl = new URL(url)
  if (options) {
    Object.keys(options).forEach((key) => {
      socketUrl.searchParams.set(key, options[key])
    })
  }

  const socket = ref(null)
  const reconnectTimeout = ref(null)
  const isManuallyClosed = ref(false)
  const pokerStore = usePokerStore()

  const connectSocket = () => {
    if (
      socket.value &&
      (socket.value.readyState === WebSocket.OPEN ||
        socket.value.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    isManuallyClosed.value = false
    socket.value = new WebSocket(socketUrl)

    socket.value.addEventListener('open', () => {
      log.Template({ title: 'SOCKET:OPEN', date: true }).R({ msg: 'Conexión establecida' })
      pokerStore.setConnected(true)
      if (reconnectTimeout.value) {
        clearTimeout(reconnectTimeout.value)
        reconnectTimeout.value = null
      }

      sendMessage({
        action: 'signUp',
        totalChips: 1000,
      })
    })

    socket.value.addEventListener('message', (event) => {
      pokerStore.setSocketMessage(event.data)
    })

    socket.value.addEventListener('close', () => {
      log.Template({ title: 'SOCKET:CLOSE', date: true }).R({ msg: 'Conexión cerrada' })
      pokerStore.setConnected(false)

      if (!isManuallyClosed.value) {
        attemptReconnect()
      }
    })

    socket.value.addEventListener('error', (error) => {
      log.Template({ title: 'SOCKET:ERROR', date: true }).R({ error: error.message || 'Error desconocido' })
      pokerStore.setConnected(false)
      // The close event will follow and trigger reconnection if needed
    })
  }

  const attemptReconnect = () => {
    if (reconnectTimeout.value) return

    log.Template({ title: 'SOCKET:RECONNECT', date: true }).R({ msg: 'Intentando reconectar en 3 segundos...' })
    reconnectTimeout.value = setTimeout(() => {
      reconnectTimeout.value = null
      connectSocket()
    }, 3000)
  }

  const disconnectSocket = () => {
    isManuallyClosed.value = true
    if (reconnectTimeout.value) {
      clearTimeout(reconnectTimeout.value)
      reconnectTimeout.value = null
    }
    if (socket.value) {
      socket.value.close()
    }
    pokerStore.setConnected(false)
  }

  const sendMessage = (message) => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(message))
    } else {
      log.Template({ title: 'SOCKET:SEND_ERROR', date: true }).R({ msg: 'Error: Socket no está abierto.' })
    }
  }

  onBeforeUnmount(() => {
    disconnectSocket()
  })

  return {
    socket,
    connectSocket,
    disconnectSocket,
    sendMessage,
  }
}
