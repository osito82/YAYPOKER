<template>
  <div class="card" :style="{ transform: `scale(${scale})` }">
    <div :style="{ color: color }" class="number">{{ numSymbol.letter }}</div>
    <div :style="{ color: color }" class="symbol">{{ numSymbol.symbol }}</div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps } from "vue";

const props = defineProps({
  numSymbol: String,
  scale: Number,
});

import { simbolConverter, whatColor } from "../vutils.js";
const scale = computed(() => (props.scale ? props.scale : 1));
const numSymbol = computed(() => simbolConverter(props.numSymbol));
const color = computed(() => whatColor(props.numSymbol));
</script>

<style scoped>
.card {
  min-width: 80px;
  padding: 2em;
  margin: 5px;
  margin-right: 5px;
  transform-origin: top left;
  width: 100px;
  height: 150px;
  border-radius: 15px;
  display: flex;
  background-color: white;
  flex-direction: column;

  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.symbol,
.number {
  font-size: 7em;
  text-align: center;
  line-height: 0.7;
  margin: 0;
  padding: 0;
  height: fit-content;
  width: max-content;
}
</style>
