<template>
  <div
    id="poker-viewport"
    class="w-full h-full flex flex-col md:flex-row md:overflow-hidden bg-neutral-950 overflow-y-auto"
  >
    <!-- LEFT: 65% Table Surface -->
    <div
      id="table-container"
      class="w-full md:w-[65%] shrink-0 h-auto min-h-[50vh] md:h-full relative flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      <div
        id="main-table-surface"
        class="w-full h-full min-h-[280px] sm:min-h-[320px] bg-gradient-to-br from-green-900 to-emerald-950 shadow-2xl relative overflow-hidden flex items-center justify-center rounded-xl md:rounded-2xl border-0"
      >
        <!-- Modern Grid Pattern -->
        <div
          class="absolute inset-0 opacity-[0.03] pointer-events-none"
          style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 40px 40px;"
        ></div>

        <!-- Subtle Inner Glow -->
        <div class="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.6)] pointer-events-none"></div>

        <!-- CENTER ZONE: Pot & Community Cards -->
        <div
          id="table-center-zone"
          class="relative z-10 w-full flex flex-col items-center justify-center px-4 transition-all duration-300"
        >
          <!-- Pot -->
          <div
            id="pot-display"
            class="mb-6 md:mb-10 bg-black/40 backdrop-blur-md px-6 md:px-10 py-2 md:py-3 rounded-lg border border-white/5 shadow-2xl"
          >
            <span
              id="pot-amount"
              class="text-xs sm:text-sm md:text-lg text-emerald-400 font-black tracking-[0.4em] md:tracking-[0.6em] uppercase"
              >Total Pot: ${{ pot }}</span
            >
          </div>

          <!-- Community Cards Container -->
          <div 
            id="community-cards-row" 
            class="flex items-center justify-center gap-1 sm:gap-2 md:gap-4 w-full max-w-full overflow-hidden"
          >
            <template v-if="communityCards?.length > 0">
              <Card
                v-for="(c, i) in communityCards"
                :id="'community-card-' + i"
                :key="i"
                :size="windowWidth < 480 ? 'small' : 'medium'"
                :numSymbol="c"
                class="hover:scale-105 transition-transform flex-shrink origin-center"
                :class="[
                  windowWidth < 400 ? 'scale-90' : 'scale-100',
                  'transition-all duration-300'
                ]"
              />
            </template>
            <template v-else>
              <div
                v-for="i in 5"
                :id="'empty-card-slot-' + i"
                :key="i"
                class="w-10 h-14 sm:w-16 sm:h-24 md:w-24 md:h-32 rounded-lg md:rounded-xl bg-black/20 border border-white/5 flex items-center justify-center flex-shrink"
              >
                <div class="w-1.5 h-1.5 rounded-full bg-white/5"></div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT: 35% Players Column -->
    <div
      id="players-sidepanel"
      class="w-full md:w-[35%] h-auto md:h-full bg-neutral-900/50 backdrop-blur-3xl border-t md:border-t-0 md:border-l border-white/5 p-4 md:p-6 flex flex-col gap-4 md:overflow-y-auto pb-40 md:pb-6"
    >
      <div class="mb-4 flex items-center justify-between px-2">
        <h2 class="text-xs font-black text-gray-500 uppercase tracking-[0.4em]">Players</h2>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span class="text-[10px] font-bold text-gray-400 uppercase">{{ players.length }} Live</span>
        </div>
      </div>
      
      <div class="flex flex-col gap-3">
        <PlayerSeat
          v-for="(p, i) in players"
          :id="'player-seat-' + i"
          :key="p.id"
          :playerName="p.name"
          :playerChips="p.chips"
          :playerBet="p.currentBet || 0"
          :playerAction="p.action"
          :showCards="p.showCards || false"
          :playerCards="p.cards || []"
          :isActive="activePlayerId === p.id"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Card from './Card.vue'
import PlayerSeat from './PlayerSeat.vue'

const props = defineProps({
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

onMounted(() => window.addEventListener('resize', updateWidth))
onUnmounted(() => window.removeEventListener('resize', updateWidth))
</script>
