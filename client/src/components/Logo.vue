<template>
  <div
    :id="`brand-logo-container-${templateSuffix}`"
    class="flex items-center justify-center bg-gray-900 p-2 rounded-lg border border-gray-700 shadow-md"
  >
    <div
      :id="`brand-logo-spade-${templateSuffix}`"
      class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600 mr-2"
    >
      ♠
    </div>
    <div
      :id="`brand-logo-text-${templateSuffix}`"
      class="text-xl font-bold text-white tracking-wider uppercase font-mono"
    >
      Yay<span class="text-yellow-500">Poker</span>
    </div>
    <div
      :id="`brand-logo-diamond-${templateSuffix}`"
      class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-yellow-400 ml-2"
    >
      ♦
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
