<template>
  <div :id="'seat-wrapper-' + playerName" class="relative group flex flex-col items-center">
    
    <!-- Active Turn Ring -->
    <div v-if="isActive" class="absolute -inset-2 bg-yellow-500/20 rounded-full blur-md animate-pulse"></div>
    
    <!-- Player Avatar/Icon Circle -->
    <div
      :id="'avatar-' + playerName"
      class="relative w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 flex items-center justify-center shadow-xl transition-all duration-500 z-10"
      :class="isActive ? 'border-yellow-500 scale-110 shadow-yellow-500/20' : 'border-white/10 opacity-80'"
    >
      <span class="text-lg font-black text-white/80 uppercase">{{ playerName.charAt(0) }}</span>
      
      <!-- Mini Action Badge (Floats on avatar) -->
      <div v-if="playerAction" class="absolute -bottom-1 bg-blue-600 px-2 py-0.5 rounded-full border border-blue-400 shadow-lg z-20">
        <span class="text-[7px] font-black text-white uppercase tracking-tighter">{{ playerAction }}</span>
      </div>
    </div>

    <!-- Player Name Label (Glassmorphic) -->
    <div class="mt-2 bg-black/60 backdrop-blur-md border border-white/5 px-3 py-0.5 rounded-full shadow-lg z-10">
      <span class="text-[9px] font-bold text-gray-200 truncate max-w-[80px] block">{{ playerName }}</span>
    </div>

    <!-- Chip Count -->
    <div class="mt-1">
      <span class="text-[10px] font-mono font-black text-yellow-500 shadow-sm">${{ playerChips }}</span>
    </div>

    <!-- Hidden Cards Placeholder (For visual rhythm) -->
    <div v-if="!showCards" class="flex -space-x-2 mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
      <div class="w-4 h-6 bg-gray-800 border border-white/10 rounded-sm rotate-[-10deg]"></div>
      <div class="w-4 h-6 bg-gray-800 border border-white/10 rounded-sm rotate-[10deg]"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  playerName: { type: String, default: "Guest" },
  playerChips: { type: Number, default: 0 },
  playerAction: { type: String, default: "" },
  showCards: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false }
});
</script>
