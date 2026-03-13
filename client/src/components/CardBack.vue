<template>
  <div
    :id="'card-back-crop-container-' + responsive.templateSuffix"
    class="relative overflow-hidden transition-all duration-300"
    :style="cropStyle"
  >
    <div
      :id="'card-back-outer-' + responsive.templateSuffix"
      :class="[
        sizeOption.width,
        sizeOption.heightClass,
        'bg-white rounded-lg shadow-md border border-gray-300 relative select-none flex justify-center items-center overflow-hidden',
      ]"
    >
      <div
        :id="'card-back-pattern-' + responsive.templateSuffix"
        class="rayas"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()

const props = defineProps({
  size: String,
  percentage: {
    type: Number,
    default: 100,
  },
})

// Define los tamaños de la carta
const sizeOption = computed(() => {
  switch (props.size) {
    case 'extraLarge':
      return { heightClass: 'h-64', width: 'w-48', heightPx: 256 }
    case 'large':
      return { heightClass: 'h-48', width: 'w-36', heightPx: 192 }
    case 'medium':
      return { heightClass: 'h-40', width: 'w-28', heightPx: 160 }
    case 'small':
      return { heightClass: 'h-28', width: 'w-20', heightPx: 112 }
    default:
      return { heightClass: 'h-48', width: 'w-36', heightPx: 192 }
  }
})

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
