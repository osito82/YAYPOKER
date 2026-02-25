<template>
  <div id="poker-viewport" class="relative w-full max-w-[95vw] aspect-[2.5/1] mx-auto flex items-center justify-center p-8 select-none">
    
    <!-- LAYER 0: The Felt (Stadium Shape) -->
    <div id="table-felt-container" class="absolute inset-0 flex items-center justify-center z-0">
      <div id="main-table-surface" class="w-full h-[85%] bg-gradient-to-b from-green-800 to-green-950 border-[10px] border-yellow-950 rounded-[160px] shadow-[0_25px_80px_rgba(0,0,0,0.7)] relative overflow-hidden">
        <!-- Inner Rail -->
        <div id="table-inner-line" class="absolute inset-6 border border-white/10 rounded-[140px] pointer-events-none"></div>
      </div>
    </div>

    <!-- LAYER 1: Game State (Cards & Pot) -->
    <div id="table-center-zone" class="relative z-10 flex flex-col items-center justify-center scale-90">
      <!-- Pot -->
      <div id="pot-display" class="mb-4 bg-black/60 backdrop-blur-md px-5 py-1.5 rounded-full border border-yellow-500/30 shadow-lg">
        <span id="pot-amount" class="text-[10px] text-yellow-500 font-black tracking-[0.4em] uppercase">POT: ${{ pot }}</span>
      </div>
      <!-- Community Cards -->
      <div id="community-cards-row" class="flex gap-2">
        <template v-if="communityCards?.length > 0">
          <Card v-for="(c, i) in communityCards" :id="'community-card-' + i" :key="i" size="medium" :numSymbol="c" />
        </template>
        <template v-else>
          <div v-for="i in 5" :id="'empty-card-slot-' + i" :key="i" class="w-14 h-20 rounded-lg bg-black/30 border border-white/5 opacity-20"></div>
        </template>
      </div>
    </div>

    <!-- LAYER 2: Players -->
    <div id="player-seats-overlay" class="absolute inset-0 z-20 pointer-events-none">
       <div v-for="(p, i) in opponents" :id="'player-seat-' + i" :key="p.id" 
            class="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
            :style="getSeatPosition(i, opponents.length)">
         <PlayerSeat v-bind="p" :id="'player-avatar-' + p.id" :isActive="activePlayerId === p.id" />
       </div>
    </div>

  </div>
</template>

<script setup>
import Card from './Card.vue';
import CardSpace from './CardSpace.vue';
import PotDisplay from './PotDisplay.vue';
import PlayerSeat from './PlayerSeat.vue';

const props = defineProps({
  pot: { type: [Number, String], default: 0 },
  communityCards: { type: Array, default: () => [] },
  opponents: { type: Array, default: () => [] },
  myPlayer: Object,
  activePlayerId: String
});

const getSeatPosition = (index, total) => {
  // Elliptical positioning for stadium shape
  const angle = (index / total) * 2 * Math.PI;
  // X radius is slightly less than 50% to stay on screen
  // Y radius accounts for aspect ratio
  const x = 50 + 45 * Math.cos(angle); 
  const y = 45 + 38 * Math.sin(angle);
  return { left: `${x}%`, top: `${y}%` };
};
</script>
