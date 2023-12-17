<script setup>
import { usePokerStore } from "../store/pokerStore";
const pokerStore = usePokerStore();
import DataForm from "../components/DataForm.vue";
import { ref } from "vue";

defineProps({
  msg: String,
});

const count = ref(0);
</script>

<template>
  <div id="logo" class="bg-red-400 flex flex-row">
    <div class="w-1/5 sm:w-1/4 md:w-1/5 pt-4 px-2 bg-yellow-300">
      <h1>Oso Poker</h1>
    </div>
    <div id="banner" class="w-full sm:w-full md:w-full bg-blue-300">
      <DataForm />
    </div>
  </div>

  {{ pokerStore.getGameCredentials }}
</template>

<style scoped>
.logo {
  padding: 1em;
  background-color: blueviolet;
}
</style>
