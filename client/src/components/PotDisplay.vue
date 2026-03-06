<template>
  <div
    class="flex items-center justify-center py-1 px-8
    bg-black/85 backdrop-blur-2xl
    rounded-b-2xl
    border-x border-b border-yellow-500/40
    shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(234,179,8,0.15)]
    transition-all duration-500
    hover:border-yellow-400/70
    hover:shadow-[0_15px_60px_rgba(0,0,0,1),0_0_40px_rgba(234,179,8,0.35)]
    group"
  >
    <div class="flex items-center gap-2">
      
      <span
        class="text-2xl md:text-3xl font-mono font-black text-white
        drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]
        tracking-tight
        group-hover:scale-105
        transition-transform"
      >
        Pot
      </span>

      <span class="text-yellow-500/60 font-black text-[10px] tracking-tighter mt-1">$</span>

      <span
        class="text-2xl md:text-3xl font-mono font-black text-white
        drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]
        tracking-tight
        group-hover:scale-105
        transition-transform"
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
