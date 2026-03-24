<template>
  <div
    v-if="!isMyTurn"
    :id="`waiting-state-container-${templateSuffix}`"
    class="h-8 flex items-center justify-center gap-2 bg-yellow-500/5 rounded-lg border border-white/5 px-3"
  >
    <div
      :id="`waiting-state-pulse-${templateSuffix}`"
      class="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping"
    ></div>
    <span
      :id="`waiting-state-text-${templateSuffix}`"
      class="text-[9px] font-black text-yellow-500/60 uppercase tracking-widest truncate"
    >
      Wait: {{ activePlayerName }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResponsiveStore } from '../../store/responsiveStore'

defineProps({
  isMyTurn: Boolean,
  activePlayerName: String,
})

const responsive = useResponsiveStore()
const templateSuffix = computed(() => responsive.templateSuffix)
</script>
