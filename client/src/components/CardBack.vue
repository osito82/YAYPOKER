<template>
  <div
    :class="[
      sizeOption.width,
      sizeOption.height,
      'bg-white rounded-lg shadow-md border border-gray-300 relative select-none overflow-hidden flex justify-center items-center',
    ]"
  >
    <div class="rayas"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
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
}

.centered {
  margin: auto;
}
</style>
