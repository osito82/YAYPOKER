<template>
  <div
    id="card-space-crop-container"
    class="relative overflow-hidden transition-all duration-300"
    :style="cropStyle"
  >
    <div
      id="card-space-outer"
      :class="[sizeOption.width, sizeOption.heightClass, 'rounded-xl flex justify-center items-center card-slot']"
    >
      <span class="card-slot-suit">♦</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: String,
  percentage: { type: Number, default: 100 },
})

const sizeOption = computed(() => {
  switch (props.size) {
    case 'extraLarge': return { heightClass: 'h-64', width: 'w-48', heightPx: 256 }
    case 'large': return { heightClass: 'h-48', width: 'w-36', heightPx: 192 }
    case 'medium': return { heightClass: 'h-40', width: 'w-28', heightPx: 160 }
    case 'small': return { heightClass: 'h-28', width: 'w-20', heightPx: 112 }
    default: return { heightClass: 'h-48', width: 'w-36', heightPx: 192 }
  }
})

const cropStyle = computed(() => {
  const pct = props.percentage ?? 100
  if (pct >= 100) return {}
  return { height: `${(sizeOption.value.heightPx * pct) / 100}px` }
})
</script>

<style scoped>
.card-slot {
  background: rgba(0, 0, 0, 0.25);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(2px);
}

.card-slot-suit {
  font-size: 1.5rem;
  color: rgba(255,255,255,0.06);
  user-select: none;
}
</style>
