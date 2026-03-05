<template>
  <div
    id="poker-action-hud"
    class="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
  >
    <!-- Turn Timer -->
    <div
      v-if="isMyTurn && progress > 0"
      id="hud-turn-timer-container"
      class="w-full h-0.5 lg:h-1 bg-gray-900/40 backdrop-blur-sm pointer-events-auto"
    >
      <div
        id="hud-turn-timer-progress"
        class="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(234,179,8,0.4)]"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>

    <div
      id="hud-main-container"
      class="relative w-full pointer-events-auto bg-black/85 backdrop-blur-2xl border-t border-white/5 transition-all duration-700"
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
        class="max-w-[1920px] mx-auto flex flex-col lg:flex-row items-center gap-2 lg:gap-6 p-1.5 lg:p-3 lg:px-10 relative overflow-hidden"
      >
        <!-- SECTION 1: CARDS -->
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
                  :size="responsive.cardSize"
                  :percentage="responsive.cardPercentage"
                  :numSymbol="card"
                  class="shadow-xl transition-all hover:scale-105"
                />
              </template>
              <template v-else>
                <div
                  id="hud-cards-placeholder"
                  class="flex gap-0.5 lg:gap-1 items-end"
                >
                  <CardBack
                    id="hud-card-back-1"
                    :size="responsive.cardSize"
                    :percentage="responsive.cardPercentage"
                    class="opacity-20 shadow-xl"
                  />
                  <CardBack
                    id="hud-card-back-2"
                    :size="responsive.cardSize"
                    :percentage="responsive.cardPercentage"
                    class="opacity-20 shadow-xl"
                  />
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- SECTION 2: INFO COLUMN -->
        <div
          id="hud-info-column"
          class="flex flex-col gap-1 flex-1 lg:min-w-[450px]"
        >
          <div
            id="hud-odds-wrapper"
            class="w-full scale-90 lg:scale-100 origin-left transition-all duration-500"
            :class="{
              'opacity-20 grayscale pointer-events-none': !playerCards?.length,
            }"
          >
            <OddsDisplay
              :winProb="pokerStore.getOdds.win"
              :tieProb="pokerStore.getOdds.tie"
              :handName="pokerStore.getCurrentHand?.pokerHand"
              :handRank="pokerStore.getCurrentHand?.prizeRank"
            />
          </div>

          <div
            id="hud-finance-wrapper"
            class="flex items-center justify-around gap-2 lg:gap-4 px-2 lg:px-6 py-1 lg:py-2 rounded-lg lg:rounded-xl bg-white/5 border border-white/5"
          >
            <div id="hud-stack-display" class="flex flex-col items-center">
              <span
                id="hud-stack-label"
                class="hidden lg:block text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1"
                >Stack</span
              >
              <div
                id="hud-stack-value-wrapper"
                class="flex items-baseline gap-0.5 lg:gap-1"
              >
                <span
                  id="hud-stack-currency"
                  class="text-[8px] lg:text-[10px] font-bold text-yellow-500/80"
                  >$</span
                >
                <span
                  id="hud-stack-value"
                  class="text-base lg:text-2xl font-mono font-black text-white tracking-tight leading-none"
                  >{{ balance }}</span
                >
              </div>
            </div>

            <div
              id="hud-finance-divider"
              class="w-px h-4 lg:h-8 bg-white/10"
            ></div>

            <div id="hud-bet-display" class="flex flex-col items-center">
              <span
                id="hud-bet-label"
                class="hidden lg:block text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1"
                >In Play</span
              >
              <div
                id="hud-bet-value-wrapper"
                class="flex items-baseline gap-0.5 lg:gap-1"
              >
                <span
                  id="hud-bet-currency"
                  class="text-[8px] lg:text-[10px] font-bold text-emerald-500/80"
                  >$</span
                >
                <span
                  id="hud-bet-value"
                  class="text-base lg:text-2xl font-mono font-black text-white tracking-tight leading-none"
                  >{{ isMyTurn ? betAmount : currentBet }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 3: ACTIONS AREA -->
        <div
          id="hud-actions-area"
          class="flex flex-col gap-1 lg:gap-2 flex-1 lg:min-w-[450px]"
        >
          <!-- PERSISTENT TOP MODULE: Raise Slider OR Full-width Waiting State -->
          <div
            id="hud-raise-slider-container"
            class="flex items-center bg-white/5 p-1 rounded-lg lg:rounded-xl border transition-all duration-500 h-10 lg:h-14 overflow-hidden"
            :class="
              isMyTurn
                ? 'border-yellow-500/40 shadow-[inset_0_0_20px_rgba(234,179,8,0.05)]'
                : 'border-white/5'
            "
          >
            <!-- Turn Layout -->
            <template v-if="isMyTurn">
              <div
                id="hud-raise-amount-box"
                class="bg-black/40 px-2 lg:px-4 py-1 lg:py-2 rounded-md lg:rounded-lg min-w-[80px] lg:min-w-[110px] border border-white/5 flex flex-col items-center shrink-0"
              >
                <span
                  id="hud-raise-label"
                  class="text-[7px] lg:text-[9px] font-black text-yellow-500 uppercase leading-none mb-1"
                  >Bet To</span
                >
                <span
                  id="hud-raise-value"
                  class="text-sm lg:text-xl font-mono font-black text-white leading-none"
                  >${{ betAmount }}</span
                >
              </div>

              <div
                id="hud-slider-wrapper"
                class="flex-1 flex flex-col gap-0.5 lg:gap-1 px-3"
              >
                <input
                  id="hud-bet-range-input"
                  type="range"
                  v-model.number="betProxy"
                  :min="minBet"
                  :max="maxBet"
                  class="w-full h-1 bg-gray-800 rounded-full appearance-none cursor-pointer accent-yellow-500"
                />
                <div
                  id="hud-slider-labels"
                  class="hidden lg:flex justify-between"
                >
                  <span
                    id="hud-slider-min"
                    class="text-[8px] text-gray-500 font-bold uppercase"
                    >Min ${{ minBet }}</span
                  >
                  <span
                    id="hud-slider-max"
                    class="text-[8px] text-gray-500 font-bold uppercase"
                    >Max ${{ maxBet }}</span
                  >
                </div>
              </div>

              <button
                id="hud-quick-allin-button"
                @click="setQuick('all')"
                class="px-2 py-1.5 lg:px-4 lg:py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-[8px] lg:text-[10px] font-black uppercase transition-all rounded-md border border-red-500/20 shrink-0"
              >
                All-In
              </button>
            </template>

            <!-- Waiting Layout (Inherits the "Raise" theme colors) -->
            <template v-else>
              <div
                id="hud-waiting-state"
                class="w-full h-full flex items-center justify-center gap-4 bg-yellow-500/5"
              >
                <div
                  id="hud-waiting-ping"
                  class="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-yellow-500 rounded-full animate-ping"
                ></div>
                <div class="flex items-baseline gap-2">
                  <span
                    id="hud-waiting-label"
                    class="text-[8px] lg:text-[10px] font-black text-yellow-500/60 uppercase tracking-widest italic"
                    >Waiting for</span
                  >
                  <span
                    id="hud-waiting-name"
                    class="text-xs lg:text-base font-black text-yellow-500 uppercase tracking-tight"
                    >{{ activePlayerName }}</span
                  >
                </div>
                <div class="flex gap-1">
                  <div
                    v-for="i in 3"
                    :key="i"
                    class="w-1 h-1 bg-yellow-500/30 rounded-full animate-bounce"
                    :style="{ animationDelay: i * 0.2 + 's' }"
                  ></div>
                </div>
              </div>
            </template>
          </div>

          <!-- BOTTOM MODULE: Buttons (Always visible, disabled if not my turn) -->
          <div
            id="hud-buttons-container"
            class="flex gap-1 lg:gap-2 items-stretch h-9 lg:h-14"
          >
            <template v-if="canBlind">
              <button
                id="hud-action-blind"
                @click="$emit('action', 'blind')"
                class="flex-1 bg-gradient-to-b from-purple-500 to-purple-700 text-white text-[9px] lg:text-sm font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 shadow-xl"
              >
                Post Blind
              </button>
            </template>

            <template v-else>
              <button
                v-if="options.includes('fold') || !isMyTurn"
                id="hud-action-fold"
                @click="$emit('action', 'fold')"
                :disabled="!isMyTurn"
                class="flex-1 bg-white/5 border border-white/10 text-gray-400 text-[9px] lg:text-sm font-black uppercase transition-all rounded-lg hover:bg-red-600/20 hover:text-red-400 disabled:opacity-10 disabled:grayscale disabled:cursor-not-allowed"
              >
                Fold
              </button>

              <button
                v-if="options.includes('check') || !isMyTurn"
                id="hud-action-check"
                @click="$emit('action', 'check')"
                :disabled="!isMyTurn"
                class="flex-1 bg-white/5 border border-white/10 text-gray-300 text-[9px] lg:text-sm font-black uppercase transition-all rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-10 disabled:grayscale disabled:cursor-not-allowed"
              >
                Check
              </button>

              <button
                v-if="options.includes('call') || !isMyTurn"
                id="hud-action-call"
                @click="$emit('action', 'call')"
                :disabled="!isMyTurn"
                class="flex-1 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[9px] lg:text-sm font-black uppercase transition-all rounded-lg hover:bg-blue-600 hover:text-white disabled:opacity-10 disabled:grayscale disabled:cursor-not-allowed"
              >
                Call
              </button>

              <button
                v-if="
                  options.includes('bet') ||
                  options.includes('raise') ||
                  !isMyTurn
                "
                id="hud-action-raise"
                :disabled="!isMyTurn || !canRaise"
                @click="
                  $emit('action', options.includes('bet') ? 'bet' : 'raise')
                "
                class="px-4 lg:px-14 bg-gradient-to-b from-yellow-400 to-yellow-600 text-black text-[9px] lg:text-sm font-black uppercase tracking-wider shadow-xl disabled:opacity-10 disabled:grayscale disabled:cursor-not-allowed rounded-lg transition-all active:scale-95"
              >
                {{ options.includes('bet') ? 'BET' : 'RAISE' }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Card from './Card.vue'
import CardBack from './CardBack.vue'
import OddsDisplay from './OddsDisplay.vue'
import { usePokerStore } from '../store/pokerStore'
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()

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

const activePlayerName = computed(() => {
  const activeId = pokerStore.getActivePlayerId
  if (!activeId) return 'others'
  const player = pokerStore.getPlayers.find((p) => p.id === activeId)
  return player ? player.name : 'others'
})

const canRaise = computed(() => {
  const hasIncreased = props.betAmount > props.minBet
  return (
    hasMoved.value &&
    hasIncreased &&
    (props.options.includes('bet') || props.options.includes('raise'))
  )
})

const betProxy = computed({
  get: () => props.betAmount,
  set: (val) => {
    hasMoved.value = true
    emit(
      'update:betAmount',
      Math.min(props.maxBet, Math.max(props.minBet, val)),
    )
  },
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

watch(
  () => props.isMyTurn,
  (newVal) => {
    if (newVal) {
      hasMoved.value = false
      if (timerInterval) clearInterval(timerInterval)
      timerInterval = setInterval(updateProgress, 100)
    } else {
      clearInterval(timerInterval)
      progress.value = 0
    }
  },
)

watch(
  () => [props.minBet, props.maxBet],
  () => {
    if (props.betAmount < props.minBet) emit('update:betAmount', props.minBet)
    if (props.betAmount > props.maxBet) emit('update:betAmount', props.maxBet)
  },
)

onMounted(() => {
  window.addEventListener('resize', updateWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth)
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

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
