<template>
  <div
    :id="`poker-card-crop-container-${templateSuffix}`"
    class="relative overflow-hidden transition-all duration-300"
    :style="cropStyle"
  >
    <div
      :id="`poker-card-outer-${templateSuffix}`"
      :class="[
        sizeOption.width,
        sizeOption.heightClass,
        'card-face rounded-xl relative select-none transition-all duration-200',
        props.highlight ? 'highlight-card' : '',
      ]"
    >
      <!-- Subtle inner border shine -->
      <div
        :id="`poker-card-inner-shine-${templateSuffix}`"
        class="absolute inset-[1px] rounded-[10px] pointer-events-none card-inner-shine"
      ></div>

      <!-- Top-left corner -->
      <div
        v-if="props.percentage > 55"
        :id="`poker-card-corner-top-left-${templateSuffix}`"
        class="absolute top-1.5 left-1.5 flex flex-col items-center leading-none"
        :class="colorClass"
      >
        <span
          :id="`poker-card-letter-top-${templateSuffix}`"
          :class="[sizeOption.cornerText, 'font-black leading-none']"
          >{{ numSymbol.letter }}</span
        >
        <span
          :id="`poker-card-symbol-top-${templateSuffix}`"
          :class="[sizeOption.cornerSymbol, 'font-black leading-none mt-0.5']"
          >{{ numSymbol.symbol }}</span
        >
      </div>

      <!-- Center -->
      <div
        :id="`poker-card-center-container-${templateSuffix}`"
        class="absolute inset-0 flex justify-center"
        :class="[colorClass, isCropped ? 'items-start pt-1' : 'items-center']"
      >
        <div
          v-if="isCropped"
          :id="`poker-card-cropped-content-${templateSuffix}`"
          class="flex items-center justify-center w-full gap-3"
        >
          <span
            :id="`poker-card-cropped-letter-${templateSuffix}`"
            :class="[
              sizeOption.cropTextSize,
              'font-black tracking-tighter leading-none',
            ]"
            >{{ numSymbol.letter }}</span
          >
          <span
            :id="`poker-card-cropped-symbol-${templateSuffix}`"
            :class="[sizeOption.cropTextSize, 'leading-none']"
            >{{ numSymbol.symbol }}</span
          >
        </div>
        <span
          v-else
          :id="`poker-card-center-symbol-${templateSuffix}`"
          :class="[sizeOption.centerSymbol, 'drop-shadow-sm']"
          >{{ numSymbol.symbol }}</span
        >
      </div>

      <!-- Bottom-right corner (rotated) -->
      <div
        v-if="props.percentage > 55"
        :id="`poker-card-corner-bottom-right-${templateSuffix}`"
        class="absolute bottom-1.5 right-1.5 flex flex-col items-center leading-none transform rotate-180"
        :class="colorClass"
      >
        <span
          :id="`poker-card-letter-bottom-${templateSuffix}`"
          :class="[sizeOption.cornerText, 'font-black leading-none']"
          >{{ numSymbol.letter }}</span
        >
        <span
          :id="`poker-card-symbol-bottom-${templateSuffix}`"
          :class="[sizeOption.cornerSymbol, 'font-black leading-none mt-0.5']"
          >{{ numSymbol.symbol }}</span
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { simbolConverter, whatColor } from '../vutils.js'
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()
const templateSuffix = computed(() => responsive.templateSuffix)

const props = defineProps({
  numSymbol: String,
  size: String,
  highlight: { type: Boolean, default: false },
  percentage: { type: Number, default: 100 },
})

const isCropped = computed(() => props.percentage <= 55)

const sizeOption = computed(() => {
  switch (props.size) {
    case 'extraLarge':
      return {
        cornerText: 'text-3xl',
        cornerSymbol: 'text-2xl',
        centerSymbol: 'text-8xl',
        cropTextSize: 'text-8xl',
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
  color.value === 'red' ? 'text-red-500' : 'text-gray-900',
)

const cropStyle = computed(() => {
  const pct = props.percentage ?? 100
  if (pct >= 100) return {}
  return { height: `${(sizeOption.value.heightPx * pct) / 100}px` }
})
</script>

<style scoped>
.card-face {
  background: linear-gradient(145deg, #ffffff 0%, #f8f8f8 60%, #f0f0f0 100%);
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.35),
    0 1px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.card-inner-shine {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.6) 0%,
    transparent 50%
  );
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.highlight-card {
  box-shadow:
    0 0 0 2px rgba(234, 179, 8, 0.9),
    0 0 20px rgba(234, 179, 8, 0.5),
    0 4px 16px rgba(0, 0, 0, 0.4);
  transform: translateY(-6px) scale(1.06);
  z-index: 10;
}
</style>
