<!-- src/components/MyForm.vue -->
<template>
  <form class="my-form" @submit.prevent="submitForm">
    <div class="form-group">
      <label for="name">Name:</label>
      <input type="text" id="name" v-model="name" />
    </div>

    <div class="form-group">
      <label for="secretCode">Secret Code:</label>
      <input type="password" id="secretCode" v-model="secretCode" />
    </div>

    <div class="button-group">
      <button @click="startGame">New Game</button>
    </div>

    <div class="form-group">
      <label for="gameCode">Game Code:</label>
      <input id="gameCode" v-model="gameCode" />
    </div>

    <div class="button-group">
      <button type="submit">Join a Game</button>
    </div>
  </form>
</template>

<script setup>
import { ref } from "vue";
import { generateUniqueId } from "../vutils.js";
import router from "../router";
import { usePokerStore } from "../store/pokerStore";

const pokerStore = usePokerStore();

let name = ref("");
let secretCode = ref("");
let gameCode = ref("");

//let stateOne = ref("1");
//let stateTwo = ref("2");

const submitForm = () => {
  console.log("Name:", name.value);
  console.log("Secret Code:", secretCode.value);
  console.log("Game Code:", gameCode.value);
};

const startGame = () => {
  gameCode.value = generateUniqueId(10);
  pokerStore.setGameCode(gameCode.value);

  router.push({ name: "game", params: { gameCode: pokerStore.getGameCode } });
};
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
