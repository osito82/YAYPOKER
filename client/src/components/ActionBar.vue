<template>
  <div
    id="poker-action-hud"
    class="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
  >
    <!-- Turn Timer Bar -->
    <div
      v-if="isMyTurn && progress > 0"
      id="turn-timer-container"
      class="w-full h-1.5 bg-gray-800/50 backdrop-blur-sm pointer-events-auto"
    >
      <div
        id="turn-timer-progress"
        class="h-full bg-yellow-500 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(234,179,8,0.5)]"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>

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
        <div id="stack-info-container" class="flex flex-col">
          <span
            id="label-stack"
            class="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1"
            >Your Balance</span
          >
          <div id="balance-display-wrapper" class="flex items-baseline gap-1">
            <span id="currency-symbol" class="text-sm font-bold text-yellow-500">$</span>
            <span
              id="display-balance"
              class="text-xl md:text-3xl font-mono font-black text-white leading-none"
              >{{ balance }}</span
            >
          </div>
        </div>
      </div>

      <!-- MIDDLE-LEFT: Personal Cards & Odds -->
      <div
        id="hud-cards-display"
        class="flex gap-4 items-center px-4 md:border-r border-white/10 h-full"
      >
        <!-- Odds Display -->
        <div
          v-if="pokerStore.getOdds && (pokerStore.getOdds.win > 0 || pokerStore.getOdds.tie > 0)"
          id="odds-display-container"
          class="flex flex-col items-center justify-center pr-4 border-r border-white/10 min-w-[70px]"
        >
          <span id="label-odds" class="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1.5">
            {{ pokerStore.getCommunityCards.length === 5 ? 'Final Result' : 'Win Prob' }}
          </span>
          <div id="odds-value-wrapper" class="flex items-baseline gap-0.5">
            <span
              id="display-odds-win"
              :class="['text-3xl font-mono font-black transition-colors duration-700', getOddsColor(pokerStore.getOdds.win)]"
            >
              {{ Math.round(pokerStore.getOdds.win) }}
            </span>
            <span id="odds-percent-symbol" class="text-[12px] font-bold text-gray-400">%</span>
          </div>

          <div
            v-if="parseFloat(pokerStore.getOdds.tie) > 0"
            id="odds-tie-badge"
            class="flex items-center gap-1.5 mt-1 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/20"
          >
            <span id="label-tie" class="text-[9px] font-black text-blue-400/80 uppercase tracking-tighter">Tie</span>
            <span id="display-odds-tie" class="text-[11px] font-mono font-bold text-blue-300">{{ pokerStore.getOdds.tie }}%</span>
          </div>
        </div>

        <!-- Current Hand Evaluation -->
        <div
          v-if="pokerStore.getCurrentHand"
          id="hand-evaluation-container"
          class="flex flex-col items-start justify-center px-2 min-w-[100px]"
        >
          <span id="label-current-hand" class="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">
            Current Hand
          </span>
          <span id="display-hand-name" class="text-base font-black text-white uppercase tracking-tight">
            {{ pokerStore.getCurrentHand.pokerHand }}
          </span>
          <div id="hand-rank-dots" class="flex gap-1 mt-1">
            <div
              v-for="i in 10"
              :id="'rank-dot-' + i"
              :key="i"
              class="w-2 h-2.5 rounded-full"
              :class="i <= (11 - pokerStore.getCurrentHand.prizeRank) ? 'bg-yellow-500' : 'bg-gray-800'"
            ></div>
          </div>
        </div>

        <!-- Board & Player Cards -->
        <div id="cards-visual-container" class="flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
          <!-- Player Cards -->
          <div id="player-cards-flex" class="flex gap-2">
            <template v-if="playerCards && playerCards.length > 0">
              <Card
                v-for="(card, i) in playerCards"
                :id="'hud-player-card-' + i"
                :key="'player-' + i"
                size="small"
                :numSymbol="card"
                class="shadow-xl transform hover:-translate-y-2 transition-transform cursor-default scale-110"
              />
            </template>
            <template v-else>
              <div id="empty-cards-placeholder" class="flex -space-x-3 opacity-10">
                <div id="card-placeholder-1" class="w-10 h-14 bg-gray-700 border border-white/20 rounded"></div>
                <div id="card-placeholder-2" class="w-10 h-14 bg-gray-700 border border-white/20 rounded"></div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- MIDDLE-RIGHT: Bet Controls -->
      <div
        v-if="isMyTurn && (options.includes('bet') || options.includes('raise'))"
        id="hud-raise-controls"
        class="flex items-center gap-4 md:gap-6 px-4 flex-grow justify-center min-w-full md:min-w-0 order-first md:order-none mb-3 md:mb-0 transition-all duration-300"
        :class="{ 'opacity-40 grayscale pointer-events-none': minBet > maxBet }"
      >
        <div id="raise-amount-container" class="flex flex-col items-center min-w-[80px]">
          <span
            id="label-raise-to"
            class="text-[10px] font-black text-yellow-500 uppercase mb-1"
          >Raise Amount</span>
          <span
            id="display-raise-amount"
            class="text-xl md:text-2xl font-mono font-bold text-white leading-none"
          >${{ betAmount }}</span>
        </div>

        <div id="slider-range-container" class="flex flex-col items-center gap-2 flex-grow max-w-xs">
          <input
            id="input-bet-range"
            type="range"
            v-model.number="betProxy"
            :min="minBet"
            :max="maxBet"
            :disabled="minBet > maxBet"
            class="w-full h-2.5 bg-gray-800 rounded-none appearance-none cursor-pointer accent-yellow-500 border border-white/5"
          />
          <div id="slider-labels" class="flex justify-between w-full px-1">
            <span id="min-bet-label" class="text-[9px] text-gray-400 font-bold font-mono">MIN: ${{ minBet }}</span>
            <span id="max-bet-label" class="text-[9px] text-gray-400 font-bold font-mono">MAX: ${{ maxBet }}</span>
          </div>
        </div>

        <div id="quick-bet-group" class="flex gap-1.5">
          <button
            id="quick-bet-half"
            @click="setQuick(0.5)"
            :disabled="minBet > maxBet"
            class="px-3 py-1.5 bg-white/5 border border-white/10 text-[11px] font-black text-gray-300 hover:text-white hover:bg-white/10 transition-all uppercase disabled:opacity-30"
          >
            1/2
          </button>
          <button
            id="quick-bet-pot"
            @click="setQuick(1)"
            :disabled="minBet > maxBet"
            class="px-3 py-1.5 bg-white/5 border border-white/10 text-[11px] font-black text-gray-300 hover:text-white hover:bg-white/10 transition-all uppercase disabled:opacity-30"
          >
            POT
          </button>
          <button
            id="quick-bet-allin"
            @click="setQuick('all')"
            class="px-3 py-1.5 bg-red-900/20 border border-red-500/30 text-[11px] font-black text-red-400 hover:bg-red-500/30 transition-all uppercase"
          >
            ALL IN
          </button>
        </div>
      </div>

      <!-- RIGHT: Actions -->
      <div id="hud-actions-group" class="flex gap-2 md:gap-3 items-center ml-auto">
        <template v-if="canBlind">
          <button
            id="action-button-blind"
            @click="$emit('action', 'blind')"
            class="px-8 py-3 bg-purple-600 text-white text-sm font-black uppercase tracking-widest transition-all active:scale-95 hover:bg-purple-500 shadow-lg shadow-purple-900/20"
          >
            Post Blind
          </button>
        </template>

        <template v-else-if="isMyTurn">
          <button
            v-if="options.includes('fold')"
            id="action-button-fold"
            @click="$emit('action', 'fold')"
            class="px-6 py-3 border border-red-500/30 text-red-500 text-sm font-black uppercase tracking-widest transition-all active:scale-95 hover:bg-red-500/10"
          >
            Fold
          </button>
          <button
            v-if="options.includes('check')"
            id="action-button-check"
            @click="$emit('action', 'check')"
            class="px-6 py-3 border border-white/10 text-gray-100 text-sm font-black uppercase tracking-widest transition-all active:scale-95 hover:bg-white/5"
          >
            Check
          </button>
          <button
            v-if="options.includes('call')"
            id="action-button-call"
            @click="$emit('action', 'call')"
            class="px-6 py-3 border border-blue-500/30 text-blue-400 text-sm font-black uppercase tracking-widest transition-all active:scale-95 hover:bg-blue-600/10"
          >
            Call
          </button>

          <button
            id="raise-button"
            :disabled="!canRaise"
            @click="$emit('action', options.includes('bet') ? 'bet' : 'raise')"
            class="px-8 py-3 bg-yellow-500 text-black text-sm font-black uppercase tracking-widest transition-all active:scale-95 hover:bg-yellow-400 shadow-xl shadow-yellow-900/20 disabled:opacity-50 disabled:grayscale"
          >
            {{ options.includes('bet') ? 'BET' : 'RAISE' }}
          </button>
        </template>

        <div v-else id="waiting-state-container" class="flex flex-col items-end px-4">
          <div id="waiting-animation-wrapper" class="flex items-center gap-2">
            <div id="waiting-pulse-dot" class="w-2 h-2 bg-yellow-500/50 rounded-full animate-pulse"></div>
            <span id="label-waiting" class="text-[12px] text-gray-400 font-black uppercase tracking-[0.2em]">Waiting...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import Card from './Card.vue'
