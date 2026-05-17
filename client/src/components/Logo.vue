<template>
  <router-link
    to="/"
    :id="`brand-logo-container-${templateSuffix}`"
    class="flex items-center justify-center px-2 sm:px-4 cursor-pointer !no-underline hover:!no-underline hover:opacity-90 transition-opacity duration-200 gap-1"
  >
    <!-- YAY Icon Pattern -->
    <div class="flex gap-0.5 items-center">
      <div
        v-for="(letter, index) in ['Y', 'A', 'Y']"
        :key="index"
        class="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500 rounded flex items-center justify-center shadow-[0_0_10px_rgba(234,179,8,0.3)]"
      >
        <span class="text-black font-black text-sm sm:text-xl italic">{{
          letter
        }}</span>
      </div>
    </div>

    <!-- POKER Text -->
    <div
      :id="`brand-logo-text-${templateSuffix}`"
      class="hidden min-[400px]:block text-xl sm:text-3xl font-black italic tracking-tighter text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]"
    >
      POKER
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()
const templateSuffix = computed(() => responsive.templateSuffix)
</script>

<style scoped></style>
