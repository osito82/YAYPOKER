<template>
  <div id="poker-action-hud" class="fixed bottom-0 left-0 right-0 z-50 p-2 md:p-3 pointer-events-none">
    <div id="hud-main-container" 
         class="max-w-5xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-center md:justify-between gap-2 md:gap-4 pointer-events-auto bg-gray-900/90 backdrop-blur-2xl border p-2 px-3 md:px-5 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-500"
         :class="isMyTurn ? 'border-yellow-500/50 bg-gray-800/95 shadow-[0_-10px_40px_rgba(234,179,8,0.2)]' : 'border-white/10'">
      
      <div id="hud-user-info" class="flex items-center gap-4 md:border-r border-white/10 md:pr-5">
        <div class="flex flex-col">
          <span id="label-stack" class="text-[7px] font-black text-gray-500 uppercase tracking-widest">Your Chips</span>
          <span id="display-balance" class="text-base md:text-lg font-mono font-black text-white leading-none">${{ balance }}</span>
        </div>
      </div>

      <div id="hud-cards-display" class="flex gap-1 items-center px-2 md:px-4 md:border-r border-white/10">
        <template v-if="playerCards && playerCards.length > 0">
          <Card 
            v-for="(card, i) in playerCards" 
            :key="i" 
            size="small" 
            :numSymbol="card"
            class="shadow-lg transform hover:scale-110 transition-transform cursor-default scale-90 md:scale-100" 
          />
        </template>
        <template v-else>
          <div class="flex -space-x-2 opacity-20">
            <div class="w-6 h-10 md:w-8 md:h-12 bg-gray-800 border border-white/10 rounded-md"></div>
            <div class="w-6 h-10 md:w-8 md:h-12 bg-gray-800 border border-white/10 rounded-md"></div>
          </div>
        </template>
      </div>

      <div v-if="isMyTurn && (options.includes('bet') || options.includes('raise'))" 
           id="hud-raise-controls" class="flex items-center gap-2 md:gap-4 px-2 flex-grow justify-center min-w-full md:min-w-0 order-first md:order-none mb-2 md:mb-0">
        
        <div class="flex flex-col items-end min-w-[50px] md:min-w-[60px]">
          <span id="label-raise-to" class="text-[7px] font-black text-yellow-500 uppercase">Raise To</span>
          <span id="display-raise-amount" class="text-sm md:text-md font-mono font-bold text-white leading-none">${{ betAmount }}</span>
        </div>

        <input id="input-bet-range" 
               type="range" 
               :value="betAmount" 
               @input="$emit('update:betAmount', Number($event.target.value))"
               :min="minBet" :max="maxBet"
               class="w-32 md:w-40 h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-yellow-500 border border-white/5">

        <div id="quick-bet-group" class="flex gap-1">
          <button @click="$emit('setQuickBet', 0.5)" class="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[8px] font-bold text-gray-500 hover:text-white hover:bg-white/10 transition-all uppercase tracking-tight">1/2</button>
          <button @click="$emit('setQuickBet', 1)" class="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[8px] font-bold text-gray-500 hover:text-white hover:bg-white/10 transition-all uppercase tracking-tight">POT</button>
          <button @click="$emit('setQuickBet', 'all')" class="px-2 py-1 bg-white/5 border border-red-900/30 rounded-md text-[8px] font-bold text-red-400 hover:bg-red-500/10 transition-all uppercase tracking-tight">ALL</button>
        </div>
      </div>

      <div id="hud-actions-group" class="flex gap-1 md:gap-2 items-center">
        <template v-if="canBlind">
           <button @click="$emit('action', 'blind')" 
             class="px-4 md:px-6 py-2 rounded-xl border border-purple-500 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center hover:bg-purple-500">
             Post Blind
           </button>
        </template>

        <template v-else-if="isMyTurn">
          <button v-if="options.includes('fold')" @click="$emit('action', 'fold')" class="px-5 py-2 rounded-xl border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center hover:bg-red-500/20">Fold</button>
          <button v-if="options.includes('check')" @click="$emit('action', 'check')" class="px-5 py-2 rounded-xl border border-white/10 text-gray-300 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center hover:bg-white/10">Check</button>
          <button v-if="options.includes('call')" @click="$emit('action', 'call')" class="px-5 py-2 rounded-xl border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center hover:bg-blue-600/20">Call</button>
          
          <button id="raise-button" 
                  :disabled="betAmount <= minBet"
                  @click="$emit('action', options.includes('bet') ? 'bet' : 'raise')" 
                  class="px-4 md:px-6 py-2 rounded-xl border border-yellow-600 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale">
            {{ options.includes('bet') ? 'BET' : 'RAISE' }}
          </button>
        </template>
        
        <div v-else class="flex items-center gap-2 px-2 md:px-4">
           <div class="w-1.5 h-1.5 bg-gray-600 rounded-full animate-pulse"></div>
           <span class="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Opponents Turn</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Card from "./Card.vue";

defineProps({
  isMyTurn: Boolean,
  canBlind: Boolean,
  options: { type: Array, default: () => [] },
  balance: { type: Number, default: 0 },
  betAmount: { type: Number, default: 0 },
  minBet: { type: Number, default: 0 },
  maxBet: { type: Number, default: 0 },
  playerCards: { type: Array, default: () => [] }
});

defineEmits(['action', 'update:betAmount', 'setQuickBet']);
</script>

<style scoped>
/* Los estilos de los selectores nativos del input range siguen aquí porque no se pueden poner en clases de Tailwind directamente de forma limpia */
#input-bet-range::-webkit-slider-thumb { 
  -webkit-appearance: none; 
  width: 14px;
  height: 14px;
  background: #eab308; /* yellow-500 */
  border-radius: 9999px;
  border: 2px solid black;
  cursor: pointer;
  transition: transform 0.2s;
}
#input-bet-range::-webkit-slider-thumb:hover { transform: scale(1.1); }
#input-bet-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #eab308;
  border-radius: 9999px;
  border: 2px solid black;
  cursor: pointer;
}
</style>