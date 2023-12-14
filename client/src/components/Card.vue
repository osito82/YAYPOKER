<template>
  <div
    :style="{ transform: `scale(${scaleValue / 100})` }"
    class="lg:w-24 max-w-xs lg:h-32 bg-white rounded-lg flex flex-col justify-center items-center"
  >
    <div class="text-red-600 text-7xl items-center custom-line-height">
      {{ numSymbol.letter }}
    </div>

    <div class="text-red-600 text-7xl items-center custom-line-height">
      {{ numSymbol.symbol }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps } from "vue";

const props = defineProps({
  numSymbol: String,
  scale: Number,
});

import { simbolConverter, whatColor } from "../vutils.js";
const scaleValue = computed(() => (props.scale ? props.scale : 100));
const numSymbol = computed(() => simbolConverter(props.numSymbol));
const color = computed(() => whatColor(props.numSymbol));
</script>

<style scoped>
.custom-line-height {
  line-height: 0.75;
}
</style>
