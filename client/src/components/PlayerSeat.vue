<template>
  <div class="relative group">
    <!-- Active Player Glow -->
    <div v-if="isActive" class="absolute -inset-4 bg-yellow-500/20 rounded-[2.5rem] blur-2xl animate-pulse"></div>
    
    <!-- Seat Container -->
    <div
      class="relative flex flex-col items-center p-4 rounded-3xl bg-gray-900/80 backdrop-blur-md border-2 w-44 transition-all duration-500 shadow-2xl"
      :class="isActive ? 'border-yellow-500/50 scale-110 z-10' : 'border-white/5 opacity-80'"
    >
      <!-- Player Info Header -->
      <div class="flex flex-col items-center mb-4 w-full">
        <div
          class="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xl font-black mb-2 border border-white/10 shadow-inner group-hover:scale-110 transition-transform"
        >
          <span class="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            {{ playerName.charAt(0).toUpperCase() }}
          </span>
        </div>
        <div class="font-black text-[11px] uppercase tracking-widest truncate w-full text-center text-gray-300">
          {{ playerName }}
        </div>
      </div>

      <!-- Cards Area -->
      <div class="flex -space-x-6 mb-4 h-20 items-center justify-center perspective-1000">
        <template v-if="showCards && playerCards && playerCards.length > 0">
          <Card
            v-for="(card, index) in playerCards"
            :key="index"
            :size="'small'"
            :numSymbol="card || ''"
            class="transform transition-all duration-300 hover:-translate-y-4 hover:rotate-0"
            :style="{ transform: `rotate(${(index - 0.5) * 10}deg)` }"
          />
        </template>
        <template v-else>
           <CardBack :size="'small'" class="rotate-[-5deg]" />
           <CardBack :size="'small'" class="rotate-[5deg]" />
        </template>
      </div>

      <!-- Financials & Actions -->
      <div class="w-full bg-black/40 p-2 rounded-xl border border-white/5 text-center">
        <div class="text-yellow-500 font-mono font-black text-sm tracking-tighter">
          ${{ playerChips }}
        </div>
        <div v-if="playerAction" class="text-[9px] text-blue-400 font-black uppercase tracking-tighter mt-1 animate-pulse">
          {{ playerAction }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Card from "../components/Card.vue";
import CardBack from "../components/CardBack.vue";

defineProps({
  playerName: { type: String, default: "Player" },
  playerChips: { type: Number, default: 0 },
  playerAction: String,
  playerCards: {
    type: Array,
    default: () => [],
  },
  showCards: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
});
</script>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}
</style>
