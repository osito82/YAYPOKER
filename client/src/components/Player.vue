<template>
  <div
    :id="'player-card-' + playerName"
    class="flex flex-col items-center p-2 rounded-lg bg-gray-800 bg-opacity-80 shadow-lg text-white w-40 transition-all duration-300 border-2"
    :class="isActive ? 'border-yellow-400 scale-105' : 'border-transparent'"
  >
    <!-- Player Name & Avatar Placeholder -->
    <div id="player-profile-section" class="flex flex-col items-center mb-2">
      <div
        id="player-avatar-circle"
        class="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-2xl font-bold mb-1 border-2 border-gray-400"
      >
        {{ playerName.charAt(0).toUpperCase() }}
      </div>
      <div
        id="player-name-text"
        class="font-bold text-base truncate w-full text-center"
      >
        {{ playerName }}
      </div>
    </div>

    <!-- Cards -->
    <div
      id="player-cards-container"
      class="flex -space-x-4 mb-2 h-16 items-center justify-center"
    >
      <template v-if="showCards && playerCards && playerCards.length > 0">
        <Card
          v-for="(card, index) in playerCards"
          :id="'player-card-' + playerName + '-hand-' + index"
          :key="index"
          :size="responsive.cardSize"
          :percentage="responsive.cardPercentage"
          :numSymbol="card || ''"
          class="transform hover:-translate-y-2 transition-transform"
        />
      </template>
      <template v-else>
        <!-- Show Backs -->
        <CardBack
          :id="'player-card-' + playerName + '-back-1'"
          :size="responsive.cardSize"
          :percentage="responsive.cardPercentage"
        />
        <CardBack
          :id="'player-card-' + playerName + '-back-2'"
          :size="responsive.cardSize"
          :percentage="responsive.cardPercentage"
          class="-ml-4"
        />
      </template>
    </div>

    <!-- Chips & Action -->
    <div id="player-chips-action-section" class="w-full text-center">
      <div
        id="player-chips-display"
        class="text-yellow-400 font-mono text-base"
      >
        ${{ playerChips }}
      </div>
      <div
        v-if="playerAction"
        id="player-action-display"
        class="text-sm text-gray-200 mt-1 italic font-medium"
      >
        {{ playerAction }}
      </div>
    </div>
  </div>
</template>

<script setup>
import Card from '../components/Card.vue'
import CardBack from '../components/CardBack.vue'
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()

defineProps({
  playerName: { type: String, default: 'Player' },
  playerChips: { type: Number, default: 0 },
  playerAction: String,
  playerCards: {
    type: Array,
    default: () => [],
  },
  showCards: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false }, // New prop to highlight active player
})
</script>

<style scoped></style>
