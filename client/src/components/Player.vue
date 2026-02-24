<template>
  <div
    class="flex flex-col items-center p-2 rounded-lg bg-gray-800 bg-opacity-80 shadow-lg text-white w-40 transition-all duration-300 border-2"
    :class="isActive ? 'border-yellow-400 scale-105' : 'border-transparent'"
  >
    <!-- Player Name & Avatar Placeholder -->
    <div class="flex flex-col items-center mb-2">
      <div
        class="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-xl font-bold mb-1 border-2 border-gray-400"
      >
        {{ playerName.charAt(0).toUpperCase() }}
      </div>
      <div class="font-semibold text-sm truncate w-full text-center">
        {{ playerName }}
      </div>
    </div>

    <!-- Cards -->
    <div class="flex -space-x-4 mb-2 h-16 items-center justify-center">
      <template v-if="showCards && playerCards && playerCards.length > 0">
        <Card
          v-for="(card, index) in playerCards"
          :key="index"
          :size="'small'"
          :numSymbol="card || ''"
          class="transform hover:-translate-y-2 transition-transform"
        />
      </template>
      <template v-else>
        <!-- Show Backs -->
         <CardBack :size="'small'" />
         <CardBack :size="'small'" class="-ml-4" />
      </template>
    </div>

    <!-- Chips & Action -->
    <div class="w-full text-center">
      <div class="text-yellow-400 font-mono text-sm">
        ${{ playerChips }}
      </div>
      <div v-if="playerAction" class="text-xs text-gray-300 mt-1 italic">
        {{ playerAction }}
      </div>
    </div>
  </div>
</template>

<script setup>
import Card from "../components/Card.vue";
import CardBack from "../components/CardBack.vue";
import { defineProps } from "vue";

const props = defineProps({
  playerName: { type: String, default: "Player" },
  playerChips: { type: Number, default: 0 },
  playerAction: String,
  playerCards: {
    type: Array,
    default: () => [],
  },
  showCards: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false }, // New prop to highlight active player
});
</script>

<style scoped>
</style>




