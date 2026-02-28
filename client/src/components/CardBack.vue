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
        height: 'h-48',
        width: 'w-32',
      }
    case 'large':
      return {
        height: 'h-36',
        width: 'w-24',
      }
    case 'small':
      return {
        height: 'h-20',
        width: 'w-14',
      }
    default:
      return {
        height: 'h-36',
        width: 'w-24',
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
