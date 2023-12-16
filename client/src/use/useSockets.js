import { ref, onMounted, onBeforeUnmount } from "vue";
import { usePokerStore } from "../store/pokerStore";

export default function useWebSocket(url, options) {
  ///////////////////////////////////////////////////////////

  const socketUrl = new URL(url);
  if (options) {
    console.log(options);
    Object.keys(options).forEach((key) => {
      socketUrl.searchParams.set(key, options[key]);
    });
  }

  const socket = ref(null);

  const pokerStore = usePokerStore();

  const connectSocket = () => {
    socket.value = new WebSocket(socketUrl);

    socket.value.addEventListener("open", () => {
      console.log("Conection is stablished");
    });

    socket.value.addEventListener("message", (event) => {
      console.log("Mensaje recibido:", event.data);
    });
  };

  const disconnectSocket = () => {
    if (socket.value) {
      socket.value.close();
    }
  };


  return {
    socket,
    connectSocket,
    disconnectSocket,
  };
}
