<template>
  <div
    :class="[
      sizeOption.height,
      sizeOption.width,
      'bg-white rounded-lg shadow-md border border-gray-300 relative select-none overflow-hidden transition-transform hover:-translate-y-1',
    ]"
  >
    <!-- Top Left -->
    <div
      class="absolute top-1 left-1 flex flex-col items-center leading-none"
      :class="colorClass"
    >
      <span :class="sizeOption.cornerText" class="font-bold">{{
        numSymbol.letter
      }}</span>
      <span :class="sizeOption.cornerSymbol">{{ numSymbol.symbol }}</span>
    </div>

    <!-- Center -->
    <div
      class="absolute inset-0 flex justify-center items-center"
      :class="colorClass"
    >
      <span :class="sizeOption.centerSymbol">{{ numSymbol.symbol }}</span>
    </div>

    <!-- Bottom Right (Rotated) -->
    <div
      class="absolute bottom-1 right-1 flex flex-col items-center leading-none transform rotate-180"
      :class="colorClass"
    >
      <span :class="sizeOption.cornerText" class="font-bold">{{
        numSymbol.letter
      }}</span>
      <span :class="sizeOption.cornerSymbol">{{ numSymbol.symbol }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from "vue";
import { simbolConverter, whatColor } from "../vutils.js";

const props = defineProps({
  numSymbol: String,
  size: String,
});

const sizeOption = computed(() => {
  switch (props.size) {
    case "extraLarge":
      return {
        cornerText: "text-2xl",
        cornerSymbol: "text-xl",
        centerSymbol: "text-6xl",
        height: "h-48", // ~12rem
        width: "w-32", // ~8rem
      };
    case "large":
      return {
        cornerText: "text-xl",
        cornerSymbol: "text-lg",
        centerSymbol: "text-5xl",
        height: "h-36", // ~9rem
        width: "w-24", // ~6rem
      };
    case "small":
      return {
        cornerText: "text-xs",
        cornerSymbol: "text-[10px]",
        centerSymbol: "text-2xl",
        height: "h-20", // ~5rem
        width: "w-14", // ~3.5rem
      };
    default:
      return {
        cornerText: "text-xl",
        cornerSymbol: "text-lg",
        centerSymbol: "text-5xl",
        height: "h-36",
        width: "w-24",
      };
  }
});

const numSymbol = computed(() => simbolConverter(props.numSymbol || "Ah"));
const color = computed(() => whatColor(props.numSymbol || "Ah"));
const colorClass = computed(() =>
  color.value === "red" ? "text-red-600" : "text-black"
);
</script>

<style scoped>
</style>
