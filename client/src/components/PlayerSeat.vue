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
    <div
      v-if="isActive"
      class="absolute inset-0 bg-yellow-500/5 animate-pulse pointer-events-none"
    ></div>

    <!-- Cards Section (Left) -->
    <div class="flex -space-x-6 mr-4 shrink-0">
      <template v-if="showCards && playerCards?.length > 0">
        <Card
          v-for="(c, i) in playerCards"
          :key="i"
          size="small"
          :numSymbol="c"
          class="scale-90 origin-left"
        />
      </template>
      <template v-else>
        <!-- Card Backs -->
        <div
          v-for="i in 2"
          :key="i"
          class="w-10 h-14 bg-neutral-800 border border-white/20 rounded shadow-sm flex items-center justify-center overflow-hidden"
          :class="i > 1 ? '-ml-6' : ''"
        >
          <div
            class="w-full h-full bg-[repeating-linear-gradient(45deg,#222,#222_2px,#333_2px,#333_4px)] opacity-50"
          ></div>
        </div>
      </template>
    </div>

    <!-- Info Section (Right) -->
    <div class="flex-grow flex flex-col justify-center min-w-0">
      <div class="flex justify-between items-center gap-2">
        <span class="text-sm font-bold text-gray-100 truncate">{{
          playerName
        }}</span>
        <div class="flex flex-col items-end">
          <span class="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Stack</span>
          <span class="text-xs font-mono font-black text-yellow-500 leading-none"
            >${{ playerChips }}</span
          >
        </div>
      </div>

      <div class="mt-2 flex justify-between items-center h-6">
        <div class="flex items-center gap-2">
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform -translate-y-1 opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
          >
            <div
              v-if="playerAction"
              class="bg-blue-600 px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-wider"
            >
              {{ playerAction }}
            </div>
          </Transition>
        </div>
        
        <div v-if="playerBet > 0" class="flex flex-col items-end">
          <span class="text-[8px] font-black text-emerald-500/70 uppercase leading-none mb-0.5">Bet</span>
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
