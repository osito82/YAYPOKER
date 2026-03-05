<template>
  <div
    id="card-back-crop-container"
    class="relative overflow-hidden transition-all duration-300"
    :class="cropHeightClass"
  >
    <div
      id="card-back-outer"
      :class="[
        sizeOption.width,
        sizeOption.heightClass,
        'bg-white rounded-lg shadow-md border border-gray-300 relative select-none flex justify-center items-center overflow-hidden',
      ]"
    >
      <div id="card-back-pattern" class="rayas"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: String,
  percentage: {
    type: Number,
    default: 100
  }
})

// Define los tamaños de la carta
const sizeOption = computed(() => {
  switch (props.size) {
    case 'extraLarge': return { heightClass: 'h-64', width: 'w-48', heightPx: 256 }
    case 'large': return { heightClass: 'h-48', width: 'w-36', heightPx: 192 }
    case 'medium': return { heightClass: 'h-40', width: 'w-28', heightPx: 160 }
    case 'small': return { heightClass: 'h-28', width: 'w-20', heightPx: 112 }
    default: return { heightClass: 'h-48', width: 'w-36', heightPx: 192 }
  }
})

// Convertimos percentage a clase Tailwind
const cropHeightClass = computed(() => {
  const pct = props.percentage ?? 100

  if (pct >= 100) return ''        // full height
  if (pct >= 75) return 'h-3/4'
  if (pct >= 66) return 'h-2/3'
  if (pct >= 50) return 'h-1/2'
  if (pct >= 33) return 'h-1/3'
  if (pct >= 25) return 'h-1/4'
  return 'h-1/6'                   // mínimo visible
})
</script>

<style scoped>
.rayas {
  width: 90%;
  height: 90%;
  border-radius: 6px;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    #183b5a 5px,
    #183b5a 10px
  );
  opacity: 0.5;
}
</style>