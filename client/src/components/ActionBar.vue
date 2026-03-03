<template>
  <div
    id="poker-action-hud"
    class="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
  >
    <!-- Turn Timer (Ultra-slim) -->
    <div
      v-if="isMyTurn && progress > 0"
      id="turn-timer-container"
      class="w-full h-1 bg-gray-900/40 backdrop-blur-sm pointer-events-auto"
    >
      <div
        id="turn-timer-progress"
        class="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(234,179,8,0.4)]"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>

    <div
      id="hud-main-container"
      class="relative w-full pointer-events-auto bg-black/80 backdrop-blur-2xl border-t border-white/5 transition-all duration-700"
      :class="{ 'border-yellow-500/30 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]': isMyTurn }"
    >
      <!-- Background Glow (Turn only) -->
      <div v-if="isMyTurn" class="absolute inset-0 bg-yellow-500/5 pointer-events-none animate-pulse"></div>

      <div id="hud-content-wrapper" class="max-w-[1920px] mx-auto grid grid-cols-2 lg:flex lg:items-center lg:justify-between gap-3 lg:gap-6 p-2.5 lg:px-10 relative">
        
        <!-- IDENTITY: Cards & Odds (Mobile: Left) -->
        <div id="hud-identity-group" class="flex items-center gap-3">
          <div id="cards-visual-container" class="flex items-center p-1 bg-white/5 rounded-lg border border-white/5 ring-1 ring-inset ring-white/5 shadow-inner">
            <div id="player-cards-flex" class="flex gap-1">
              <template v-if="playerCards?.length">
                <Card
                  v-for="(card, i) in playerCards"
                  :key="'player-' + i"
                  size="small"
                  :numSymbol="card"
                  class="w-9 h-13 lg:w-11 lg:h-15 shadow-2xl transition-all hover:scale-105"
                />
              </template>
              <template v-else>
                <div class="flex -space-x-3 opacity-10">
                  <div class="w-9 h-13 lg:w-11 lg:h-15 bg-gray-800 border border-white/10 rounded-md"></div>
                  <div class="w-9 h-13 lg:w-11 lg:h-15 bg-gray-800 border border-white/10 rounded-md"></div>
                </div>
              </template>
            </div>
          </div>
          <div v-if="playerCards?.length" class="shrink-0">
            <OddsDisplay 
              :winProb="pokerStore.getOdds.win" 
              :tieProb="pokerStore.getOdds.tie" 
              :handName="pokerStore.getCurrentHand?.pokerHand"
              :handRank="pokerStore.getCurrentHand?.prizeRank"
            />
          </div>
        </div>

        <!-- FINANCE: Stack & Bet (Mobile: Right) -->
        <div id="hud-finance-group" class="flex items-center justify-end lg:justify-center gap-6 lg:px-10 lg:border-x border-white/10">
          <div class="flex flex-col items-end lg:items-center">
            <span class="text-[8px] font-black text-gray-500 uppercase tracking-widest opacity-60">Stack</span>
            <div class="flex items-baseline gap-1">
              <span class="text-[10px] font-bold text-yellow-500/80">$</span>
              <span class="text-xl lg:text-2xl font-mono font-black text-white tracking-tight">{{ balance }}</span>
            </div>
          </div>
          <div class="flex flex-col items-end lg:items-center">
            <span class="text-[8px] font-black text-emerald-500 uppercase tracking-widest opacity-60">In Play</span>
            <div class="flex items-baseline gap-1">
              <span class="text-[10px] font-bold text-emerald-500/80">$</span>
              <span class="text-xl lg:text-2xl font-mono font-black text-white tracking-tight">{{ currentBet }}</span>
            </div>
          </div>
        </div>

        <!-- ACTIONS: Slider & Buttons (Mobile: Bottom Full-width) -->
        <div id="hud-actions-group-container" class="col-span-2 lg:flex-1 flex flex-col gap-2 min-w-0">
          <!-- Raise Slider (Turn Only) -->
          <Transition name="slide-up">
            <div
              v-if="isMyTurn && (options.includes('bet') || options.includes('raise'))"
              class="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/5 shadow-inner"
            >
              <div class="bg-black/40 px-3 py-1.5 rounded-lg min-w-[75px] border border-white/5 flex flex-col items-center">
                <span class="text-[7px] font-black text-yellow-500 uppercase leading-none mb-1">Bet To</span>
                <span class="text-base font-mono font-black text-white leading-none">${{ betAmount }}</span>
              </div>
              
              <div class="flex-1 flex flex-col gap-0.5 px-1">
                <input
                  type="range"
                  v-model.number="betProxy"
                  :min="minBet"
                  :max="maxBet"
                  class="w-full h-1 bg-gray-800 rounded-full appearance-none cursor-pointer accent-yellow-500 transition-all hover:bg-gray-700"
                />
                <div class="flex justify-between">
                  <span class="text-[7px] text-gray-500 font-bold">Min ${{ minBet }}</span>
                  <span class="text-[7px] text-gray-500 font-bold">Max ${{ maxBet }}</span>
                </div>
              </div>

              <button
                @click="setQuick('all')"
                class="px-3 py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-[9px] font-black uppercase transition-all rounded-lg border border-red-500/20"
              >All-In</button>
            </div>
          </Transition>

          <!-- Action Buttons -->
          <div id="hud-buttons-flex" class="flex gap-1.5 items-stretch h-11 lg:h-12">
            <template v-if="canBlind">
              <button
                @click="$emit('action', 'blind')"
                class="flex-1 bg-gradient-to-b from-purple-500 to-purple-700 text-white text-[11px] font-black uppercase tracking-wider hover:from-purple-400 hover:to-purple-600 shadow-lg rounded-lg transition-all active:scale-95"
              >Post Blind</button>
            </template>

            <template v-else-if="isMyTurn">
              <button
                v-if="options.includes('fold')"
                @click="$emit('action', 'fold')"
                class="flex-1 bg-white/5 border border-white/10 text-gray-400 hover:bg-red-600/20 hover:text-red-400 hover:border-red-500/30 text-[11px] font-black uppercase transition-all rounded-lg"
              >Fold</button>
              
              <button
                v-if="options.includes('check')"
                @click="$emit('action', 'check')"
                class="flex-1 bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white text-[11px] font-black uppercase transition-all rounded-lg"
              >Check</button>
              
              <button
                v-if="options.includes('call')"
                @click="$emit('action', 'call')"
                class="flex-1 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white text-[11px] font-black uppercase transition-all rounded-lg"
              >Call</button>

              <button
                :disabled="!canRaise"
                @click="$emit('action', options.includes('bet') ? 'bet' : 'raise')"
                class="px-6 lg:px-12 bg-gradient-to-b from-yellow-400 to-yellow-600 text-black text-[11px] font-black uppercase tracking-wider hover:from-yellow-300 hover:to-yellow-500 shadow-xl disabled:opacity-20 disabled:grayscale rounded-lg transition-all active:scale-95"
              >{{ options.includes('bet') ? 'BET' : 'RAISE' }}</button>
            </template>

            <div v-else class="flex-1 flex items-center justify-center gap-3 bg-white/5 rounded-lg border border-white/5">
              <div class="w-1 h-1 bg-yellow-500 rounded-full animate-ping"></div>
              <span class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Waiting...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import Card from './Card.vue'
