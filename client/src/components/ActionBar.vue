<template>
  <div
    id="poker-action-hud"
    class="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
  >
    <div
      id="hud-main-container"
      class="w-full flex flex-wrap md:flex-nowrap items-center justify-center md:justify-between gap-3 md:gap-6 pointer-events-auto bg-gray-900/95 backdrop-blur-3xl border-t p-3 md:p-4 transition-all duration-500"
      :class="
        isMyTurn
          ? 'border-yellow-500/50 shadow-[0_-4px_30px_rgba(234,179,8,0.15)]'
          : 'border-white/10'
      "
    >
      <!-- LEFT: User Info -->
      <div
        id="hud-user-info"
        class="flex items-center gap-6 md:border-r border-white/10 md:pr-8"
      >
        <div class="flex flex-col">
          <span
            id="label-stack"
            class="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1"
            >Your Balance</span
          >
          <div class="flex items-baseline gap-1">
            <span class="text-xs font-bold text-yellow-500">$</span>
            <span
              id="display-balance"
              class="text-lg md:text-2xl font-mono font-black text-white leading-none"
              >{{ balance }}</span
            >
          </div>
        </div>
      </div>

      <!-- MIDDLE-LEFT: Personal Cards -->
      <div
        id="hud-cards-display"
        class="flex gap-2 items-center px-4 md:border-r border-white/10 h-full"
      >
        <template v-if="playerCards && playerCards.length > 0">
          <Card
            v-for="(card, i) in playerCards"
            :key="i"
            size="small"
            :numSymbol="card"
            class="shadow-xl transform hover:-translate-y-2 transition-transform cursor-default scale-110"
          />
        </template>
        <template v-else>
          <div class="flex -space-x-3 opacity-10">
            <div
              class="w-10 h-14 bg-gray-700 border border-white/20 rounded"
            ></div>
            <div
              class="w-10 h-14 bg-gray-700 border border-white/20 rounded"
            ></div>
          </div>
        </template>
      </div>

      <!-- MIDDLE-RIGHT: Bet Controls -->
      <div
        v-if="
          isMyTurn && (options.includes('bet') || options.includes('raise'))
        "
        id="hud-raise-controls"
        class="flex items-center gap-4 md:gap-6 px-4 flex-grow justify-center min-w-full md:min-w-0 order-first md:order-none mb-3 md:mb-0"
      >
        <div class="flex flex-col items-center min-w-[80px]">
          <span
            id="label-raise-to"
            class="text-[8px] font-black text-yellow-500 uppercase mb-1"
            >Raise Amount</span
          >
          <span
            id="display-raise-amount"
            class="text-lg md:text-xl font-mono font-bold text-white leading-none"
            >${{ betAmount }}</span
          >
        </div>

        <div class="flex flex-col items-center gap-2 flex-grow max-w-xs">
          <input
            id="input-bet-range"
            type="range"
            :value="betAmount"
            @input="
              $emit(
                'update:betAmount',
                Math.max(minBet, Number($event.target.value)),
              )
            "
            :min="minBet"
            :max="maxBet"
            class="w-full h-2 bg-gray-800 rounded-none appearance-none cursor-pointer accent-yellow-500 border border-white/5"
          />
          <div class="flex justify-between w-full px-1">
            <span class="text-[7px] text-gray-500 font-bold font-mono"
              >MIN: ${{ minBet }}</span
            >
            <span class="text-[7px] text-gray-500 font-bold font-mono"
              >MAX: ${{ maxBet }}</span
            >
          </div>
        </div>

        <div id="quick-bet-group" class="flex gap-1.5">
          <button
            @click="$emit('setQuickBet', 0.5)"
            class="px-3 py-1.5 bg-white/5 border border-white/10 text-[9px] font-black text-gray-400 hover:text-white hover:bg-white/10 transition-all uppercase"
          >
            1/2
          </button>
          <button
            @click="$emit('setQuickBet', 1)"
            class="px-3 py-1.5 bg-white/5 border border-white/10 text-[9px] font-black text-gray-400 hover:text-white hover:bg-white/10 transition-all uppercase"
          >
            POT
          </button>
          <button
            @click="$emit('setQuickBet', 'all')"
            class="px-3 py-1.5 bg-red-900/20 border border-red-500/30 text-[9px] font-black text-red-400 hover:bg-red-500/30 transition-all uppercase"
          >
            ALL IN
          </button>
        </div>
      </div>

      <!-- RIGHT: Actions -->
      <div id="hud-actions-group" class="flex gap-2 md:gap-3 items-center ml-auto">
        <template v-if="canBlind">
          <button
            @click="$emit('action', 'blind')"
            class="px-8 py-3 bg-purple-600 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95 hover:bg-purple-500 shadow-lg shadow-purple-900/20"
          >
            Post Blind
          </button>
        </template>

        <template v-else-if="isMyTurn">
          <button
            v-if="options.includes('fold')"
            @click="$emit('action', 'fold')"
            class="px-6 py-3 border border-red-500/30 text-red-500 text-xs font-black uppercase tracking-widest transition-all active:scale-95 hover:bg-red-500/10"
          >
            Fold
          </button>
          <button
            v-if="options.includes('check')"
            @click="$emit('action', 'check')"
            class="px-6 py-3 border border-white/10 text-gray-300 text-xs font-black uppercase tracking-widest transition-all active:scale-95 hover:bg-white/5"
          >
            Check
          </button>
          <button
            v-if="options.includes('call')"
            @click="$emit('action', 'call')"
            class="px-6 py-3 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-widest transition-all active:scale-95 hover:bg-blue-600/10"
          >
            Call
          </button>

          <button
            id="raise-button"
            :disabled="betAmount < minBet"
            @click="$emit('action', options.includes('bet') ? 'bet' : 'raise')"
            class="px-8 py-3 bg-yellow-500 text-black text-xs font-black uppercase tracking-widest transition-all active:scale-95 hover:bg-yellow-400 shadow-xl shadow-yellow-900/20 disabled:opacity-50 disabled:grayscale"
          >
            {{ options.includes('bet') ? 'BET' : 'RAISE' }}
          </button>
        </template>

        <div v-else class="flex flex-col items-end px-4">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 bg-yellow-500/50 rounded-full animate-pulse"></div>
            <span class="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]"
              >Waiting...</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Card from './Card.vue'

defineProps({
  isMyTurn: Boolean,
  canBlind: Boolean,
  options: { type: Array, default: () => [] },
  balance: { type: Number, default: 0 },
  betAmount: { type: Number, default: 0 },
  minBet: { type: Number, default: 0 },
  maxBet: { type: Number, default: 0 },
  playerCards: { type: Array, default: () => [] },
})

defineEmits(['action', 'update:betAmount', 'setQuickBet'])
</script>

<style scoped>
#input-bet-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 24px;
  background: #eab308;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}
#input-bet-range::-webkit-slider-thumb:hover {
  background: #facc15;
}
#input-bet-range::-moz-range-thumb {
  width: 16px;
  height: 24px;
  background: #eab308;
  border: none;
  border-radius: 0;
  cursor: pointer;
}
</style>
