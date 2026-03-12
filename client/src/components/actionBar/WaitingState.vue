<template>
  <div
    v-if="!isMyTurn"
    class="h-8 flex items-center justify-center gap-2 bg-yellow-500/5 rounded-lg border border-white/5 px-3"
  >
    <div class="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping"></div>
    <span class="text-[9px] font-black text-yellow-500/60 uppercase tracking-widest truncate">
      Wait: {{ activePlayerName }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  isMyTurn: Boolean,
  activePlayerName: String
})
</script>