import { usePokerStore } from '../store/pokerStore'

const props = defineProps({
  isMyTurn: Boolean,
  canBlind: Boolean,
  options: { type: Array, default: () => [] },
  balance: { type: Number, default: 0 },
  betAmount: { type: Number, default: 0 },
  minBet: { type: Number, default: 0 },
  maxBet: { type: Number, default: 0 },
  playerCards: { type: Array, default: () => [] },
})


const canRaise = computed(() => {
  
  return betProxy.value > props.minBet
})

const emit = defineEmits(['action', 'update:betAmount', 'setQuickBet'])

const pokerStore = usePokerStore()
const progress = ref(100)
const hasMoved = ref(false)
let timerInterval = null

const getOddsColor = (win) => {
  const w = parseFloat(win)
  if (w >= 70) return 'text-green-500'
  if (w >= 40) return 'text-yellow-500'
  if (w >= 20) return 'text-orange-500'
  return 'text-red-500'
}

// --- Slider Proxy ---
const betProxy = computed({
  get() {
    return props.betAmount
  },
  set(val) {
    hasMoved.value = true
    const safeValue = Math.min(props.maxBet, Math.max(props.minBet, val))
    emit('update:betAmount', safeValue)
  }
})

// --- Quick Bet ---
const setQuick = (ratio) => {
  hasMoved.value = true
  emit('setQuickBet', ratio)
}

// --- Progress Timer ---
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
  }
)

watch(
  () => [props.minBet, props.maxBet],
  () => {
    if (props.betAmount < props.minBet) emit('update:betAmount', props.minBet)
    if (props.betAmount > props.maxBet) emit('update:betAmount', props.maxBet)
  }
)

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
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
