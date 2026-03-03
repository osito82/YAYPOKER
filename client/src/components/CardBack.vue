<template>
  <div
    id="card-back-outer"
    :class="[
      sizeOption.width,
      sizeOption.height,
      'bg-white rounded-lg shadow-md border border-gray-300 relative select-none overflow-hidden flex justify-center items-center',
    ]"
  >
    <div id="card-back-pattern" class="rayas"></div>
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
        height: 'h-64',
        width: 'w-48',
      }
    case 'large':
      return {
        height: 'h-48',
        width: 'w-36',
      }
    case 'medium':
      return {
        height: 'h-40',
        width: 'w-28',
      }
    case 'small':
      return {
        height: 'h-28',
        width: 'w-20',
      }
    default:
      return {
        height: 'h-48',
        width: 'w-36',
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
    opacity: 0.5;
}

.centered {
  margin: auto;
}
</style>
