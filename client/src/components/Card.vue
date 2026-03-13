<template>
  <div
    :id="'poker-card-crop-container-' + responsive.templateSuffix"
    class="relative overflow-hidden transition-all duration-300"
    :style="cropStyle"
  >
    <div
      :id="'poker-card-outer-' + responsive.templateSuffix"
      :class="[
        sizeOption.width,
        sizeOption.heightClass,
        'bg-white rounded-lg shadow-md border border-gray-300 relative select-none transition-transform hover:-translate-y-1 hover:scale-105',
        props.highlight ? 'highlight-card' : '',
      ]"
    >
      <div
        v-if="props.percentage > 55"
        :id="'card-corner-top-left-' + responsive.templateSuffix"
        class="absolute top-1 left-1 flex flex-col items-center leading-none"
        :class="colorClass"
      >
        <!-- Número más abajo con translate-y y símbolo más gordo con font-black y scale -->
        <span
          :class="[sizeOption.cornerText, 'font-extrabold', 'translate-y-1.5']"
        >
          {{ numSymbol.letter }}
        </span>
        <span
          :class="[
            sizeOption.cornerSymbol,
            'font-black',
            'scale-125',
            'inline-block',
          ]"
        >
          {{ numSymbol.symbol }}
        </span>
      </div>

      <div
        :id="'card-center-symbol-container-' + responsive.templateSuffix"
        class="absolute inset-0 flex justify-center"
        :class="[colorClass, isCropped ? 'items-start pt-0' : 'items-center']"
      >
        <div
          v-if="isCropped"
          class="flex items-center justify-center w-full gap-4 -mt-0"
        >
          <span
            :class="[sizeOption.cropTextSize, 'font-black tracking-tighter']"
          >
            {{ numSymbol.letter }}
          </span>
          <span :class="sizeOption.cropTextSize">
            {{ numSymbol.symbol }}
          </span>
        </div>

        <span v-else :class="sizeOption.centerSymbol">
          {{ numSymbol.symbol }}
        </span>
      </div>

      <div
        v-if="props.percentage > 55"
        :id="'card-corner-bottom-right-' + responsive.templateSuffix"
        class="absolute bottom-1 right-1 flex flex-col items-center leading-none transform rotate-180"
        :class="colorClass"
      >
        <!-- Mismos ajustes para la esquina inferior -->
        <span
          :class="[sizeOption.cornerText, 'font-extrabold', 'translate-y-1.5']"
        >
          {{ numSymbol.letter }}
        </span>
        <span
          :class="[
            sizeOption.cornerSymbol,
            'font-black',
            'scale-125',
            'inline-block',
          ]"
        >
          {{ numSymbol.symbol }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { simbolConverter, whatColor } from '../vutils.js'
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()

const props = defineProps({
  numSymbol: String,
  size: String,
  highlight: {
    type: Boolean,
    default: false,
  },
  percentage: {
    type: Number,
    default: 100,
  },
})

// Variable para detectar si estamos en modo "recortado"
const isCropped = computed(() => props.percentage <= 55)

const sizeOption = computed(() => {
  switch (props.size) {
    case 'extraLarge':
      return {
        cornerText: 'text-3xl',
        cornerSymbol: 'text-2xl',
        centerSymbol: 'text-8xl',
        cropTextSize: 'text-8xl', // Cropped Size
        heightClass: 'h-64',
        width: 'w-48',
        heightPx: 256,
      }
    case 'large':
      return {
        cornerText: 'text-2xl',
        cornerSymbol: 'text-xl',
        centerSymbol: 'text-7xl',
        cropTextSize: 'text-7xl',
        heightClass: 'h-48',
        width: 'w-36',
        heightPx: 192,
      }
    case 'medium':
      return {
        cornerText: 'text-xl',
        cornerSymbol: 'text-lg',
        centerSymbol: 'text-6xl',
        cropTextSize: 'text-6xl',
        heightClass: 'h-40',
        width: 'w-28',
        heightPx: 160,
      }
    case 'small':
      return {
        cornerText: 'text-sm',
        cornerSymbol: 'text-xs',
        centerSymbol: 'text-4xl',
        cropTextSize: 'text-4xl',
        heightClass: 'h-28',
        width: 'w-20',
        heightPx: 112,
      }
    case 'xsmall':
      return {
        cornerText: 'text-[10px]',
        cornerSymbol: 'text-[8px]',
        centerSymbol: 'text-xl',
        cropTextSize: 'text-xl',
        heightClass: 'h-12',
        width: 'w-10',
        heightPx: 48,
      }
    default:
      return {
        cornerText: 'text-2xl',
        cornerSymbol: 'text-xl',
        centerSymbol: 'text-7xl',
        cropTextSize: 'text-7xl',
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

const cropStyle = computed(() => {
  const pct = props.percentage ?? 100
  if (pct >= 100) return {}
  let height = (sizeOption.value.heightPx * pct) / 100
  return { height: `${height}px` }
})
</script>

<style scoped>
#poker-card-crop-container {
  overflow: hidden;
}

.highlight-card {
  box-shadow: 0 0 15px 4px rgba(234, 179, 8, 0.6);
  border-color: rgba(234, 179, 8, 0.8) !important;
  transform: scale(1.1) translateY(-4px);
  z-index: 10;
}
</style>
