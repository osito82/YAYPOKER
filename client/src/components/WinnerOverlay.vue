<template>
  <Transition
    enter-active-class="transition duration-500 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-300 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="winnerInfo && isVisible"
      id="winner-overlay-root"
      class="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:items-center bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div
        id="winner-modal-container"
        class="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-yellow-500/50 rounded-[2rem] shadow-[0_0_100px_rgba(234,179,8,0.3)] my-auto overflow-hidden"
      >
        <!-- Close Button -->
        <button
          id="winner-close-button"
          @click="handleClose"
          class="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 transition-all z-[120] p-2 rounded-full border border-white/10 flex items-center justify-center shadow-lg hover:scale-110 active:scale-90"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Decoration -->
        <div
          id="winner-top-decoration"
          class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"
        ></div>

        <div
          id="winner-modal-content"
          class="p-6 sm:p-8 flex flex-col items-center text-center"
        >
          <!-- Trophy Icon -->
          <div
            id="winner-trophy-container"
            class="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-500 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-[0_0_30px_rgba(234,179,8,0.4)] animate-bounce"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 sm:h-10 sm:w-10 text-black"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05l-3.293 3.293a1 1 0 01-1.414 0l-3.293-3.293a1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 3.323V3a1 1 0 011-1zm-1 8.274l-.81 2.519L5.25 13.73l2.257-2.257-.313-3.2 2.056 1.028v1.973zm2 0V9.301l2.056-1.028-.313 3.2 2.257 2.257-2.94-1.028-.81-2.519z"
                clip-rule="evenodd"
              />
            </svg>
          </div>

          <h2
            id="winner-title"
            class="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter mb-1 sm:mb-2"
          >
            {{ winnerNames }}
            <span id="winner-title-suffix" class="text-yellow-500">{{
              winners.length > 1 ? ' Split the Pot!' : ' Wins!'
            }}</span>
          </h2>

          <div
            id="winner-amount-display"
            class="text-5xl sm:text-6xl font-mono font-black text-yellow-400 mb-4 sm:mb-6 drop-shadow-lg"
          >
            +${{ totalAmount }}
          </div>

          <!-- Winning Hands -->
          <div
            id="winners-list-container"
            class="w-full flex flex-col items-center"
          >
            <div
              v-for="(winner, idx) in winners"
              :id="'winner-hand-box-' + idx"
              :key="'winner-' + idx"
              class="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 w-full mb-4 last:mb-6 relative overflow-hidden"
            >
              <div
                :id="'winner-bg-glow-' + idx"
                class="absolute inset-0 bg-yellow-500/5 pointer-events-none"
              ></div>
              <span
                :id="'winner-label-' + idx"
                class="text-[12px] font-black text-gray-300 uppercase tracking-widest block mb-2 sm:mb-3 relative z-10"
                >{{
                  winners.length > 1 ? winner.name + "'s Hand" : 'Winning Hand'
                }}</span
              >
              <div
                :id="'winner-hand-name-' + idx"
                class="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 relative z-10"
              >
                {{ winner.handName }}
              </div>

              <div
                v-if="flattenCards(winner.winningCards).length > 0"
                :id="'winner-cards-flex-' + idx"
                class="flex justify-center gap-2 sm:gap-3 relative z-10 scale-90 sm:scale-100"
              >
                <Card
                  v-for="(card, i) in flattenCards(winner.winningCards)"
                  :id="'winner-card-' + idx + '-' + i"
                  :key="'card-' + i"
                  :size="responsive.cardSize"
                  :percentage="responsive.cardPercentage"
                  :numSymbol="card"
                />
              </div>
              <div
                v-else
                :id="'winner-no-cards-' + idx"
                class="text-[12px] text-gray-400 italic relative z-10"
              >
                (No cards shown)
              </div>
            </div>
          </div>

          <!-- Other Players -->
          <div id="opponents-section" class="w-full text-left">
            <span
              id="opponents-label"
              class="text-[12px] font-black text-gray-300 uppercase tracking-widest block mb-2 sm:mb-3 border-b border-white/5 pb-2"
              >Showdown / Opponents</span
            >
            <div
              id="opponents-grid"
              class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-h-40 sm:max-h-48 overflow-y-auto pr-2 custom-scrollbar"
            >
              <div
                v-for="player in opponentsHands"
                :id="'opponent-box-' + player.playerId"
                :key="player.playerId"
                class="flex items-center justify-between bg-black/20 p-2 sm:p-3 rounded-xl border border-white/5"
              >
                <div
                  :id="'opponent-info-' + player.playerId"
                  class="flex-1 min-w-0"
                >
                  <div
                    :id="'opponent-name-' + player.playerId"
                    class="text-sm font-bold text-white truncate"
                  >
                    {{ player.name }}
                  </div>
                  <div
                    :id="'opponent-hand-type-' + player.playerId"
                    class="text-[10px] text-gray-400 italic uppercase tracking-tighter truncate"
                  >
                    {{
                      player.pokerHand || (player.folded ? 'Folded' : 'Active')
                    }}
                  </div>
                </div>
                <div
                  :id="'opponent-cards-visual-' + player.playerId"
                  class="flex -space-x-4 sm:-space-x-5 opacity-80 scale-75 sm:scale-90 origin-right"
                >
                  <template
                    v-if="player.show && flattenCards(player.show).length > 0"
                  >
                    <Card
                      v-for="(c, idx) in flattenCards(player.show).slice(0, 2)"
                      :id="'opponent-card-' + player.playerId + '-' + idx"
                      :key="idx"
                      size="small"
                      :numSymbol="c"
                    />
                  </template>
                  <template v-else>
                    <div
                      :id="'opponent-placeholder-1-' + player.playerId"
                      class="w-8 h-12 sm:w-10 sm:h-14 bg-gray-800 rounded-md border border-white/10 flex items-center justify-center opacity-30"
                    >
                      <div
                        :id="'opponent-card-pattern-1-' + player.playerId"
                        class="w-full h-full bg-[repeating-linear-gradient(45deg,#2d3748,#2d3748_5px,#1a202c_5px,#1a202c_10px)] rounded-sm"
                      ></div>
                    </div>
                    <div
                      :id="'opponent-placeholder-2-' + player.playerId"
                      class="w-8 h-12 sm:w-10 sm:h-14 bg-gray-800 rounded-md border border-white/10 flex items-center justify-center opacity-30"
                    >
                      <div
                        :id="'opponent-card-pattern-2-' + player.playerId"
                        class="w-full h-full bg-[repeating-linear-gradient(45deg,#2d3748,#2d3748_5px,#1a202c_5px,#1a202c_10px)] rounded-sm"
                      ></div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Info & Timer -->
          <div
            id="winner-footer-section"
            class="mt-6 sm:mt-8 w-full flex flex-col items-center gap-3 sm:gap-4"
          >
            <div
              id="timer-info-flex"
              class="flex gap-4 sm:gap-6 text-[12px] font-black text-gray-300 uppercase tracking-widest"
            >
              <div
                id="next-round-timer-wrapper"
                class="flex items-center gap-2"
              >
                <div
                  id="timer-indicator-dot"
                  class="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"
                ></div>
                Next Round in {{ countdown }}s
              </div>
              <div id="pot-status-label">Pot Cleared</div>
            </div>

            <!-- Visual Timer Bar -->
            <div
              id="visual-timer-bar-container"
              class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden"
            >
              <div
                id="visual-timer-bar-progress"
                class="h-full bg-yellow-500 transition-all duration-50 ease-linear"
                :style="{ width: `${(countdown / 15) * 100}%` }"
              ></div>
            </div>

            <button
              id="winner-continue-button"
              @click="handleClose"
              :disabled="isWaiting"
              class="mt-2 px-6 sm:px-8 py-2 sm:py-3 bg-white/10 hover:bg-white/20 disabled:hover:bg-white/10 border border-white/10 rounded-full text-[12px] sm:text-sm font-black uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <div
                v-if="isWaiting"
                id="waiting-spinner"
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              ></div>
              {{ isWaiting ? 'Waiting for others...' : 'Play New Game' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, onUnmounted, watch } from 'vue'
import Card from './Card.vue'
import { usePokerStore } from '../store/pokerStore'
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()

const props = defineProps({
  winnerInfo: Object,
})

const emit = defineEmits(['close'])

const pokerStore = usePokerStore()
const countdown = ref(15)
const isVisible = ref(true)
const isWaiting = ref(false)
let timer = null

const startTimer = () => {
  stopTimer()
  countdown.value = 15
  isVisible.value = true
  isWaiting.value = false
  const startTime = Date.now()

  const tick = () => {
    const elapsed = Date.now() - startTime
    const remaining = Math.max(0, Math.ceil((15000 - elapsed) / 1000))
    countdown.value = remaining

    if (elapsed < 15000) {
      const nextTick = 1000 - (elapsed % 1000)
      timer = setTimeout(tick, nextTick)
    } else {
      handleClose()
      timer = null
    }
  }

  tick()
}

const stopTimer = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

const handleClose = () => {
  if (isWaiting.value) return
  isWaiting.value = true
  emit('close')
  // We don't clear it immediately here to allow for the transition
  // and because Game.vue will handle the nextRound message.
  // But we want to ensure it eventually gets cleared.
  setTimeout(() => {
    isVisible.value = false
    pokerStore.clearWinnerInfo()
  }, 500)
}

const closeOverlay = () => {
  isVisible.value = false
  pokerStore.clearWinnerInfo()
}

const winners = computed(() => {
  if (!props.winnerInfo) return []
  if (props.winnerInfo.winners) return props.winnerInfo.winners
  if (props.winnerInfo.winner) return [props.winnerInfo.winner]
  return []
})

const winnerNames = computed(() => {
  return winners.value.map((w) => w.name).join(' & ')
})

const totalAmount = computed(() => {
  return winners.value.reduce((sum, w) => sum + (w.amount || 0), 0)
})

const flattenCards = (cards) => {
  if (!cards) return []
  if (typeof cards === 'string') return [cards]
  return cards.flat()
}

watch(
  () => props.winnerInfo,
  (newVal) => {
    if (newVal) {
      startTimer()
    } else {
      stopTimer()
      isVisible.value = false
      isWaiting.value = false
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  stopTimer()
})

const opponentsHands = computed(() => {
  if (!props.winnerInfo?.allHands) return []
  const winnerIds = winners.value.map((w) => w.playerId)
  return props.winnerInfo.allHands.filter(
    (h) => !winnerIds.includes(h.playerId) && h.lastAction !== 'Out',
  )
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(234, 179, 8, 0.3);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(234, 179, 8, 0.5);
}
</style>
