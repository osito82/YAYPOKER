<template>
  <div class="flex flex-col items-center justify-center py-4 px-10 bg-black/60 backdrop-blur-xl rounded-[2rem] border-2 border-yellow-500/30 shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(234,179,8,0.1)] transition-all duration-500 hover:border-yellow-500/50">
    <span class="text-[10px] text-yellow-500/70 uppercase font-black tracking-[0.4em] mb-1">TOTAL POT</span>
    <div class="flex items-center space-x-2">
      <span class="text-3xl font-mono font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] tracking-tight">
        ${{ amount }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  amount: {
    type: [Number, String],
    default: 0
  }
});
</script>
