<template>
  <div
    :id="'poker-chip-' + value + '-' + size"
    :class="[
      chipSize.container,
      color,
      textColor || 'text-white',
      border || 'border-black/20',
      'rounded-full flex items-center justify-center font-black shadow-lg border-2 border-dashed active:scale-90 transition-all flex-shrink-0 hover:brightness-110 cursor-pointer select-none'
    ]"
  >
    <span :class="chipSize.text">{{ value }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: [Number, String],
  color: {
    type: String,
    default: 'bg-white'
  },
  textColor: String,
  size: {
    type: String,
    default: 'medium'
  },
  border: String
})

const chipSize = computed(() => {
  switch (props.size) {
    case 'xsmall':
      return {
        container: 'w-6 h-6',
        text: 'text-[7px]'
      }
    case 'small':
      return {
        container: 'w-8 h-8',
        text: 'text-[9px]'
      }
    case 'medium':
      return {
        container: 'w-10 h-10',
        text: 'text-[11px]'
      }
    case 'large':
      return {
        container: 'w-12 h-12',
        text: 'text-[13px]'
      }
    case 'extraLarge':
      return {
        container: 'w-16 h-16',
        text: 'text-lg'
      }
    default:
      return {
        container: 'w-10 h-10',
        text: 'text-[11px]'
      }
  }
})
</script>
