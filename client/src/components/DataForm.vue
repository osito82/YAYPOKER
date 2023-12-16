<template>
  {{ pokerStore.getConnected }}
  <form class="my-form" @submit.prevent="submitForm">
    <div class="flex flex-row">
      <div class="form-group">
        <label for="playerName">Player Name:</label>
        <input
          type="text"
          :disabled="pokerStore.getConnected"
          id="playerName"
          v-model="gameCredentials.playerName"
        />
      </div>

      <div class="form-group">
        <label for="secretCode">Secret Code:</label>
        <input
          type="password"
          :disabled="pokerStore.getConnected"
          id="secretCode"
          v-model="gameCredentials.secretCode"
        />
      </div>

      <div class="button-group">
        <button :disabled="pokerStore.getConnected" @click="connect(true, 'newGame')">
          New Game
        </button>
      </div>

      <div class="form-group">
        <label for="gameCode">Game Code:</label>
        <input
          id="gameCode"
          :disabled="pokerStore.getConnected"
          v-model="gameCredentials.gameCode"
        />
      </div>

      <div class="button-group">
        <button
          :disabled="pokerStore.getConnected || gameCredentials.gameCode == ''"
          @click="connect(true, 'joinGame')"
        >
          Join a Game
        </button>
      </div>
    </div>

    <div class="flex flex-row">
      <div class="button-group">
        <button @click="connect(false, 'exitGame')">Exit Game</button>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch, onBeforeUnmount } from "vue";
import { generateUniqueId } from "../vutils.js";
import { useRoute } from "vue-router";
import router from "../router";
import useSockets from "../use/useSockets";
import { usePokerStore } from "../store/pokerStore";
const route = useRoute();

const pokerStore = usePokerStore();

const isConnected = ref(false);
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

onBeforeUnmount(() => {});

const connect = (onOff, type = "newGame") => {
  //console.log(onOff), 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

  //if (gameCredentials.gameCode == "") gameCredentials.gameCode = generateUniqueId(10);

  if (type == "newGame") {
    gameCredentials.gameCode = generateUniqueId(10);
  }

  const { socket, connectSocket, disconnectSocket } = useSockets(
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
});
</script>

<style scoped>
.my-form {
  display: flex;
  flex-direction: row;
  align-items: baseline;
}

.form-group {
  margin-bottom: 10px;
}

label {
  font-size: 18px;
  margin-bottom: 5px;
  margin-right: 10px;
  margin-left: 15px;
}

input {
  padding: 8px;
  font-size: 16px;
}

button {
  margin-left: 10px;
  padding: 9px;
  font-size: 16px;
  background-color: blue;
}

button:disabled {

  background-color: rgb(72, 72, 80);
}
</style>
