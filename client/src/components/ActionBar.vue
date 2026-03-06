<template>
  <div
    id="poker-action-hud"
    class="w-full z-50 shrink-0"
  >
    <!-- Turn Timer -->
    <div
      v-if="isMyTurn && progress > 0"
      id="hud-turn-timer-container"
      class="w-full h-1 bg-gray-900/40 backdrop-blur-sm"
    >
      <div
        id="hud-turn-timer-progress"
        class="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-100 ease-linear"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>

    <div
      id="hud-main-container"
      class="relative w-full pointer-events-auto bg-black/95 backdrop-blur-3xl border-t border-white/10 p-2 lg:p-4"
      :class="{ 'border-yellow-500/40': isMyTurn }"
    >
      <!-- Background active glow -->
      <div
        v-if="isMyTurn"
        class="absolute inset-0 bg-yellow-500/[0.02] pointer-events-none animate-pulse"
      ></div>

      <div
        id="hud-content-wrapper"
        class="max-w-[1600px] mx-auto flex flex-col md:flex-row gap-3 lg:gap-8"
      >
        <!-- SECTION 1: IDENTITY (Cards & Finance) - Always together -->
        <div id="hud-identity-section" class="flex items-center gap-3 shrink-0 justify-between md:justify-start">
          <!-- Cards -->
          <div id="hud-cards-flex" class="flex gap-1 items-end bg-white/5 p-1 rounded-lg border border-white/5">
            <template v-if="playerCards?.length">
              <Card
                v-for="(card, i) in playerCards"
                :key="'player-card-' + i"
                :size="'small'"
                :percentage="responsive.screenSize === 'xsmall' ? 40 : 50"
                :numSymbol="card"
                class="shadow-lg"
              />
            </template>
            <template v-else>
              <CardBack :size="'small'" :percentage="responsive.screenSize === 'xsmall' ? 40 : 50" class="opacity-10" />
              <CardBack :size="'small'" :percentage="responsive.screenSize === 'xsmall' ? 40 : 50" class="opacity-10" />
            </template>
          </div>

          <!-- Stack & Bet -->
          <div class="flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
            <div class="text-center">
              <span class="block text-[8px] font-black text-gray-500 uppercase leading-none mb-1">Stack</span>
              <span class="text-base lg:text-xl font-mono font-black text-white leading-none">${{ balance }}</span>
            </div>
            <div class="w-px h-5 bg-white/10"></div>
            <div class="text-center">
              <span class="block text-[8px] font-black text-emerald-500 uppercase leading-none mb-1">Bet</span>
              <span class="text-base lg:text-xl font-mono font-black text-white leading-none">${{ currentBet }}</span>
            </div>
          </div>
        </div>

        <!-- SECTION 2 & 3 CONTAINER: Logic stack for xsmall -->
        <div 
          id="hud-logic-container" 
          class="flex flex-1 w-full gap-3"
          :class="[responsive.screenSize === 'xsmall' ? 'flex-col' : 'flex-col sm:flex-row md:flex-col lg:flex-row']"
        >
          <!-- hud-info-column: Probabilities and status -->
          <div 
            id="hud-info-column" 
            class="flex-1 flex flex-col justify-center min-w-0"
            :class="[responsive.screenSize === 'xsmall' ? 'order-1' : '']"
          >
            <div
              id="hud-odds-wrapper"
              class="w-full transition-all duration-500"
              :class="{ 'opacity-20 grayscale pointer-events-none': !playerCards?.length }"
            >
              <OddsDisplay 
                :winProb="pokerStore.getOdds.win"
                :tieProb="pokerStore.getOdds.tie"
                :handName="pokerStore.getCurrentHand?.pokerHand"
                :handRank="pokerStore.getCurrentHand?.prizeRank"
              />
            </div>
          </div>

          <!-- hud-actions-area: Buttons and Slider -->
          <div 
            id="hud-actions-area" 
            class="flex-1 flex flex-col gap-2 min-w-0"
            :class="[responsive.screenSize === 'xsmall' ? 'order-2' : '']"
          >
            <!-- Slider -->
            <div
              v-if="isMyTurn && (options.includes('bet') || options.includes('raise'))"
              class="flex items-center gap-3 bg-black/40 p-1.5 rounded-lg border border-yellow-500/20 h-8 lg:h-10"
            >
              <input
                type="range"
                v-model.number="betProxy"
                :min="minBet"
                :max="maxBet"
                class="flex-1 h-1 accent-yellow-500 bg-gray-800 rounded-full appearance-none cursor-pointer"
              />
              <span class="text-xs font-mono font-black text-yellow-500 min-w-[50px] text-right">${{ betAmount }}</span>
            </div>

            <!-- Buttons -->
            <div class="flex gap-1.5 w-full h-9 lg:h-12">
              <button
                v-if="canBlind"
                @click="$emit('action', 'blind')"
                class="flex-1 bg-yellow-500 text-black font-black uppercase rounded-lg shadow-lg active:scale-95 text-[10px] lg:text-sm"
              >Post Blind</button>
              
              <template v-else>
                <button
                  @click="$emit('action', 'fold')"
                  :disabled="!isMyTurn || !options.includes('fold')"
                  class="flex-1 bg-white/5 border border-white/10 text-gray-400 font-black uppercase rounded-lg hover:bg-red-600/20 disabled:opacity-20 text-[10px] lg:text-sm"
                >Fold</button>
                
                <button
                  @click="$emit('action', 'check')"
                  :disabled="!isMyTurn || !options.includes('check')"
                  class="flex-1 bg-white/5 border border-white/10 text-gray-200 font-black uppercase rounded-lg hover:bg-white/10 disabled:opacity-20 text-[10px] lg:text-sm"
                >Check</button>
                
                <button
                  @click="$emit('action', 'call')"
                  :disabled="!isMyTurn || !options.includes('call')"
                  class="flex-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black uppercase rounded-lg hover:bg-blue-600/40 disabled:opacity-20 text-[10px] lg:text-sm"
                >Call</button>
                
                <button
                  @click="$emit('action', options.includes('bet') ? 'bet' : 'raise')"
                  :disabled="!isMyTurn || (!options.includes('bet') && !options.includes('raise'))"
                  class="flex-[1.5] bg-yellow-500 text-black font-black uppercase rounded-lg shadow-lg disabled:opacity-20 text-[10px] lg:text-sm active:scale-95"
                >
                  {{ options.includes('bet') ? 'Bet' : 'Raise' }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Card from './Card.vue'
import CardBack from './CardBack.vue'
import OddsDisplay from './OddsDisplay.vue'
import { usePokerStore } from '../store/pokerStore'
import { useResponsiveStore } from '../store/responsiveStore'

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
const responsive = useResponsiveStore()
const progress = ref(100)
let timerInterval = null

const betProxy = computed({
  get: () => props.betAmount,
  set: (val) => emit('update:betAmount', val),
})

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
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(updateProgress, 100)
  } else {
    clearInterval(timerInterval)
    progress.value = 0
  }
}, { immediate: true })
</script>

<style scoped>
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #eab308;
  border-radius: 50%;
  cursor: pointer;
}
</style>
