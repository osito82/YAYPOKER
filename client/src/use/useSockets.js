// socketComposable.js
import { ref, onMounted, onBeforeUnmount } from 'vue';

export default function useWebSocket(url) {
  const socket = ref(null);

  const connectSocket = () => {
    // Establecer conexión al WebSocket
    socket.value = new WebSocket(url);

    // Manejar eventos o realizar acciones adicionales al conectar
    // socket.value.addEventListener('message', (event) => {
    //   console.log('Mensaje recibido:', event.data);
    // });
  };

  const disconnectSocket = () => {
    // Cerrar la conexión del WebSocket cuando el componente se destruye
    if (socket.value) {
      socket.value.close();
    }
  };

  // Conectar el WebSocket cuando el componente se monta
  onMounted(() => {
    connectSocket();
  });

  // Desconectar el WebSocket cuando el componente se destruye
  onBeforeUnmount(() => {
    disconnectSocket();
  });

  return {
    socket,
    connectSocket,
    disconnectSocket,
  };
}
