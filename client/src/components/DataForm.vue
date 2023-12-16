<!-- src/components/MyForm.vue -->
<template>
  <form class="my-form" @submit.prevent="submitForm">
    <div class="form-group">
      <label for="playerName">Player Name:</label>
      <input type="text" id="playerName" v-model="gameCredentials.playerName" />
    </div>

    <div class="form-group">
      <label for="secretCode">Secret Code:</label>
      <input type="password" id="secretCode" v-model="gameCredentials.secretCode" />
    </div>

    <div class="button-group">
      <button @click="startGame">New Game</button>
    </div>

    <div class="form-group">
      <label for="gameCode">Game Code:</label>
      <input id="gameCode" v-model="gameCredentials.gameCode" />
    </div>

    <div class="button-group">
      <button type="submit">Join a Game</button>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from "vue";
import { generateUniqueId } from "../vutils.js";
import { useRoute } from "vue-router";
import router from "../router";
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
});

const startGame = () => {
  gameCode.value = generateUniqueId(10);
  pokerStore.setGameCredentials(gameCode.value, secretCode.value, playerName.value);

  router.push({
    name: "game",
    params: { gameCode: pokerStore.getGameCredentials.gameCode },
  });
};

onMounted(() => {
  const gameCode = route.params.gameCode;
    gameCredentials.gameCode = gameCode;
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

.button-group {
  margin-top: 10px;
}

button {
  margin-left: 10px;
  padding: 9px;
  font-size: 16px;
}
</style>
