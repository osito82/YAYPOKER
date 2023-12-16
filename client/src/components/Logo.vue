<script setup>
import { usePokerStore } from "../store/pokerStore";
const pokerStore = usePokerStore();
import DataForm from "../components/DataForm.vue";
import { ref } from 'vue'

defineProps({
  msg: String,
})

const count = ref(0)
</script>

<template>

<div id="logo" class="bg-red-300 flex flex-row">

  <div class="w-full sm:w-1/3 md:w-1/4 pt-4 px-2 h-auto bg-yellow-300 mx-auto  ">
  <h1 >Oso Poker</h1>
</div>
  <div id="banner" class="w-full sm:w-2/3 md:w-3/4 bg-blue-300">
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
