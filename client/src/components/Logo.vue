<script setup>
import { ref } from 'vue'

defineProps({
  msg: String,
})

const count = ref(0)
</script>

<template>
  <h1 class="logo">Oso Poker</h1>

</template>

<style scoped>




.logo {
  
  padding: 1em;
  background-color: blueviolet;

}

</style>
