<template>
  <div
    class="flex items-center justify-center py-1 px-8 bg-black/80 backdrop-blur-2xl rounded-b-2xl border-x border-b border-yellow-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all duration-500 hover:border-yellow-500/60 group"
  >
    <div class="flex items-center gap-2">
      <span class="text-yellow-500/50 font-black text-[10px] tracking-tighter mt-1">$</span>
      <span
        class="text-2xl md:text-3xl font-mono font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] tracking-tight group-hover:scale-105 transition-transform"
      >
        {{ amount }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  amount: {
    type: [Number, String],
    default: 0,
  },
})
</script>
