<template>
  <div
    id="poker-action-hud"
    class="w-full z-50"
  >
    <!-- Turn Timer -->
    <div
      v-if="isMyTurn && progress > 0"
      id="hud-turn-timer-container"
      class="w-full h-0.5 lg:h-1 bg-gray-900/40 backdrop-blur-sm"
    >
      <div
        id="hud-turn-timer-progress"
        class="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(234,179,8,0.4)]"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>

    <div
      id="hud-main-container"
      class="relative w-full pointer-events-auto bg-black/90 backdrop-blur-2xl border-t border-white/5 transition-all duration-700"
      :class="{
        'border-yellow-500/30 shadow-[0_-20px_50px_rgba(0,0,0,0.9)]': isMyTurn,
      }"
    >
      <!-- Background Glow Effect -->
      <div
        v-if="isMyTurn"
        id="hud-turn-glow-effect"
        class="absolute inset-0 bg-yellow-500/[0.03] pointer-events-none animate-pulse"
      ></div>

      <div
        id="hud-content-wrapper"
        class="max-w-[1920px] mx-auto flex flex-row items-center gap-2 lg:gap-6 p-1.5 lg:p-3 lg:px-10 relative overflow-hidden"
      >
        <!-- SECTION 1: CARDS (Horizontal & extra compact on mobile) -->
        <div id="hud-cards-area" class="shrink-0">
          <div
            id="hud-cards-container"
            class="flex items-center p-1 bg-white/5 rounded-lg border border-white/5 shadow-inner"
          >
            <div id="hud-cards-flex" class="flex gap-0.5 lg:gap-1 items-end">
              <template v-if="playerCards?.length">
                <Card
                  v-for="(card, i) in playerCards"
                  :id="'hud-card-item-' + i"
                  :key="'player-' + i"
                  :size="'small'"
                  :percentage="55"
                  :numSymbol="card"
                  class="shadow-xl transition-all"
                />
              </template>
              <template v-else>
                <div
                  id="hud-cards-placeholder"
                  class="flex gap-0.5 lg:gap-1 items-end"
                >
                  <CardBack
                    id="hud-card-back-1"
                    :size="'small'"
                    :percentage="55"
                    class="opacity-20 shadow-xl"
                  />
                  <CardBack
                    id="hud-card-back-2"
                    :size="'small'"
                    :percentage="55"
                    class="opacity-20 shadow-xl"
                  />
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- SECTION 2: INFO & FINANCE (Horizontal flow) -->
        <div id="hud-info-column" class="flex flex-col lg:flex-row items-center gap-2 flex-1 min-w-0">
          <!-- Finance (Stack/Bet) - Compact Row -->
          <div
            id="hud-finance-wrapper"
            class="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 w-full lg:w-auto justify-around shrink-0"
          >
            <div id="hud-stack-display" class="flex flex-col items-center">
              <span class="hidden sm:block text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Stack</span>
              <div class="flex items-baseline gap-0.5">
                <span class="text-[9px] font-bold text-yellow-500/80">$</span>
                <span class="text-sm lg:text-xl font-mono font-black text-white leading-none">{{ balance }}</span>
              </div>
            </div>
            <div class="w-px h-4 bg-white/10"></div>
            <div id="hud-bet-display" class="flex flex-col items-center">
              <span class="hidden sm:block text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Bet</span>
              <div class="flex items-baseline gap-0.5">
                <span class="text-[9px] font-bold text-yellow-500/80">$</span>
                <span class="text-sm lg:text-xl font-mono font-black text-white leading-none">{{ isMyTurn ? betAmount : currentBet }}</span>
              </div>
            </div>
          </div>

          <!-- Odds (Extra compact or hidden on small mobile) -->
          <div
            id="hud-odds-wrapper"
            class="hidden sm:flex flex-1 w-full scale-90 lg:scale-100 origin-left transition-all duration-500"
            :class="{ 'opacity-20 grayscale pointer-events-none': !playerCards?.length }"
          >
            <OddsDisplay
              class="w-full"
              :winProb="pokerStore.getOdds.win"
              :tieProb="pokerStore.getOdds.tie"
              :handName="pokerStore.getCurrentHand?.pokerHand"
              :handRank="pokerStore.getCurrentHand?.prizeRank"
            />
          </div>
        </div>

        <!-- SECTION 3: ACTIONS AREA -->
        <div id="hud-actions-area" class="flex flex-col gap-1 lg:gap-2 flex-1 lg:flex-[1.5] min-w-0 justify-center">
          <!-- Raise Slider (Condensed) -->
          <div
            v-if="isMyTurn && (options.includes('bet') || options.includes('raise'))"
            id="hud-raise-slider-container"
            class="flex items-center bg-black/40 p-1 rounded-lg border border-yellow-500/20 h-8 lg:h-12 overflow-hidden"
          >
            <input
              id="hud-bet-range-input"
              type="range"
              v-model.number="betProxy"
              :min="minBet"
              :max="maxBet"
              class="flex-1 h-1 bg-gray-800 rounded-full appearance-none cursor-pointer accent-yellow-500"
            />
            <span class="ml-2 text-[10px] lg:text-sm font-mono font-black text-yellow-500 w-12 lg:w-16 text-right shrink-0">
              ${{ betAmount }}
            </span>
          </div>

          <!-- Waiting State (When not my turn) -->
          <div
            v-else-if="!isMyTurn"
            id="hud-waiting-state"
            class="h-8 lg:h-12 flex items-center justify-center gap-2 bg-yellow-500/5 rounded-lg border border-white/5 px-3"
          >
            <div class="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping shrink-0"></div>
            <span class="text-[9px] lg:text-xs font-black text-yellow-500/60 uppercase tracking-widest truncate">
              Wait: {{ activePlayerName }}
            </span>
          </div>

          <!-- Action Buttons -->
          <div id="hud-buttons-container" class="flex gap-1 lg:gap-2 items-stretch h-8 lg:h-12">
            <template v-if="canBlind">
              <button
                @click="$emit('action', 'blind')"
                class="flex-1 bg-yellow-500 text-black text-[10px] lg:text-sm font-black uppercase rounded-lg shadow-lg active:scale-95"
              >Post Blind</button>
            </template>
            <template v-else>
              <button
                v-if="options.includes('fold') || !isMyTurn"
                @click="$emit('action', 'fold')"
                :disabled="!isMyTurn"
                class="flex-1 bg-white/5 border border-white/10 text-gray-400 text-[10px] lg:text-sm font-black uppercase rounded-lg hover:bg-red-600/20 disabled:opacity-10"
              >Fold</button>
              <button
                v-if="options.includes('check') || !isMyTurn"
                @click="$emit('action', 'check')"
                :disabled="!isMyTurn"
                class="flex-1 bg-white/5 border border-white/10 text-gray-300 text-[10px] lg:text-sm font-black uppercase rounded-lg hover:bg-white/10 disabled:opacity-10"
              >Check</button>
              <button
                v-if="options.includes('call') || !isMyTurn"
                @click="$emit('action', 'call')"
                :disabled="!isMyTurn"
                class="flex-1 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] lg:text-sm font-black uppercase rounded-lg hover:bg-blue-600 disabled:opacity-10"
              >Call</button>
              <button
                v-if="options.includes('bet') || options.includes('raise') || !isMyTurn"
                @click="$emit('action', options.includes('bet') ? 'bet' : 'raise')"
                :disabled="!isMyTurn || !canRaise"
                class="px-3 lg:px-10 bg-yellow-500 text-black text-[10px] lg:text-sm font-black uppercase rounded-lg shadow-lg disabled:opacity-10"
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

