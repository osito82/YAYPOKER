<template>
  <aside
    :id="'player-sidepanel-root-container-' + templateSuffix"
    class="w-full lg:w-[350px] flex-1 lg:h-full bg-black/40 backdrop-blur-3xl border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col shrink-0 min-h-0 z-40"
  >
    <!-- Sidepanel Header -->
    <div
      :id="'sidepanel-header-wrapper-' + templateSuffix"
      class="py-2 px-4 border-b border-white/5 bg-white/[0.01] flex items-center shrink-0"
    >
      <h2
        :id="'sidepanel-main-heading-' + templateSuffix"
        class="text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2"
      >
        <div
          :id="'sidepanel-status-pulse-dot-' + templateSuffix"
          class="w-1.5 h-1.5 bg-green-500/50 rounded-full"
        ></div>
        Players List
      </h2>
    </div>

    <!-- Players Scrollable List -->
    <TransitionGroup
      name="player-list"
      tag="div"
      :id="'sidepanel-players-scroll-list-' + templateSuffix"
      class="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar min-h-0"
    >
      <div
        v-for="player in sortedPlayers"
        :key="player.id"
        :id="'player-item-card-' + player.id + '-' + templateSuffix"
        class="group relative flex flex-col p-2.5 rounded-xl transition-all duration-1000 border border-transparent"
        :class="[
          player.id === delayedActivePlayerId
            ? 'bg-yellow-500/20 border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.15)] z-10'
            : isPlayerWinner(player.id)
              ? 'bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)] z-10'
              : 'bg-white/[0.03] hover:bg-white/[0.06]',
        ]"
      >
        <!-- Player Info Header: Name & Stack -->
        <div
          :id="'player-item-info-wrapper-' + player.id + '-' + templateSuffix"
          class="flex items-start justify-between gap-2 mb-1.5"
        >
          <div :id="`player-item-identity-wrapper-${player.id}-${templateSuffix}`" class="flex flex-col min-w-0">
            <div :id="`player-item-status-wrapper-${player.id}-${templateSuffix}`" class="flex items-center gap-2">
              <!-- Player Number Badge -->
              <div 
                :id="`player-item-number-badge-${player.id}-${templateSuffix}`"
                class="w-5 h-5 flex items-center justify-center rounded bg-gray-800 border border-white/10 text-[10px] font-black text-gray-400 shrink-0"
              >
                {{ player.playerNumber || '?' }}
              </div>

              <div
                v-if="player.id === delayedActivePlayerId"
                :id="`player-item-active-pulse-${player.id}-${templateSuffix}`"
                class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shrink-0"
              ></div>
              <span
                :id="
                  'player-item-display-name-' + player.id + '-' + templateSuffix
                "
                class="font-black text-lg text-gray-100 truncate uppercase tracking-tight leading-none"
                :class="{
                  'text-yellow-400': player.id === delayedActivePlayerId,
                  'text-emerald-400': isPlayerWinner(player.id),
                }"
              >
                {{ player.name }}
              </span>
              <div
                :id="`player-item-connectivity-dot-${player.id}-${templateSuffix}`"
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="player.isConnected ? 'bg-green-500' : 'bg-gray-600'"
              ></div>
            </div>
            <div :id="`player-item-action-label-wrapper-${player.id}-${templateSuffix}`" class="h-4 flex items-center mt-1 ml-7">
              <span
                v-if="player.id === activePlayerId"
                :id="`player-item-active-turn-label-${player.id}-${templateSuffix}`"
                class="text-[10px] font-black uppercase tracking-widest text-yellow-500/80 leading-none"
                >Active Turn</span
              >
              <span
                v-else-if="player.folded"
                :id="`player-item-folded-label-${player.id}-${templateSuffix}`"
                class="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-none"
                >Folded</span
              >
            </div>
          </div>

          <!-- Chips Display (Stack & Hand Accumulated) -->
          <div :id="`player-item-chips-container-${player.id}-${templateSuffix}`" class="flex gap-4 shrink-0">
            <!-- Hand Total (Accumulated) -->
            <div v-if="player.handContribution > 0" :id="`player-item-bet-container-${player.id}-${templateSuffix}`" class="flex flex-col items-end">
              <span
                :id="`player-item-bet-label-${player.id}-${templateSuffix}`"
                class="text-[10px] font-black text-emerald-500/70 uppercase tracking-tighter mb-1 leading-none"
                >Playing</span
              >
              <div :id="`player-item-bet-value-wrapper-${player.id}-${templateSuffix}`" class="flex items-center gap-0.5">
                <span
                  :id="`player-item-bet-currency-${player.id}-${templateSuffix}`"
                  class="text-xs text-emerald-500 font-mono font-bold leading-none"
                  >$</span
                >
                <span
                  :id="`player-item-bet-amount-${player.id}-${templateSuffix}`"
                  class="text-lg font-mono font-black text-emerald-400 leading-none tracking-tight"
                  >{{ player.handContribution }}</span
                >
              </div>
            </div>

            <!-- Stack Display -->
            <div :id="`player-item-stack-container-${player.id}-${templateSuffix}`" class="flex flex-col items-end">
              <span
                :id="`player-item-stack-label-${player.id}-${templateSuffix}`"
                class="text-[10px] font-black text-gray-500 uppercase tracking-tighter mb-1 leading-none"
                >Stack</span
              >
              <div :id="`player-item-stack-value-wrapper-${player.id}-${templateSuffix}`" class="flex items-center gap-0.5">
                <span
                  :id="`player-item-stack-currency-${player.id}-${templateSuffix}`"
                  class="text-sm text-yellow-500 font-mono font-bold leading-none"
                  >$</span
                >
                <span
                  :id="`player-item-stack-amount-${player.id}-${templateSuffix}`"
                  class="text-xl font-mono font-black text-white leading-none tracking-tight"
                  >{{ player.chips }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- MAIN ACTIVITY ROW -->
        <div
          v-if="
            player.currentBet > 0 ||
            player.lastAction ||
            (isShowDown && player.cards && player.cards.length > 0)
          "
          :id="`player-item-activity-row-${player.id}-${templateSuffix}`"
          class="flex items-end justify-between gap-2 mt-2 pt-2 border-t border-white/5"
        >
          <!-- LEFT COLUMN: Cards + Round Bet -->
          <div :id="`player-item-left-activity-${player.id}-${templateSuffix}`" class="flex flex-col flex-1 gap-3">
            <div
              v-if="isShowDown && player.cards && player.cards.length > 0"
              :id="`player-item-showdown-cards-${player.id}-${templateSuffix}`"
              class="flex flex-col animate-in fade-in slide-in-from-left-2 duration-700"
            >
              <div :id="`player-item-hand-name-wrapper-${player.id}-${templateSuffix}`" class="flex items-center gap-2 mb-1.5">
                <span
                  :id="`player-item-hand-name-text-${player.id}-${templateSuffix}`"
                  class="text-[10px] font-black text-emerald-400 uppercase tracking-widest truncate leading-none"
                >
                  {{ formatHandName(getPlayerHandName(player)) }}
                </span>
                <span
                  v-if="isPlayerWinner(player.id)"
                  :id="`player-item-win-badge-${player.id}-${templateSuffix}`"
                  class="px-1.5 py-0.5 rounded bg-emerald-500 text-[9px] font-black text-black uppercase leading-none"
                  >Win</span
                >
              </div>
              <div :id="`player-item-cards-row-${player.id}-${templateSuffix}`" class="flex gap-1.5">
                <Card
                  v-for="(card, idx) in player.cards"
                  :key="idx"
                  :id="`player-item-card-visual-${player.id}-${idx}-${templateSuffix}`"
                  :numSymbol="card"
                  size="small"
                  :highlight="isCardWinning(player.id, card)"
                  :percentage="55"
                />
              </div>
            </div>

            <!-- Round Bet (Muestra lo apostado en el turno actual) -->
            <div v-if="player.currentBet > 0" :id="`player-item-live-bet-wrapper-${player.id}-${templateSuffix}`" class="flex flex-col">
              <span
                :id="`player-item-live-bet-label-${player.id}-${templateSuffix}`"
                class="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1 leading-none"
                >Current Bet</span
              >
              <span
                :id="`player-item-live-bet-amount-${player.id}-${templateSuffix}`"
                class="text-lg font-mono font-black text-gray-300 leading-none tracking-tight"
                >${{ player.currentBet }}</span
              >
            </div>
          </div>

          <!-- RIGHT COLUMN: Last Action -->
          <div
            v-if="player.lastAction"
            :id="`player-item-last-action-wrapper-${player.id}-${templateSuffix}`"
            class="flex flex-col items-end shrink-0"
          >
            <span
              :id="`player-item-last-action-label-${player.id}-${templateSuffix}`"
              class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 leading-none"
              >Last Action</span
            >
            <Transition name="action-highlight" mode="out-in">
              <div
                :key="player.lastAction"
                :id="`player-item-action-badge-${player.id}-${templateSuffix}`"
                class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02]"
                :class="[
                  getActionBgColor(player.lastAction),
                  player.id === justActedPlayerId ? 'animate-action-flash' : '',
                ]"
              >
                <div
                  :id="`player-item-action-dot-${player.id}-${templateSuffix}`"
                  class="w-1.5 h-1.5 rounded-full"
                  :class="getActionDotColor(player.lastAction)"
                ></div>
                <span
                  :id="`player-item-action-text-${player.id}-${templateSuffix}`"
                  class="text-[10px] font-black uppercase tracking-widest leading-none mt-px"
                  :class="getActionTextColor(player.lastAction)"
                >
                  {{ player.lastAction }}
                </span>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- Sidepanel Footer -->
    <div
      :id="'sidepanel-footer-summary-wrapper-' + templateSuffix"
      class="p-4 border-t border-white/5 shrink-0"
      style="background: rgba(0,0,0,0.7);"
    >
      <div :id="`sidepanel-global-pot-row-${templateSuffix}`" class="flex justify-between items-center">
        <span :id="`sidepanel-global-pot-label-${templateSuffix}`" class="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Global Pot</span>
        <div :id="`sidepanel-global-pot-value-wrapper-${templateSuffix}`" class="flex items-center gap-1">
          <span :id="`sidepanel-global-pot-currency-${templateSuffix}`" class="text-amber-500 text-xs font-mono font-black leading-none">$</span>
          <span :id="`sidepanel-global-pot-amount-${templateSuffix}`" class="text-lg font-mono font-black italic leading-none">{{ pot }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'
import { usePokerStore } from '../store/pokerStore'
import Card from './Card.vue'

const responsive = useResponsiveStore()
const pokerStore = usePokerStore()

const templateSuffix = computed(() => {
  const size = responsive.screenSize
  return 'Template' + size.charAt(0).toUpperCase() + size.slice(1)
})

const props = defineProps({
  players: { type: Array, default: () => [] },
  activePlayerId: { type: String, default: null },
  myPlayerId: { type: String, default: null },
  pot: { type: Number, default: 0 },
  logs: { type: Array, default: () => [] },
  invertLayout: { type: Boolean, default: false },
})

const delayedActivePlayerId = ref(props.activePlayerId)
const justActedPlayerId = ref(null)

const isShowDown = computed(
  () => pokerStore.getStepChecker.showDown || pokerStore.getWinnerInfo !== null,
)

const winnerInfo = computed(() => pokerStore.getWinnerInfo)
const winners = computed(() => {
  if (!winnerInfo.value) return []
  if (winnerInfo.value.winners) return winnerInfo.value.winners
  if (winnerInfo.value.winner) return [winnerInfo.value.winner]
  return []
})
const winnerIds = computed(() => winners.value.map((w) => w.playerId))

const isPlayerWinner = (playerId) => winnerIds.value.includes(playerId)

const getPlayerHandName = (player) => {
  const winner = winners.value.find((w) => w.playerId === player.id)
  if (winner && winner.handName) return winner.handName
  if (winnerInfo.value?.allHands) {
    const handData = winnerInfo.value.allHands.find(
      (h) => h.playerId === player.id,
    )
    if (handData?.pokerHand) return handData.pokerHand
  }
  if (player.currentPrize?.pokerHand) return player.currentPrize.pokerHand
  return ''
}

const isCardWinning = (playerId, card) => {
  const winner = winners.value.find((w) => w.playerId === playerId)
  if (!winner || !winner.winningCards) return false
  const winningCards = winner.winningCards.flat()
  return winningCards.includes(card)
}

const formatHandName = (name) => {
  if (!name) return ''
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .toUpperCase()
}

watch(
  () => props.activePlayerId,
  (newId, oldId) => {
    if (newId === oldId) return
    if (oldId) {
      justActedPlayerId.value = oldId
      setTimeout(() => {
        if (justActedPlayerId.value === oldId) justActedPlayerId.value = null
      }, 1000)
    }
    setTimeout(() => {
      delayedActivePlayerId.value = newId
    }, 1000)
  },
  { immediate: true },
)

const sortedPlayers = computed(() => {
  const list = [...props.players]
  const activeIdx = list.findIndex((p) => p.id === delayedActivePlayerId.value)
  if (activeIdx > 0) {
    const [activePlayer] = list.splice(activeIdx, 1)
    list.unshift(activePlayer)
  }
  return list
})

const getActionBgColor = (action) => {
  const a = action.toLowerCase()
  if (a.includes('fold')) return 'bg-red-500/10 border-red-500/10'
  if (a.includes('raise') || a.includes('bet') || a.includes('all-in'))
    return 'bg-yellow-500/10 border-yellow-500/10'
  if (a.includes('call')) return 'bg-blue-500/10 border-blue-500/10'
  if (a.includes('check')) return 'bg-gray-500/10 border-gray-500/10'
  return 'bg-white/5 border-white/5'
}

const getActionDotColor = (action) => {
  const a = action.toLowerCase()
  if (a.includes('fold')) return 'bg-red-500'
  if (a.includes('raise') || a.includes('bet') || a.includes('all-in'))
    return 'bg-yellow-500'
  if (a.includes('call')) return 'bg-blue-500'
  if (a.includes('check')) return 'bg-gray-400'
  return 'bg-white'
}

const getActionTextColor = (action) => {
  const a = action.toLowerCase()
  if (a.includes('fold')) return 'text-red-400'
  if (a.includes('raise') || a.includes('bet') || a.includes('all-in'))
    return 'text-yellow-400'
  if (a.includes('call')) return 'text-blue-400'
  if (a.includes('check')) return 'text-gray-400'
  return 'text-white/60'
}

const getActionColor = (action) => {
  const a = action.toLowerCase()
  if (a.includes('fold')) return 'text-red-400 border-red-500/20 bg-red-500/10'
  if (a.includes('raise') || a.includes('bet'))
    return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
  if (a.includes('call'))
    return 'text-blue-400 border-blue-500/20 bg-blue-600/10'
  if (a.includes('check')) return 'text-gray-400 border-white/10 bg-white/5'
  return 'text-white/60'
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.player-list-move {
  transition: transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.player-list-enter-active,
.player-list-leave-active {
  transition: all 1.2s ease;
}
.player-list-enter-from,
.player-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.player-list-leave-active {
  position: absolute;
}

@keyframes action-flash-green {
  0% {
    color: #4ade80;
    border-color: #4ade80;
    background-color: rgba(74, 222, 128, 0.2);
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(74, 222, 128, 0.4);
  }
  100% {
    transform: scale(1);
  }
}
.animate-action-flash {
  animation: action-flash-green 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-highlight-enter-active {
  transition: all 0.3s ease-out;
}
.action-highlight-leave-active {
  transition: all 0.2s ease-in;
}
.action-highlight-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.9);
}
.action-highlight-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}
</style>
