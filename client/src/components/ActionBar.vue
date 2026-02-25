<template>
  <div id="poker-action-hud" class="fixed bottom-0 left-0 right-0 z-50 p-3 pointer-events-none">
    <div id="hud-main-container" class="max-w-5xl mx-auto flex items-center justify-between gap-4 pointer-events-auto bg-gray-900/90 backdrop-blur-2xl border border-white/10 p-2 px-5 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      
      <!-- SECCIÓN INFO (Your Stack) -->
      <div id="hud-user-info" class="flex items-center gap-4 border-r border-white/10 pr-5">
        <div class="flex flex-col">
          <span id="label-stack" class="text-[7px] font-black text-gray-500 uppercase tracking-widest">Your Chips</span>
          <span id="display-balance" class="text-lg font-mono font-black text-white leading-none">${{ balance }}</span>
        </div>
      </div>

      <!-- SECCIÓN RAISE (DISEÑO SLIM & INTEGRADO) -->
      <div v-if="isMyTurn && (options.includes('bet') || options.includes('rise'))" 
           id="hud-raise-controls" class="flex items-center gap-4 px-2 flex-grow justify-center">
        
        <div class="flex flex-col items-end min-w-[60px]">
          <span id="label-raise-to" class="text-[7px] font-black text-yellow-500 uppercase">Raise To</span>
          <span id="display-raise-amount" class="text-md font-mono font-bold text-white leading-none">${{ currentBetAmount }}</span>
        </div>

        <!-- Slider reducido (Ancho controlado) -->
        <input id="input-bet-range" 
               type="range" 
               :value="currentBetAmount" 
               @input="$emit('update:betAmount', $event.target.value)"
               :min="minBet" :max="maxBet"
               class="w-24 md:w-40 h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-yellow-500 border border-white/5">

        <div id="quick-bet-group" class="flex gap-1">
          <button id="btn-quick-half" @click="$emit('setQuickBet', 0.5)" class="chip-btn-tiny">1/2</button>
          <button id="btn-quick-pot" @click="$emit('setQuickBet', 1)" class="chip-btn-tiny">POT</button>
          <button id="btn-quick-max" @click="$emit('setQuickBet', 'all')" class="chip-btn-tiny text-red-400 border-red-900/30 hover:bg-red-900/20">ALL</button>
        </div>
      </div>

      <!-- SECCIÓN ACCIONES -->
      <div id="hud-actions-group" class="flex gap-2 items-center">
        <template v-if="canBlind">
           <button id="btn-action-blind" @click="$emit('action', 'blind')" 
             class="btn-compact bg-purple-600 border-purple-500 text-white font-black px-6 hover:bg-purple-500">
             Post Blind
           </button>
        </template>

        <template v-else-if="isMyTurn">
          <button v-if="options.includes('fold')" id="btn-action-fold" @click="$emit('action', 'fold')" class="btn-compact border-red-500/30 text-red-500 hover:bg-red-500/20">Fold</button>
          <button v-if="options.includes('check')" id="btn-action-check" @click="$emit('action', 'check')" class="btn-compact border-white/10 text-gray-300 hover:bg-white/10">Check</button>
          <button v-if="options.includes('call')" id="btn-action-call" @click="$emit('action', 'call')" class="btn-compact border-blue-500/30 text-blue-500 hover:bg-blue-600/20">Call</button>
          
          <button v-if="options.includes('bet') || options.includes('rise')" 
                  id="btn-action-raise" 
                  @click="$emit('action', options.includes('bet') ? 'bet' : 'raise')" 
                  class="btn-compact bg-yellow-500 text-black border-yellow-600 font-black px-6 hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            {{ options.includes('bet') ? 'BET' : 'RAISE' }}
          </button>
        </template>
        
        <div v-else id="hud-waiting-status" class="flex items-center gap-2 px-4">
           <div class="w-1.5 h-1.5 bg-gray-600 rounded-full animate-pulse"></div>
           <span class="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Waiting...</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import StatusIndicator from './StatusIndicator.vue';

defineProps({
  isMyTurn: Boolean,
  canBlind: Boolean,
  options: { type: Array, default: () => [] },
  balance: { type: Number, default: 0 },
  currentBetAmount: { type: Number, default: 0 },
  minBet: { type: Number, default: 0 },
  maxBet: { type: Number, default: 0 }
});

defineEmits(['action', 'update:betAmount', 'setQuickBet']);
</script>

<style scoped>
/* Botones de acción minimalistas */
.btn-compact {
  @apply px-5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center;
}

/* Chips de apuesta rápida ultra pequeños */
.chip-btn-tiny {
  @apply px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[8px] font-bold text-gray-500 hover:text-white hover:bg-white/10 transition-all uppercase tracking-tight;
}

/* Slider Custom Slim */
#input-bet-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  @apply w-3.5 h-3.5 bg-yellow-500 rounded-full border-2 border-black shadow-md cursor-pointer transition-transform hover:scale-110;
}

/* Para navegadores que no son webkit */
#input-bet-range::-moz-range-thumb {
  @apply w-3.5 h-3.5 bg-yellow-500 rounded-full border-2 border-black shadow-md cursor-pointer transition-transform hover:scale-110;
}
</style>