import OddsDisplay from './OddsDisplay.vue'
import { usePokerStore } from '../store/pokerStore'

const props = defineProps({
  isMyTurn: Boolean,
  canBlind: Boolean,
  options: { type: Array, default: () => [] },
  balance: { type: Number, default: 0 },
  currentBet: { type: Number, default: 0 },
  betAmount: { type: Number, default: 0 },
  minBet: { type: Number, default: 0 },
  maxBet: { type: Number, default: 0 },
  playerCards: { type: Array, default: () => [] },
})

const emit = defineEmits(['action', 'update:betAmount', 'setQuickBet'])

const pokerStore = usePokerStore()
const progress = ref(100)
const hasMoved = ref(false)
let timerInterval = null

const canRaise = computed(() => betProxy.value > props.minBet)

const betProxy = computed({
  get: () => props.betAmount,
  set: (val) => {
    hasMoved.value = true
    emit('update:betAmount', Math.min(props.maxBet, Math.max(props.minBet, val)))
  }
})

const setQuick = (ratio) => {
  hasMoved.value = true
  emit('setQuickBet', ratio)
}

const updateProgress = () => {
  if (!pokerStore.getAutofoldStartTime || !props.isMyTurn) {
    progress.value = 0
    return
  }
  const elapsed = (Date.now() - pokerStore.getAutofoldStartTime) / 1000
  const remaining = Math.max(0, pokerStore.getAutofoldDuration - elapsed)
  progress.value = (remaining / pokerStore.getAutofoldDuration) * 100
  if (remaining <= 0) clearInterval(timerInterval)
}

watch(() => props.isMyTurn, (newVal) => {
  if (newVal) {
    hasMoved.value = false
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(updateProgress, 100)
  } else {
    clearInterval(timerInterval)
    progress.value = 0
  }
})

watch(() => [props.minBet, props.maxBet], () => {
  if (props.betAmount < props.minBet) emit('update:betAmount', props.minBet)
  if (props.betAmount > props.maxBet) emit('update:betAmount', props.maxBet)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: #eab308;
  border-radius: 99px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
}
input[type=range]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #eab308;
  border-radius: 99px;
  cursor: pointer;
}
</style>
