<template>
  <div
    id="poker-viewport"
    class="w-full h-full flex flex-col md:flex-row md:overflow-hidden bg-neutral-950 overflow-y-auto"
  >
    <!-- LEFT: Table Surface -->
    <div
      id="table-container"
      class="w-full md:w-[65%] lg:w-[70%] xl:w-[75%] shrink-0 h-auto min-h-[50vh] md:h-full relative flex items-center justify-center p-3 sm:p-4 md:p-8"
    >
      <div
        id="main-table-surface"
        class="w-full h-full min-h-[300px] sm:min-h-[350px] bg-gradient-to-br from-green-900 via-emerald-950 to-green-950 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden flex items-center justify-center rounded-[2rem] sm:rounded-[3rem] border-8 border-neutral-900/50"
      >
        <!-- Modern Grid Pattern -->
        <div
          id="table-grid-pattern"
          class="absolute inset-0 opacity-[0.03] pointer-events-none"
          style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 50px 50px;"
        ></div>

        <!-- Subtle Inner Glow & Felt Texture -->
        <div id="table-inner-glow" class="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.8)] pointer-events-none"></div>
        <div id="table-felt-texture" class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-20 pointer-events-none"></div>

        <!-- CENTER ZONE: Pot & Community Cards -->
        <div
          id="table-center-zone"
          class="relative z-10 w-full flex flex-col items-center justify-center px-4 transition-all duration-300 gap-6 md:gap-10"
        >
          <!-- Pot -->
          <div id="pot-display-container" class="transform hover:scale-105 transition-transform">
             <PotDisplay :amount="pot" />
          </div>

          <!-- Community Cards Container -->
          <div 
            id="community-cards-row" 
            class="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 w-full max-w-full"
          >
            <template v-for="i in 5" :key="i">
              <template v-if="communityCards[i - 1]">
                <Card
                  :id="'community-card-' + (i-1)"
                  :numSymbol="communityCards[i - 1]"
                  :size="cardSize"
                  class="shadow-2xl hover:scale-110 transition-transform flex-shrink-0 origin-center"
                />
              </template>
              <template v-else>
                <CardSpace
                  :id="'community-card-space-' + (i-1)"
                  :size="cardSize"
                  class="flex-shrink-0 opacity-40"
                />
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT: Players Sidepanel -->
    <div
      id="players-sidepanel"
      class="w-full md:w-[35%] lg:w-[30%] xl:w-[25%] h-auto md:h-full bg-black/40 backdrop-blur-3xl border-t md:border-t-0 md:border-l border-white/5 p-4 md:p-8 flex flex-col gap-6 md:overflow-y-auto pb-40 md:pb-8"
    >
      <div id="sidepanel-header" class="flex items-center justify-between px-2">
        <h2 id="sidepanel-title" class="text-sm font-black text-gray-400 uppercase tracking-[0.4em]">Live Players</h2>
        <div id="live-players-counter" class="flex items-center gap-3 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <div id="live-indicator-dot" class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span id="live-players-text" class="text-[11px] font-black text-emerald-400 uppercase">{{ players.length }} Online</span>
        </div>
      </div>
      
      <div id="players-list-container" class="flex flex-col gap-4">
        <PlayerSeat
          v-for="(p, i) in players"
          :id="'player-seat-' + i"
          :key="p.id"
          :playerName="p.name"
          :playerChips="p.chips"
          :playerBet="p.currentBet || 0"
          :playerAction="p.lastAction"
          :showCards="p.showCards || false"
          :playerCards="p.cards || []"
          :isActive="activePlayerId === p.id"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Card from './Card.vue'
import PlayerSeat from './PlayerSeat.vue'
import CardSpace from './CardSpace.vue'
import PotDisplay from './PotDisplay.vue'
import { usePokerStore } from '../store/pokerStore'

const pokerStore = usePokerStore()

defineProps({
  pot: { type: [Number, String], default: 0 },
  communityCards: { type: Array, default: () => [] },
  players: { type: Array, default: () => [] },
  myPlayer: Object,
  activePlayerId: String,
})

const windowWidth = ref(window.innerWidth)
const updateWidth = () => {
  windowWidth.value = window.innerWidth
}

const cardSize = computed(() => {
  if (windowWidth.value < 640) return 'small'
  if (windowWidth.value < 1024) return 'medium'
  return 'large'
})

onMounted(() => window.addEventListener('resize', updateWidth))
onUnmounted(() => window.removeEventListener('resize', updateWidth))
</script>
