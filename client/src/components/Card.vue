<template>
<div
  :class="[
    sizeOption.height,
    sizeOption.width,
    'bg-white rounded-lg shadow-md border border-gray-300 relative select-none transition-transform hover:-translate-y-1 hover:scale-105',
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
        cornerText: 'text-2xl',
        cornerSymbol: 'text-xl',
        centerSymbol: 'text-7xl',
        height: 'h-56', // Increased from h-48
        width: 'w-40', // Increased from w-32
      }
    case 'large':
      return {
        cornerText: 'text-2xl',
        cornerSymbol: 'text-xl',
        centerSymbol: 'text-6xl',
        height: 'h-44', // Increased from h-36
        width: 'w-32', // Increased from w-24
      }
    case 'medium':
      return {
        cornerText: 'text-lg',
        cornerSymbol: 'text-md',
        centerSymbol: 'text-5xl',
        height: 'h-36',
        width: 'w-24',
      }
    case 'small':
      return {
        cornerText: 'text-sm',
        cornerSymbol: 'text-xs',
        centerSymbol: 'text-3xl',
        height: 'h-24', // Increased from h-20
        width: 'w-16', // Increased from w-14
      }
    default:
      return {
        cornerText: 'text-2xl',
        cornerSymbol: 'text-xl',
        centerSymbol: 'text-6xl',
        height: 'h-44',
        width: 'w-32',
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
