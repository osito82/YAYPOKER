<template>
  <div class="w-full sm:w-full md:w-full p-3 flex flex-col sm:flex-col bg-fuchsia-500">
    <form
      class="flex flex-row items-center justify-between space-x-3"
      @submit.prevent="submitForm"
    >
      <div class="form-group">
        <label for="playerName" class="text-lg mb-2 mr-1 ml-4">Player Name:</label>
        <input
          maxlength="20"
          type="text"
          :disabled="pokerStore.getConnected"
          id="playerName"
          v-model="gameCredentials.playerName"
          class="p-2 text-lg"
        />
      </div>

      <div class="form-group">
        <label for="secretCode" class="text-lg mb-2 mr-2">Secret Code:</label>
        <input
          maxlength="20"
          type="password"
          :disabled="pokerStore.getConnected"
          id="secretCode"
          v-model="gameCredentials.secretCode"
          class="p-2 text-lg"
        />
      </div>

      <div class="flex items-center">
        <button
          :disabled="pokerStore.getConnected"
          @click="connect(true, 'newGame')"
          class="p-2 text-sm bg-blue-500 text-white"
        >
          New Game
        </button>
      </div>

      <div class="form-group">
        <label for="gameCode" class="text-lg mb-2 mr-2">Game Code:</label>
        <input
          maxlength="20"
          id="gameCode"
          :disabled="pokerStore.getConnected"
          v-model="gameCredentials.gameCode"
          class="p-2 text-lg"
        />
      </div>

      <div class="flex items-center">
        <button
          :disabled="pokerStore.getConnected || gameCredentials.gameCode === ''"
          @click="connect(true, 'joinGame')"
          class="p-2 text-sm bg-blue-500 text-white"
        >
          Join a Game
        </button>
      </div>

      <div class="flex items-center">
        <button
          @click="connect(false, 'exitGame')"
          class="p-2 text-sm bg-blue-500 text-white"
        >
          Exit Game
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, onBeforeUnmount } from "vue";
import { generateUniqueId } from "../vutils.js";
import { useRoute } from "vue-router";
import router from "../router";
import useSockets from "../use/useSockets";
import { usePokerStore } from "../store/pokerStore";
const route = useRoute();

const pokerStore = usePokerStore();

const gameCredentials = reactive({
  playerName: "",
  secretCode: "",
  gameCode: "",
});

const submitForm = () => {
  console.log("gameCredentials:", gameCredentials);
};

watch(gameCredentials, (newGameCredentials) => {
  pokerStore.setGameCredentials(
    newGameCredentials.gameCode,
    newGameCredentials.secretCode,
    newGameCredentials.playerName
  );

  localStorage.setItem("gameCode", newGameCredentials.gameCode);
  localStorage.setItem("secretCode", newGameCredentials.secretCode);
  localStorage.setItem("playerName", newGameCredentials.playerName);
});

const connect = (onOff, type = "newGame") => {
  if (type == "newGame") {
    gameCredentials.gameCode = generateUniqueId(10);
  }

  const { socket, connectSocket, disconnectSocket, sendMessage } = useSockets(
    `ws://localhost:8888`,
    gameCredentials
  );

  if (!onOff) {
    disconnectSocket();
    pokerStore.setConnected(false);
    return;
  }

  router.push({
    name: "game",
    params: { gameCode: gameCredentials.gameCode },
  });

  connectSocket();

  pokerStore.setConnected(true);
  pokerStore.setGameCredentials(
    gameCredentials.gameCode,
    gameCredentials.secretCode,
    gameCredentials.playerName
  );
};

onMounted(() => {
  const gameCodeLS = localStorage.getItem("gameCode");
  const secretCodeLS = localStorage.getItem("secretCode");
  const playerNameLS = localStorage.getItem("playerName");

  gameCredentials.secretCode = secretCodeLS;
  gameCredentials.playerName = playerNameLS;
  gameCredentials.gameCode = gameCodeLS;

  gameCredentials.gameCode = route.params.gameCode;
});
</script>

<style scoped>
button:disabled {
  background-color: rgb(72, 72, 80);
}
</style>
