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

    <!-- Players Scrollable List with Smooth Transitions -->
    <TransitionGroup
      name="player-list"
      tag="div"
      :id="'sidepanel-players-scroll-list-' + templateSuffix"
      class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar min-h-0"
    >
      <div
        v-for="player in sortedPlayers"
        :key="player.id"
        :id="'player-item-card-' + player.id + '-' + templateSuffix"
        class="group relative flex flex-col p-3 rounded-xl transition-all duration-500 border border-transparent"
        :class="[
          player.id === delayedActivePlayerId
            ? 'bg-yellow-500/20 border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.15)] z-10'
            : isPlayerWinner(player.id)
            ? 'bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)] z-10'
            : 'bg-white/[0.03] hover:bg-white/[0.06]',
        ]"
      >
        <!-- SHOWDOWN HEADER (Badge & Hand Name) -->
        <div 
          v-if="isShowDown && player.cards && player.cards.length > 0"
          class="flex items-center justify-between mb-2 pb-2 border-b border-white/5"
        >
          <div class="flex items-center gap-2">
            <span 
              v-if="isPlayerWinner(player.id)"
              class="px-2 py-0.5 rounded bg-emerald-500 text-[10px] font-black text-black uppercase tracking-tighter animate-bounce"
            >
              Winner
            </span>
            <span class="text-[11px] font-black text-gray-300 uppercase tracking-widest truncate">
              {{ formatHandName(getPlayerHandName(player)) }}
            </span>
          </div>
          
          <!-- SHOWDOWN CARDS (Mini view for everyone) -->
          <div class="flex gap-1">
            <Card 
              v-for="(card, idx) in player.cards" 
              :key="idx"
              :numSymbol="card"
              size="small"
              :highlight="isCardWinning(player.id, card)"
              :percentage="50"
              class="scale-90"
            />
          </div>
        </div>

        <!-- Player Info -->
        <div
          :id="'player-item-info-wrapper-' + player.id + '-' + templateSuffix"
          class="flex-1 flex flex-col min-w-0"
        >
          <!-- Main Header Row: Name & Roles -->
          <div
            :id="'player-item-header-row-' + player.id + '-' + templateSuffix"
            class="flex items-start justify-between gap-2 mb-1"
          >
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2">
                <!-- Turn Indicator Dot -->
                <div
                  v-if="player.id === delayedActivePlayerId"
                  class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shrink-0"
                ></div>
                <!-- Winner Indicator Dot -->
                <div
                  v-else-if="isPlayerWinner(player.id)"
                  class="w-2 h-2 bg-emerald-500 rounded-full animate-ping shrink-0"
                ></div>

                <span
                  :id="'player-item-display-name-' + player.id + '-' + templateSuffix"
                  class="font-black text-xl text-gray-100 truncate uppercase tracking-tight transition-all duration-500"
                  :class="{
                    'text-yellow-400': player.id === delayedActivePlayerId,
                    'text-emerald-400': isPlayerWinner(player.id),
                  }"
                >
                  {{ player.name }}
                </span>
                <!-- Connection Status -->
                <div
                  :id="'player-item-connection-dot-' + player.id + '-' + templateSuffix"
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  :class="
                    player.isConnected
                      ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                      : 'bg-gray-600'
                  "
                ></div>
              </div>

              <!-- Sub-header: Status or Is Playing -->
              <div class="h-4 flex items-center">
                <span
                  v-if="player.id === activePlayerId"
                  class="text-[11px] font-bold uppercase tracking-widest text-yellow-500/90 animate-pulse"
                >
                  Current Turn
                </span>
                <span
                  v-else-if="isPlayerWinner(player.id)"
                  class="text-[10px] font-bold uppercase tracking-widest text-emerald-500/90"
                >
                  {{ getPlayerHandName(player) || 'Winning Hand' }}
                </span>
                <span
                  v-else-if="player.folded"
                  class="text-[10px] font-bold uppercase tracking-widest text-gray-500"
                >
                  Folded
                </span>
                <span
                  v-else-if="!player.isConnected"
                  class="text-[10px] font-bold uppercase tracking-widest text-red-500/70"
                >
                  Offline
                </span>
              </div>
            </div>

            <!-- Chips Display (Top Right) -->
            <div class="flex flex-col items-end shrink-0">
              <span
                class="text-[10px] font-black text-gray-500 uppercase tracking-tighter leading-none mb-1"
                >Stack</span
              >
              <div class="flex items-center gap-0.5">
                <span class="text-xs text-yellow-500 font-mono font-bold"
                  >$</span
                >
                <span
                  :id="'player-item-chip-stack-count-' + player.id + '-' + templateSuffix"
                  class="text-lg font-mono font-black text-white leading-none"
                  >{{ player.chips }}</span
                >
              </div>
            </div>
          </div>

          <!-- Bottom Row: Action & Bet -->
          <div
            :id="'player-item-footer-row-' + player.id + '-' + templateSuffix"
            class="flex items-end justify-between mt-2 pt-2 border-t border-white/5"
          >
            <!-- Current Bet (Bottom Left) -->
            <div class="flex flex-col flex-1">
              <template v-if="player.currentBet > 0">
                <span
                  class="text-[9px] font-black text-emerald-500/70 uppercase tracking-wider mb-0.5"
                  >Live Bet</span
                >
                <span
                  :id="'player-item-current-bet-amount-' + player.id + '-' + templateSuffix"
                  class="text-xl font-mono font-black text-emerald-400 leading-none transition-all duration-500"
                  >${{ player.currentBet }}</span
                >
              </template>
            </div>

            <!-- Action Display (Bottom Right) -->
            <div
              v-if="player.lastAction"
              :id="'player-item-action-display-wrapper-' + player.id + '-' + templateSuffix"
              class="flex flex-col items-end text-right"
            >
              <span
                :id="'player-item-action-label-text-' + player.id + '-' + templateSuffix"
                class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1"
              >
                Last Action
              </span>
              <div
                :id="'player-item-action-badge-wrapper-' + player.id + '-' + templateSuffix"
                class="flex justify-end"
              >
                <Transition name="action-highlight" mode="out-in">
                  <span
                    :key="player.lastAction"
                    :id="'player-item-action-status-badge-' + player.id + '-' + templateSuffix"
                    class="text-xl font-black uppercase px-4 py-1.5 rounded-lg transition-all duration-500 bg-white/10 border border-white/10 shadow-lg"
                    :class="[
                      getActionColor(player.lastAction),
                      player.id === justActedPlayerId
                        ? 'animate-action-flash'
                        : '',
                    ]"
                  >
                    {{ player.lastAction }}
                  </span>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- Sidepanel Footer -->
    <div
      :id="'sidepanel-footer-summary-wrapper-' + templateSuffix"
      class="hidden lg:block p-4 bg-black/60 border-t border-white/5 shrink-0"
    >
      <div :id="'sidepanel-pot-total-display-' + templateSuffix" class="flex justify-between items-center">
        <span
          :id="'sidepanel-pot-total-label-' + templateSuffix"
          class="text-[10px] font-black text-gray-500 uppercase tracking-widest"
          >Global Pot</span
        >
        <span
          :id="'sidepanel-pot-total-amount-' + templateSuffix"
          class="text-emerald-400 text-sm font-mono font-black italic shadow-emerald-500/20 shadow-sm"
          >${{ pot }}</span
        >
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

