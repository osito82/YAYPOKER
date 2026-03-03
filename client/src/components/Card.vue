<template>
<div
  id="poker-card-outer"
  :class="[
    sizeOption.height,
    sizeOption.width,
    'bg-white rounded-lg shadow-md border border-gray-300 relative select-none transition-transform hover:-translate-y-1 hover:scale-105',
  ]"
>
    <!-- Top Left -->
    <div
      id="card-corner-top-left"
      class="absolute top-1 left-1 flex flex-col items-center leading-none"
      :class="colorClass"
    >
      <span id="card-letter-top" :class="sizeOption.cornerText" class="font-bold">{{
        numSymbol.letter
      }}</span>
      <span id="card-symbol-top" :class="sizeOption.cornerSymbol">{{ numSymbol.symbol }}</span>
    </div>

    <!-- Center -->
    <div
      id="card-center-symbol-container"
      class="absolute inset-0 flex justify-center items-center"
      :class="colorClass"
    >
      <span id="card-symbol-center" :class="sizeOption.centerSymbol">{{ numSymbol.symbol }}</span>
    </div>

    <!-- Bottom Right (Rotated) -->
    <div
      id="card-corner-bottom-right"
      class="absolute bottom-1 right-1 flex flex-col items-center leading-none transform rotate-180"
      :class="colorClass"
    >
      <span id="card-letter-bottom" :class="sizeOption.cornerText" class="font-bold">{{
        numSymbol.letter
      }}</span>
      <span id="card-symbol-bottom" :class="sizeOption.cornerSymbol">{{ numSymbol.symbol }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { simbolConverter, whatColor } from '../vutils.js'

const props = defineProps({
  numSymbol: String,
  size: String,
})

const sizeOption = computed(() => {
  switch (props.size) {
    case 'extraLarge':
      return {
        cornerText: 'text-3xl',
        cornerSymbol: 'text-2xl',
        centerSymbol: 'text-8xl',
        height: 'h-64',
        width: 'w-48',
      }
    case 'large':
      return {
        cornerText: 'text-3xl',
        cornerSymbol: 'text-2xl',
        centerSymbol: 'text-7xl',
        height: 'h-48',
        width: 'w-36',
      }
    case 'medium':
      return {
        cornerText: 'text-xl',
        cornerSymbol: 'text-lg',
        centerSymbol: 'text-6xl',
        height: 'h-40',
        width: 'w-28',
      }
    case 'small':
      return {
        cornerText: 'text-base',
        cornerSymbol: 'text-sm',
        centerSymbol: 'text-4xl',
        height: 'h-28',
        width: 'w-20',
      }
    default:
      return {
        cornerText: 'text-3xl',
        cornerSymbol: 'text-2xl',
        centerSymbol: 'text-7xl',
        height: 'h-48',
        width: 'w-36',
      }
  }
})

const numSymbol = computed(() => simbolConverter(props.numSymbol || 'Ah'))
const color = computed(() => whatColor(props.numSymbol || 'Ah'))
const colorClass = computed(() =>
  color.value === 'red' ? 'text-red-600' : 'text-black',
)
</script>

<style scoped></style>
