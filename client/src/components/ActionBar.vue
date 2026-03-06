<template>
  <div
    :id="'poker-action-hud-root-container-' + templateSuffix"
    class="w-full z-50 shrink-0"
  >
    <!-- Turn Timer -->
    <div
      v-if="isMyTurn && progress > 0"
      :id="'hud-turn-timer-progress-bar-wrapper-' + templateSuffix"
      class="w-full h-1 bg-gray-900/40 backdrop-blur-sm"
    >
      <div
        :id="'hud-turn-timer-progress-bar-fill-' + templateSuffix"
        class="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(234,179,8,0.3)]"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>

    <div
      :id="'hud-main-actions-container-' + templateSuffix"
      class="relative w-full pointer-events-auto bg-black/95 backdrop-blur-3xl border-t border-white/10 p-2 lg:p-4"
      :class="{ 'border-yellow-500/40 shadow-[0_-15px_40px_rgba(0,0,0,0.8)]': isMyTurn }"
    >
      <div
        :id="'hud-content-layout-wrapper-' + templateSuffix"
        class="max-w-[1600px] mx-auto flex gap-3 lg:gap-8"
        :class="[
          responsive.screenSize === 'xsmall' ? 'flex-col' : 'flex-row items-end'
        ]"
      >
        <!-- LEFT COLUMN: Odds + Identity (Optimized for small) -->
        <div 
          :id="'hud-player-info-column-' + templateSuffix" 
          class="flex flex-col gap-2 shrink-0"
          :class="[responsive.screenSize === 'small' ? 'w-[280px]' : '']"
        >
          <!-- Odds Panel (Now on top for small) -->
          <div
            :id="'hud-hand-odds-display-panel-' + templateSuffix"
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

          <!-- Cards & Finance Row -->
          <div :id="'hud-player-cards-finance-section-' + templateSuffix" class="flex items-center gap-2 justify-between">
            <!-- Cards -->
            <div :id="'hud-player-hand-cards-wrapper-' + templateSuffix" class="flex gap-1 items-end bg-white/5 p-1 rounded-lg border border-white/5">
              <template v-if="playerCards?.length">
                <Card
                  v-for="(card, i) in playerCards"
                  :key="'player-card-' + i"
                  :size="'small'"
                  :percentage="responsive.screenSize === 'xsmall' ? 40 : 45"
                  :numSymbol="card"
                  class="shadow-lg"
                />
              </template>
              <template v-else>
                <CardBack :size="'small'" :percentage="responsive.screenSize === 'xsmall' ? 40 : 45" class="opacity-10" />
                <CardBack :size="'small'" :percentage="responsive.screenSize === 'xsmall' ? 40 : 45" class="opacity-10" />
              </template>
            </div>

            <!-- Finance -->
            <div class="flex flex-1 items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/10 justify-around">
              <div class="text-center">
                <span class="block text-[7px] font-black text-gray-500 uppercase leading-none mb-0.5">Stack</span>
                <span class="text-xs lg:text-lg font-mono font-black text-white leading-none">${{ balance }}</span>
              </div>
              <div class="w-px h-3 bg-white/10"></div>
              <div class="text-center">
                <span class="block text-[7px] font-black text-emerald-500 uppercase leading-none mb-0.5">Bet</span>
                <span class="text-xs lg:text-lg font-mono font-black text-white leading-none">${{ currentBet }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Actions (Takes remaining space) -->
        <div :id="'hud-player-actions-control-area-' + templateSuffix" class="flex flex-col gap-2 flex-1 min-w-0">
          <!-- Slider Area -->
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

          <!-- Waiting State (When not my turn) -->
          <div
            v-else-if="!isMyTurn"
            class="h-8 flex items-center justify-center gap-2 bg-yellow-500/5 rounded-lg border border-white/5 px-3"
          >
            <div class="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping"></div>
            <span class="text-[9px] font-black text-yellow-500/60 uppercase tracking-widest truncate">
              Wait: {{ activePlayerName }}
            </span>
          </div>

          <!-- Action Buttons Row -->
          <div class="flex gap-1.5 w-full h-10 lg:h-12">
            <template v-if="canBlind">
              <button
                @click="$emit('action', 'blind')"
                class="flex-1 bg-yellow-500 text-black font-black uppercase rounded-lg shadow-lg active:scale-95 text-[10px] lg:text-sm"
              >Post Blind</button>
            </template>
            
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
                :disabled="isRaiseActionDisabled"
                class="flex-[1.5] bg-yellow-500 text-black font-black uppercase rounded-lg shadow-lg disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed text-[10px] lg:text-sm active:scale-95 transition-all"
              >
                {{ options.includes('bet') ? 'Bet' : 'Raise' }}
              </button>
            </template>
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

const templateSuffix = computed(() => {
  const size = responsive.screenSize
  return 'Template' + size.charAt(0).toUpperCase() + size.slice(1)
})

const isRaiseActionDisabled = computed(() => {
  if (!props.isMyTurn) return true
  const hasActionOption = props.options.includes('bet') || props.options.includes('raise')
  if (!hasActionOption) return true

  // Disable if amount hasn't been increased from the original minimum
  // Exception: Allow if it's an All-in situation (betAmount equals maxBet)
  return props.betAmount <= props.minBet && props.betAmount < props.maxBet
})

const activePlayerName = computed(() => {
  const activeId = pokerStore.getActivePlayerId
  if (!activeId) return 'others'
  const player = pokerStore.getPlayers.find((p) => p.id === activeId)
  return player ? player.name : 'others'
})

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
