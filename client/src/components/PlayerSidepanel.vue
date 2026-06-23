<template>
  <aside
    :id="'player-sidepanel-root-container-' + templateSuffix"
    class="w-full lg:w-[300px] flex-1 lg:h-full bg-white/80 dark:bg-black/40 backdrop-blur-3xl border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-white/5 flex flex-col shrink-0 min-h-0 z-40 transition-colors duration-300"
  >
    <!-- Sidepanel Header -->
    <div
      :id="'sidepanel-header-wrapper-' + templateSuffix"
      class="py-1.5 px-3 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.01] flex items-center shrink-0"
    >
      <h2
        :id="'sidepanel-main-heading-' + templateSuffix"
        class="text-[10px] lg:text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2"
      >
        <div
          :id="'sidepanel-status-pulse-dot-' + templateSuffix"
          class="w-1.5 h-1.5 bg-green-500/50 rounded-full"
        ></div>
        {{ $t('game.players_list') }}
      </h2>
    </div>

    <!-- Players Scrollable List -->
    <TransitionGroup
      name="player-list"
      tag="div"
      :id="'sidepanel-players-scroll-list-' + templateSuffix"
      class="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 custom-scrollbar min-h-0"
    >
      <div
        v-for="player in sortedPlayers"
        :key="player.id"
        :id="'player-item-card-' + player.id + '-' + templateSuffix"
        class="group relative flex flex-col p-2 rounded-xl transition-all duration-1000 border border-transparent shadow-sm dark:shadow-none"
        :class="[
          player.id === delayedActivePlayerId
            ? 'bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/30 dark:border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.15)] z-10'
            : isPlayerWinner(player.id)
              ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 dark:border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)] z-10'
              : 'bg-gray-50 dark:bg-white/[0.03] border-gray-100 dark:border-transparent hover:bg-gray-100 dark:hover:bg-white/[0.06]',
        ]"
      >
        <!-- Player Info Header: Name & Stack -->
        <div
          :id="'player-item-info-wrapper-' + player.id + '-' + templateSuffix"
          class="flex items-start justify-between gap-2 mb-1"
        >
          <div
            :id="`player-item-identity-wrapper-${player.id}-${templateSuffix}`"
            class="flex flex-col min-w-0"
          >
            <div
              :id="`player-item-status-wrapper-${player.id}-${templateSuffix}`"
              class="flex items-center gap-2"
            >
              <!-- Player Number Badge -->
              <div
                :id="`player-item-number-badge-${player.id}-${templateSuffix}`"
                class="relative w-5 h-5 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-white/10 text-[10px] font-black text-gray-500 dark:text-gray-400 shrink-0"
              >
                {{ player.playerNumber || '?' }}
                <!-- Dealer Button (if your backend sends player.isDealer) -->
                <div v-if="player.isDealer" class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white text-black text-[7px] font-black rounded-full flex items-center justify-center border border-gray-300 shadow-sm">
                  D
                </div>
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
                class="font-black text-sm text-gray-900 dark:text-gray-100 truncate uppercase tracking-tight leading-none transition-colors"
                :class="{
                  'text-yellow-600 dark:text-yellow-400':
                    player.id === delayedActivePlayerId,
                  'text-emerald-600 dark:text-emerald-400': isPlayerWinner(
                    player.id,
                  ),
                }"
              >
                {{ cleanPlayerName(player.name) }}
              </span>
              <div
                :id="`player-item-connectivity-dot-${player.id}-${templateSuffix}`"
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="
                  player.isConnected
                    ? 'bg-green-500'
                    : 'bg-gray-400 dark:bg-gray-600'
                "
              ></div>
            </div>
            <div
              :id="`player-item-action-label-wrapper-${player.id}-${templateSuffix}`"
              class="flex items-center mt-0.5 ml-7"
            >
              <span
                v-if="player.id === activePlayerId"
                :id="`player-item-active-turn-label-${player.id}-${templateSuffix}`"
                class="text-[9px] font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-500/80 leading-none"
                >Active Turn</span
              >
              <span
                v-else-if="player.folded"
                :id="`player-item-folded-label-${player.id}-${templateSuffix}`"
                class="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 leading-none"
                >Folded</span
              >
            </div>
          </div>

          <!-- Chips Display (Stack & Hand) - Compact inline -->
          <div
            :id="`player-item-chips-container-${player.id}-${templateSuffix}`"
            class="flex gap-2 shrink-0 items-start"
          >
            <!-- Stack Display -->
            <div
              :id="`player-item-stack-container-${player.id}-${templateSuffix}`"
              class="flex flex-col items-end"
            >
              <div
                :id="`player-item-stack-value-wrapper-${player.id}-${templateSuffix}`"
                class="flex items-baseline gap-0.5"
              >
                <span
                  :id="`player-item-stack-currency-${player.id}-${templateSuffix}`"
                  class="text-[10px] text-yellow-600 dark:text-yellow-500 font-mono font-bold leading-none"
                  >$</span
                >
                <span
                  :id="`player-item-stack-amount-${player.id}-${templateSuffix}`"
                  class="text-sm font-mono font-black text-gray-900 dark:text-white leading-none tracking-tight transition-colors"
                  >{{ player.chips }}</span
                >
              </div>
            </div>

            <!-- Hand Total (Accumulated) - inline badge -->
            <div
              v-if="player.handContribution > 0"
              :id="`player-item-bet-container-${player.id}-${templateSuffix}`"
              class="flex items-baseline gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15"
            >
              <span
                :id="`player-item-bet-currency-${player.id}-${templateSuffix}`"
                class="text-[9px] text-emerald-600 dark:text-emerald-500 font-mono font-bold leading-none"
                >+$</span
              >
              <span
                :id="`player-item-bet-amount-${player.id}-${templateSuffix}`"
                class="text-[11px] font-mono font-black text-emerald-700 dark:text-emerald-400 leading-none tracking-tight"
                >{{ player.handContribution }}</span
              >
            </div>
          </div>
        </div>

        <!-- MAIN ACTIVITY ROW -->
        <div
          v-if="
            player.currentBet > 0 ||
            player.lastAction
          "
          :id="`player-item-activity-row-${player.id}-${templateSuffix}`"
          class="flex items-end justify-between gap-2 mt-1.5 pt-1.5 border-t border-gray-200 dark:border-white/5"
        >
          <!-- LEFT COLUMN: Round Bet -->
          <div
            :id="`player-item-left-activity-${player.id}-${templateSuffix}`"
            class="flex flex-col flex-1"
          >
            <div
              v-if="player.currentBet > 0"
              :id="`player-item-live-bet-wrapper-${player.id}-${templateSuffix}`"
              class="flex items-baseline gap-1"
            >
              <span
                :id="`player-item-live-bet-label-${player.id}-${templateSuffix}`"
                class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-none"
                >Bet</span
              >
              <span
                :id="`player-item-live-bet-amount-${player.id}-${templateSuffix}`"
                class="text-sm font-mono font-black text-gray-700 dark:text-gray-300 leading-none tracking-tight transition-colors"
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
                class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 leading-none"
              >{{ $t('game.last_action') }}</span
            >
            <Transition name="action-highlight" mode="out-in">
              <div
                :key="player.lastAction"
                :id="`player-item-action-badge-${player.id}-${templateSuffix}`"
                class="flex items-center gap-1.5 px-2 py-1 rounded-full border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02]"
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
                  class="text-[9px] font-black uppercase tracking-widest leading-none mt-px"
                  :class="getActionTextColor(player.lastAction)"
                >
                  {{ player.lastAction }}
                </span>
              </div>
            </Transition>
          </div>
        </div>
        <!-- ROW 3: Showdown -->
        <div
          v-if="isShowDown && getPlayerCards(player).length > 0"
          :id="`player-item-showdown-cards-${player.id}-${templateSuffix}`"
          class="flex flex-col mt-1.5 pt-1.5 border-t border-gray-200 dark:border-white/5 animate-in fade-in slide-in-from-left-2 duration-700"
        >
             <div :id="`player-item-hand-name-wrapper-${player.id}-${templateSuffix}`" class="flex items-center gap-1.5 mb-1">
              <span :id="`player-item-hand-name-text-${player.id}-${templateSuffix}`" class="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest truncate leading-none">
               {{ formatHandName(getPlayerHandName(player)) }}
             </span>
              <span v-if="isPlayerWinner(player.id)" :id="`player-item-win-badge-${player.id}-${templateSuffix}`" class="px-1 py-0.5 rounded bg-emerald-500 text-[8px] font-black text-white dark:text-black uppercase leading-none">Win</span>
           </div>
             <div :id="`player-item-cards-row-${player.id}-${templateSuffix}`" class="flex gap-1.5">
              <Card
                v-for="(card, idx) in getPlayerCards(player)"
                :key="idx"
                :id="`player-item-card-visual-${player.id}-${idx}-${templateSuffix}`"
                :numSymbol="card"
                size="small"
                :highlight="isCardWinning(player.id, card)"
                :percentage="55"
              />
           </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- Sidepanel Footer -->
    <div
      :id="'sidepanel-footer-summary-wrapper-' + templateSuffix"
      class="p-3 border-t border-gray-200 dark:border-white/5 shrink-0 bg-white dark:bg-black/70 transition-colors"
    >
      <div
        :id="`sidepanel-global-pot-row-${templateSuffix}`"
        class="flex justify-between items-center"
      >
        <span
          :id="`sidepanel-global-pot-label-${templateSuffix}`"
          class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none"
          >Global Pot</span
        >
        <div
          :id="`sidepanel-global-pot-value-wrapper-${templateSuffix}`"
          class="flex items-center gap-1"
        >
          <span
            :id="`sidepanel-global-pot-currency-${templateSuffix}`"
            class="text-yellow-600 dark:text-amber-500 text-xs font-mono font-black leading-none"
            >$</span
          >
          <span
            :id="`sidepanel-global-pot-amount-${templateSuffix}`"
            class="text-lg font-mono font-black italic text-gray-900 dark:text-white transition-colors leading-none"
            >{{ pot }}</span
          >
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'
import { usePokerStore } from '../store/pokerStore'
import { cleanPlayerName } from '../vutils'
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

