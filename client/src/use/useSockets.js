import { ref, toRaw, onBeforeUnmount } from 'vue'
import { usePokerStore } from '../store/pokerStore'
import { getSessionToken } from './sessionToken'

export default function useWebSocket(url, options) {
  const socketUrl = new URL(url)
  if (options) {
    Object.keys(options).forEach((key) => {
      socketUrl.searchParams.set(key, options[key])
    })
  }

  const socket = ref(null)
  const reconnectTimeout = ref(null)
  const reconnectAttempts = ref(0)
  const hasConnected = ref(false)
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
    // Reconnect to the table the server actually seated us at (public tables
    // may differ from the requested code) with our session token (OPS-001)
    if (socketUrl.searchParams.get('role') !== 'guest') {
      if (pokerStore.torneoId) {
        socketUrl.searchParams.set('gameCode', pokerStore.torneoId)
      }
      const token = getSessionToken(socketUrl.searchParams.get('gameCode'))
      if (token) socketUrl.searchParams.set('sessionToken', token)
      else socketUrl.searchParams.delete('sessionToken')
    }
    const ws = new WebSocket(socketUrl)
    socket.value = ws

    socket.value.addEventListener('open', () => {
      if (isDestroyed.value) {
        socket.value.close()
        return
      }
      pokerStore.setConnected(true)
      hasConnected.value = true
      reconnectAttempts.value = 0
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

    socket.value.addEventListener('close', (event) => {
      // A late close from a socket we already replaced (e.g. the one closed
      // when the page entered the back/forward cache) must not touch state
      if (socket.value && toRaw(socket.value) !== ws) return
      console.log('Conexión cerrada')
      pokerStore.setConnected(false)

      // 4000: the seat was taken by a newer connection (another tab or
      // device). Reconnecting would steal it back and forth.
      if (event?.code === 4000) {
        isManuallyClosed.value = true
        pokerStore.setLastError({
          type: 'SESSION_REPLACED',
          message: 'This seat is now open in another tab or device.',
        })
        return
      }

      if (!isManuallyClosed.value && !isDestroyed.value) {
        attemptReconnect()
      }
    })

    socket.value.addEventListener('error', (error) => {
      console.error('Error en la conexión del socket:', error)
      pokerStore.setConnected(false)
    })
  }

  // Exponential backoff with jitter (1s, 2s, 4s… capped at 15s) so a server
  // restart does not get every client reconnecting in the same instant.
  const attemptReconnect = () => {
    if (reconnectTimeout.value || isDestroyed.value) return

    const base = Math.min(15000, 1000 * 2 ** reconnectAttempts.value)
    const delay = base / 2 + Math.random() * (base / 2)
    reconnectAttempts.value++
    reconnectTimeout.value = setTimeout(() => {
      reconnectTimeout.value = null
      if (!isDestroyed.value) connectSocket()
    }, delay)
  }

  // Back online or back to the tab: reconnect now instead of waiting
  const reconnectNow = () => {
    if (isDestroyed.value || isManuallyClosed.value) return
    if (socket.value && socket.value.readyState === WebSocket.OPEN) return
    if (reconnectTimeout.value) {
      clearTimeout(reconnectTimeout.value)
      reconnectTimeout.value = null
    }
    reconnectAttempts.value = 0
    connectSocket()
  }
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') reconnectNow()
  }
  // Leaving the page. If it goes into the back/forward cache (persisted) it
  // may come back: close the socket but keep the composable alive so
  // `pageshow` can reconnect. Otherwise the page is gone for good.
  const onPageHide = (event) => {
    if (!event?.persisted) {
      disconnectSocket()
      return
    }
    isManuallyClosed.value = true
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
  const onPageShow = (event) => {
    if (!event?.persisted || isDestroyed.value) return
    isManuallyClosed.value = false
    reconnectNow()
  }
  window.addEventListener('online', reconnectNow)
  window.addEventListener('pagehide', onPageHide)
  window.addEventListener('pageshow', onPageShow)
  document.addEventListener('visibilitychange', onVisibilityChange)

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
    window.removeEventListener('online', reconnectNow)
    window.removeEventListener('pagehide', onPageHide)
    window.removeEventListener('pageshow', onPageShow)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }

  const sendMessage = (message) => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(message))
      return true
    }
    return false
  }

  onBeforeUnmount(() => {
    disconnectSocket()
  })

  return {
    socket,
    hasConnected,
    connectSocket,
    disconnectSocket,
    sendMessage,
  }
}
