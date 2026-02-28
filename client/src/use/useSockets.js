import { ref } from 'vue'
import { usePokerStore } from '../store/pokerStore'

export default function useWebSocket(url, options) {
  const socketUrl = new URL(url)
  if (options) {
    console.log(options)
    Object.keys(options).forEach((key) => {
      socketUrl.searchParams.set(key, options[key])
    })
  }

  const socket = ref(null)

  const pokerStore = usePokerStore()

  const connectSocket = () => {
    socket.value = new WebSocket(socketUrl)

    socket.value.addEventListener('open', () => {
      console.log('Conexión establecida')
      pokerStore.setConnected(true)

      // Llamas a sendMessage después de que la conexión está establecida
      sendMessage({
        action: 'signUp',
        totalChips: 1000,
      })
    })

    socket.value.addEventListener('message', (event) => {
      console.log('Mensaje recibido:', event.data)
      pokerStore.setSocketMessage(event.data)
    })

    socket.value.addEventListener('close', () => {
      console.log('Conexión cerrada')
      pokerStore.setConnected(false)
    })

    socket.value.addEventListener('error', (error) => {
      handleSocketError(error)
      pokerStore.setConnected(false)
    })
  }

  const disconnectSocket = () => {
    if (socket.value) {
      socket.value.close()
      pokerStore.setConnected(false)
    }
  }

  const sendMessage = (message) => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(message))
      console.log('Mensaje enviado:', message)
    } else {
      console.error('Error: Socket no está abierto.')
    }
  }

  const handleSocketError = (error) => {
    console.error('Error en la conexión del socket:', error)
  }

  return {
    socket,
    connectSocket,
    disconnectSocket,
    sendMessage,
  }
}
