<template>
  <div class="card">
    <div :style="{ color:color }" class="number">{{ numSymbol.letter }}</div>
    <div :style="{ color:color }" class="symbol">{{ numSymbol.symbol }}</div>
    
  </div>
</template>

<script setup>

import { ref, computed, defineProps } from "vue";

const props = defineProps({
  numSymbol: String,
});

import { simbolConverter,whatColor } from "../vutils.js";

const numSymbol = computed(() => simbolConverter(props.numSymbol));
const color = computed(() => whatColor(props.numSymbol));
</script>

<style scoped>
.card {
  width: 100px;
  height: 150px;
  border-radius: 15px;
  display: flex;
  background-color: white;
  flex-direction: column;
  color: red;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); 
}

.symbol,
.number {
  font-weight: bolder;
  font-size: 8em;
  text-align: center;
  line-height: 0.7; 
  margin: 0; 
  padding: 0;
  height: fit-content;
}
</style>