const isShowDown = computed(() => pokerStore.getStepChecker.showDown || pokerStore.getWinnerInfo !== null)

const winnerInfo = computed(() => pokerStore.getWinnerInfo)
const winners = computed(() => {
  if (!winnerInfo.value) return []
  if (winnerInfo.value.winners) return winnerInfo.value.winners
  if (winnerInfo.value.winner) return [winnerInfo.value.winner]
  return []
})
const winnerIds = computed(() => winners.value.map(w => w.playerId))

const isPlayerWinner = (playerId) => winnerIds.value.includes(playerId)

const getPlayerHandName = (player) => {
  // If winnerInfo has winners, find this player there
  const winner = winners.value.find(w => w.playerId === player.id)
  if (winner && winner.handName) return winner.handName

  // Try to find in allHands in winnerInfo
  if (winnerInfo.value?.allHands) {
    const handData = winnerInfo.value.allHands.find(h => h.playerId === player.id)
    if (handData?.pokerHand) return handData.pokerHand
  }

  // Fallback to player object
  if (player.currentPrize?.pokerHand) return player.currentPrize.pokerHand
  
  return ''
}

const isCardWinning = (playerId, card) => {
  const winner = winners.value.find(w => w.playerId === playerId)
  if (!winner || !winner.winningCards) return false
  
  // winner.winningCards might be nested or flat, flatten it
  const winningCards = winner.winningCards.flat()
  return winningCards.includes(card)
}

const formatHandName = (name) => {
  if (!name) return ''
  // camelCase to spaced UPPERCASE
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .toUpperCase()
}

watch(
  () => props.activePlayerId,
  (newId, oldId) => {
    if (newId === oldId) return

    // The player who just finished their turn is oldId
    if (oldId) {
      justActedPlayerId.value = oldId
      // Clear the highlight after the animation duration (1s)
      setTimeout(() => {
        if (justActedPlayerId.value === oldId) {
          justActedPlayerId.value = null
        }
      }, 1000)
    }

    // Wait 1 second before reordering to keep the actor at the top during feedback
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

#sidepanel-players-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

/* Reordering Transitions */
.player-list-move {
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.player-list-enter-active,
.player-list-leave-active {
  transition: all 0.5s ease;
}

.player-list-enter-from,
.player-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Ensure leaving items are taken out of flow so move animation can work */
.player-list-leave-active {
  position: absolute;
}

/* Action Flash Animation */
@keyframes action-flash-green {
  0% {
    color: #4ade80;
    border-color: #4ade80;
    background-color: rgba(74, 222, 128, 0.2);
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(74, 222, 128, 0.4);
  }
  80% {
    color: #4ade80;
    border-color: #4ade80;
    background-color: rgba(74, 222, 128, 0.2);
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.animate-action-flash {
  animation: action-flash-green 1s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Action Transition */
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
