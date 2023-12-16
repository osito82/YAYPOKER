<script setup>
import { usePokerStore } from "../store/pokerStore";
const pokerStore = usePokerStore();

import { ref } from 'vue'

defineProps({
  msg: String,
})

const count = ref(0)
</script>

<template>
  <h1 class="logo">Oso Poker</h1>

{{ pokerStore.getGameCredentials }}

</template>

<style scoped>




.logo {
  
  padding: 1em;
  background-color: blueviolet;

}

</style>
