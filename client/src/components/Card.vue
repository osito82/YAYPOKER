<template>
  <div
    id="poker-card-crop-container"
    class="relative overflow-hidden transition-all duration-300"
    :style="cropStyle"
  >
    <div
      id="poker-card-outer"
      :class="[
        sizeOption.width,
        sizeOption.heightClass,
        'bg-white rounded-lg shadow-md border border-gray-300 relative select-none transition-transform hover:-translate-y-1 hover:scale-105',
      ]"
    >
      <!-- Top Left -->
      <div
        id="card-corner-top-left"
        class="absolute top-1 left-1 flex flex-col items-center leading-none"
        :class="colorClass"
      >
        <span :class="[sizeOption.cornerText, 'font-bold']">{{
          numSymbol.letter
        }}</span>
        <span :class="sizeOption.cornerSymbol">{{ numSymbol.symbol }}</span>
      </div>

      <!-- Center -->
      <div
        id="card-center-symbol-container"
        class="absolute inset-0 flex justify-center items-center"
        :class="colorClass"
      >
        <span :class="sizeOption.centerSymbol">{{ numSymbol.symbol }}</span>
      </div>

      <!-- Bottom Right (Rotated) -->
      <div
        id="card-corner-bottom-right"
        class="absolute bottom-1 right-1 flex flex-col items-center leading-none transform rotate-180"
        :class="colorClass"
      >
        <span :class="[sizeOption.cornerText, 'font-bold']">{{
          numSymbol.letter
        }}</span>
        <span :class="sizeOption.cornerSymbol">{{ numSymbol.symbol }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { simbolConverter, whatColor } from '../vutils.js'

const props = defineProps({
  numSymbol: String,
  size: String,
  percentage: {
    type: Number,
    default: 100,
  },
})

const sizeOption = computed(() => {
  switch (props.size) {
    case 'extraLarge':
      return {
        cornerText: 'text-3xl',
        cornerSymbol: 'text-2xl',
        centerSymbol: 'text-8xl',
        heightClass: 'h-64',
        width: 'w-48',
        heightPx: 256,
      }
    case 'large':
      return {
        cornerText: 'text-3xl',
        cornerSymbol: 'text-2xl',
        centerSymbol: 'text-7xl',
        heightClass: 'h-48',
        width: 'w-36',
        heightPx: 192,
      }
    case 'medium':
      return {
        cornerText: 'text-xl',
        cornerSymbol: 'text-lg',
        centerSymbol: 'text-6xl',
        heightClass: 'h-40',
        width: 'w-28',
        heightPx: 160,
      }
    case 'small':
      return {
        cornerText: 'text-base',
        cornerSymbol: 'text-sm',
        centerSymbol: 'text-4xl',
        heightClass: 'h-28',
        width: 'w-20',
        heightPx: 112,
      }
    default:
      return {
        cornerText: 'text-3xl',
        cornerSymbol: 'text-2xl',
        centerSymbol: 'text-7xl',
        heightClass: 'h-48',
        width: 'w-36',
        heightPx: 192,
      }
  }
})

const numSymbol = computed(() => simbolConverter(props.numSymbol || 'Ah'))
const color = computed(() => whatColor(props.numSymbol || 'Ah'))
const colorClass = computed(() =>
  color.value === 'red' ? 'text-red-600' : 'text-black',
)

// Calculamos el estilo de recorte dinámicamente
const cropStyle = computed(() => {
  const pct = props.percentage ?? 100
  if (pct >= 100) return {}
  return {
    height: `${(sizeOption.value.heightPx * pct) / 100}px`,
  }
})
</script>

<style scoped>
/* ya no necesitamos height calc() ni variables CSS */
</style>