const responsive = useResponsiveStore()
const pokerStore = usePokerStore()

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

const progress = ref(100)
const hasMoved = ref(false)
let timerInterval = null

const activePlayerName = computed(() => {
  const activeId = pokerStore.getActivePlayerId
  if (!activeId) return 'others'
  const player = pokerStore.getPlayers.find((p) => p.id === activeId)
  return player ? player.name : 'others'
})

const canRaise = computed(() => {
  if (!props.isMyTurn) return false
  const hasIncreased = props.betAmount > props.minBet
  return hasIncreased && (props.options.includes('bet') || props.options.includes('raise'))
})

const betProxy = computed({
  get: () => props.betAmount,
  set: (val) => {
    hasMoved.value = true
    emit('update:betAmount', Math.min(props.maxBet, Math.max(props.minBet, val)))
  },
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
    hasMoved.value = false
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(updateProgress, 100)
  } else {
    clearInterval(timerInterval)
    progress.value = 0
  }
}, { immediate: true })

watch(() => [props.minBet, props.maxBet], () => {
  if (props.betAmount < props.minBet) emit('update:betAmount', props.minBet)
  if (props.betAmount > props.maxBet) emit('update:betAmount', props.maxBet)
})
</script>

<style scoped>
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: #eab308;
  border-radius: 99px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}
input[type='range']::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #eab308;
  border-radius: 99px;
  cursor: pointer;
}
</style>
