import { ref, onBeforeUnmount } from 'vue'
import { usePokerStore } from '../store/pokerStore'

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
  const isDestroyed = ref(false) // Flag definitivo
  const pokerStore = usePokerStore()

  const connectSocket = () => {
    if (isDestroyed.value) return // No conectar si ya se destruyó

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
      if (isDestroyed.value) {
        socket.value.close()
        return
      }
      console.log('Conexión establecida')
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
      if (isDestroyed.value) return
      pokerStore.setSocketMessage(event.data)
    })

    socket.value.addEventListener('close', () => {
      console.log('Conexión cerrada')
      pokerStore.setConnected(false)

      if (!isManuallyClosed.value && !isDestroyed.value) {
        attemptReconnect()
      }
    })

    socket.value.addEventListener('error', (error) => {
      console.error('Error en la conexión del socket:', error)
      pokerStore.setConnected(false)
    })
  }

  const attemptReconnect = () => {
    if (reconnectTimeout.value || isDestroyed.value) return

    console.log('Intentando reconectar en 3 segundos...')
    reconnectTimeout.value = setTimeout(() => {
      reconnectTimeout.value = null
      if (!isDestroyed.value) connectSocket()
    }, 3000)
  }

  const disconnectSocket = () => {
    isManuallyClosed.value = true
    isDestroyed.value = true // Marcar como destruido permanentemente
    if (reconnectTimeout.value) {
      clearTimeout(reconnectTimeout.value)
      reconnectTimeout.value = null
    }
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
    pokerStore.setConnected(false)
  }

  const sendMessage = (message) => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(message))
    } else {
      console.error('Error: Socket no está abierto.')
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
