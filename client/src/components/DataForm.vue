<!-- src/components/MyForm.vue -->
<template>
  <form @submit.prevent="submitForm">
    <label for="name">Name:</label>
    <input type="text" id="name" v-model="name" />

    <label for="secretCode">Secret Code:</label>
    <input type="password" id="secretCode" v-model="secretCode" />

    <button @click="startGame">New Game</button>

    <label for="gameCode">Game Code:</label>
    <input id="gameCode" v-model="gameCode" />

    <button type="submit">Join a Game</button>
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
