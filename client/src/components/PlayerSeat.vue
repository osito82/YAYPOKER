<template>
  <div
    :id="'seat-wrapper-' + playerName"
    class="relative group flex items-center p-3 rounded-xl border transition-all duration-300 w-full overflow-hidden"
    :class="
      isActive
        ? 'bg-yellow-500/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] scale-[1.02]'
        : 'bg-black/40 border-white/10 hover:bg-black/60'
    "
  >
    <!-- Active Turn Pulse -->
    <div id="playerSeat"
      v-if="isActive"
      class="absolute inset-0 bg-yellow-500/5 animate-pulse pointer-events-none"
    ></div>

    <!-- Cards Section (Left) -->
  <div class="flex mr-4 shrink-0">
  <template v-if="showCards && playerCards?.length > 0">
    <Card
      v-for="(c, i) in playerCards"
      :key="i"
      size="small"
      :numSymbol="c"
      class="scale-90 origin-left"
      :class="i > 0 ? '-ml-6' : ''"
    />
  </template>
  <template v-else>
    <CardBack
      v-for="i in 2"
      :key="i"
      size="small"
      class="scale-90 origin-left"
      :class="i > 1 ? '-ml-6' : ''"
    />
  </template>
</div>

    <!-- Info Section (Right) -->
    <div class="flex-grow flex flex-col justify-center min-w-0">
      <div class="flex justify-between items-start mb-1">
        <span class="text-base font-black text-gray-100 truncate leading-tight">{{
          playerName
        }}</span>
        <div class="flex flex-col items-end shrink-0 ml-2">
          <span class="text-[9px] font-black text-gray-500 uppercase tracking-tighter leading-none mb-0.5">Stack</span>
          <span class="text-xs font-mono font-black text-yellow-500 leading-none"
            >${{ playerChips }}</span
          >
        </div>
      </div>

      <div class="mt-1 flex justify-between items-end h-7">
        <div class="flex flex-col">
          <span class="text-[8px] font-black text-blue-500/70 uppercase tracking-wider leading-none mb-1">Last Action</span>
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform -translate-y-1 opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
            mode="out-in"
          >
            <div
              v-if="playerAction"
              :key="playerAction"
              class="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none"
            >
              {{ playerAction }}
            </div>
            <div v-else class="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none italic">
              ...
            </div>
          </Transition>
        </div>
        
        <div v-if="playerBet > 0" class="flex flex-col items-end shrink-0 ml-2">
          <span class="text-[8px] font-black text-emerald-500/70 uppercase leading-none mb-1">Bet</span>
          <span class="text-xs font-mono font-black text-emerald-400 leading-none">
            ${{ playerBet }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Card from './Card.vue'
import CardBack from './CardBack.vue';

defineProps({
  playerName: { type: String, default: 'Guest' },
  playerChips: { type: Number, default: 0 },
  playerBet: { type: Number, default: 0 },
  playerAction: { type: String, default: '' },
  playerCards: { type: Array, default: () => [] },
  showCards: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
})
</script>