const getPlayerCards = (player) => {
  // 1. If player has cards populated (e.g. local user), use them
  if (player.cards && player.cards.length > 0) return player.cards
  
  // 2. Fallback: check winnerInfo.allHands (backend might send them here)
  if (winnerInfo.value?.allHands) {
    const hand = winnerInfo.value.allHands.find((h) => h.playerId === player.id)
    if (hand && hand.privateCards && hand.privateCards.length > 0) return hand.privateCards
    if (hand && hand.cards && hand.cards.length > 0) return hand.cards
  }

  // 3. Fallback: check winners array directly
  const winner = winners.value.find((w) => w.playerId === player.id)
  if (winner && winner.privateCards && winner.privateCards.length > 0) return winner.privateCards
  if (winner && winner.cards && winner.cards.length > 0) return winner.cards

  // 4. Fallback: check player.currentPrize
  if (player.currentPrize?.cards && player.currentPrize.cards.length > 0) return player.currentPrize.cards

  return []
}

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
  let list = [...props.players]
  
  // 1. Sort primarily by playerNumber (seat order) to guarantee consistent spatial layout
  list.sort((a, b) => (a.playerNumber || 0) - (b.playerNumber || 0))

  // 2. If we are observing or our ID is not set, just return the list sorted by seat
  if (!props.myPlayerId) return list

  // 3. Find where "Me" (the local user) is seated
  const myIdx = list.findIndex((p) => p.id === props.myPlayerId)
  
  if (myIdx >= 0) {
    // 4. Relative ordering: Put "Me" at the BOTTOM of the list.
    // The player acting next after me (myIdx + 1) goes to the TOP of the list.
    // This creates a natural top-to-bottom flow that ends with the user.
    const afterMe = list.slice(myIdx + 1)
    const meAndBefore = list.slice(0, myIdx + 1)
    return [...afterMe, ...meAndBefore]
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
