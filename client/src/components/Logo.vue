<template>
  <div
    :id="`brand-logo-container-${templateSuffix}`"
    class="flex items-center justify-center px-4"
  >
    <div
      :id="`brand-logo-text-${templateSuffix}`"
      class="text-3xl font-black italic tracking-tighter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]"
    >
      <span class="text-yellow-500">YAY</span><span class="text-white">POKER</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()
const templateSuffix = computed(() => responsive.templateSuffix)
</script>

<style scoped></style>
