<template>
  <Transition
    enter-active-class="transition duration-700 ease-out"
    enter-from-class="opacity-0 scale-90"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-500 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-90"
  >
    <div
      v-if="winnerInfo && isVisible"
      :id="'winner-overlay-viewport-root-' + templateSuffix"
      class="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-[#060E07]/95 backdrop-blur-2xl overflow-hidden font-sans select-none"
    >
      <!-- Background Decorations -->
      <div class="absolute inset-0 pointer-events-none">
        <div
          class="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(212,168,83,0.07)_0%,transparent_60%)]"
        ></div>
        <div
          class="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_100%,rgba(13,31,15,0.9)_0%,transparent_70%)]"
        ></div>
        <div
          class="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.012)_2px,rgba(255,255,255,0.012)_4px)]"
        ></div>
      </div>

      <!-- Confetti -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          v-for="i in 60"
          :key="i"
          class="confetti-piece"
          :style="getConfettiStyle(i)"
        >
          {{ confettiShapes[i % confettiShapes.length] }}
        </div>
      </div>

      <div
        :id="'winner-announcement-modal-container-' + templateSuffix"
        class="relative w-full max-w-4xl h-full flex flex-col items-center z-10 p-1 sm:p-2"
      >
        <!-- scrollable area within full screen -->
        <div
          class="flex-1 w-full flex flex-col items-center justify-center gap-1 overflow-y-auto custom-scrollbar py-1"
        >
          <!-- Trophy -->
          <div class="trophy-wrap relative animate-trophy-drop shrink-0">
            <div
              class="trophy-glow absolute -inset-6 bg-[radial-gradient(ellipse,rgba(212,168,83,0.35)_0%,transparent_70%)] animate-pulse-glow"
            ></div>
            <span
              class="trophy-icon text-7xl sm:text-8xl relative z-10 drop-shadow-[0_0_20px_rgba(212,168,83,0.7)] animate-trophy-bounce"
              >🏆</span
            >
          </div>

          <!-- Title -->
          <div
            class="title-block text-center animate-fade-up animation-delay-300 shrink-0"
          >
            <p
              class="title-eyebrow font-mono text-sm tracking-[3px] uppercase text-[#D4A853]"
            >
              YAY Poker ·
              {{
                winners.length > 1 ? $t('winner.split_pot') : $t('winner.wins')
              }}
            </p>
            <h1
              class="title-main font-bebas text-6xl sm:text-7xl leading-[0.95] tracking-[1px] bg-gradient-to-br from-[#F5D78E] via-[#D4A853] to-[#8A6A2A] bg-clip-text text-transparent"
            >
              {{ winnerNames.toUpperCase() }}
            </h1>
            <div
              class="text-4xl sm:text-5xl font-mono font-black text-[#F5D78E] drop-shadow-2xl"
            >
              +${{ totalAmount.toLocaleString() }}
            </div>
          </div>

          <!-- Showdown - All Players -->
          <div
            v-if="allShowdownPlayers.length > 0"
            class="w-full max-w-lg animate-fade-up animation-delay-500 shrink-0"
          >
            <div
              class="flex flex-col gap-1 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1"
            >
              <div
                v-for="(player, idx) in allShowdownPlayers"
                :key="player.playerId || idx"
                class="flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-colors"
                :class="
                  isWinner(player)
                    ? 'bg-[#1E3D20] border-[#D4A853]/40'
                    : 'bg-black/30 border-white/5'
                "
              >
                <!-- Position badge -->
                <div
                  class="w-7 h-7 rounded flex items-center justify-center text-sm font-black shrink-0"
                  :class="
                    isWinner(player)
                      ? 'bg-[#D4A853] text-black'
                      : 'bg-white/10 text-white/50'
                  "
                >
                  {{ idx + 1 }}
                </div>

                <!-- Name -->
                <div class="min-w-0 flex-1">
                  <div
                    class="text-base font-bold text-[#F5F0E8] truncate leading-tight"
                    :class="{ 'text-[#F5D78E]': isWinner(player) }"
                  >
                    {{ cleanPlayerName(player.name) }}
                  </div>
                  <div
                    class="text-xs font-mono uppercase text-[#9E9080] tracking-wider leading-tight truncate"
                  >
                    {{
                      formatHandName(player.pokerHand || player.handName || '')
                    }}
                  </div>
                </div>

                <!-- Cards -->
                <div class="flex shrink-0">
                  <Card
                    v-for="(card, ci) in getPlayerShowdownCards(player).slice(
                      0,
                      2,
                    )"
                    :key="ci"
                    size="small"
                    :percentage="65"
                    :numSymbol="card"
                  />
                </div>

                <!-- Amount -->
                <div
                  v-if="isWinner(player) && player.amount"
                  class="text-base font-mono font-bold text-[#F5D78E] shrink-0 ml-1"
                >
                  +${{ player.amount.toLocaleString() }}
                </div>
                <div
                  v-else-if="player.handContribution > 0"
                  class="text-sm font-mono text-[#9E9080] shrink-0 ml-1"
                >
                  -${{ player.handContribution }}
                </div>
              </div>
            </div>
          </div>

          <!-- Footer & Timer -->
          <div
            class="w-full max-w-lg animate-fade-up animation-delay-900 shrink-0 pb-1"
          >
            <div class="flex items-center justify-between gap-2 mb-1">
              <div class="flex items-center gap-1.5">
                <div
                  class="w-1.5 h-1.5 bg-green-500 rounded-full animate-blink"
                ></div>
                <span
                  class="font-mono text-sm tracking-[1px] uppercase text-[#9E9080]"
                >
                  {{ $t('winner.next_round', { count: countdown }) }}
                </span>
              </div>
              <div class="font-mono text-sm text-[#9E9080]">
                {{ $t('winner.pot_cleared') }}
              </div>
            </div>
            <div
              class="w-full h-0.5 bg-white/5 rounded-full overflow-hidden mb-2"
            >
              <div
                class="h-full bg-gradient-to-r from-[#D4A853]/50 to-[#D4A853] transition-all duration-50 ease-linear"
                :style="{ width: `${(countdown / 25) * 100}%` }"
              ></div>
            </div>

            <button
              @click="handleClose"
              :disabled="isWaiting"
              class="w-full py-3 bg-transparent border border-[#D4A853]/20 hover:border-[#D4A853]/50 text-[#D4A853]/70 hover:text-[#D4A853] rounded-lg text-sm font-black uppercase tracking-[0.15em] transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <div
                v-if="isWaiting"
                class="w-4 h-4 border-2 border-[#D4A853]/30 border-t-[#D4A853] rounded-full animate-spin"
              ></div>
              {{
                isWaiting ? $t('winner.waiting_others') : $t('winner.continue')
              }}
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
import { useI18n } from 'vue-i18n'
import { cleanPlayerName } from '../vutils'

const { t } = useI18n()
const responsive = useResponsiveStore()

const props = defineProps({
  winnerInfo: Object,
})

const emit = defineEmits(['close'])

const pokerStore = usePokerStore()
const templateSuffix = computed(() => responsive.templateSuffix || 'Default')
const countdown = ref(25)
const isVisible = ref(true)
const isWaiting = ref(false)
let timer = null

const startTimer = () => {
  stopTimer()
  countdown.value = 25
  isVisible.value = true
  isWaiting.value = false
  const startTime = Date.now()

  const tick = () => {
    const elapsed = Date.now() - startTime
    const remaining = Math.max(0, Math.ceil((25000 - elapsed) / 1000))
    countdown.value = remaining

    if (elapsed < 25000) {
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
  setTimeout(() => {
    isVisible.value = false
    pokerStore.clearWinnerInfo()
  }, 500)
}

const winners = computed(() => {
  if (!props.winnerInfo) return []
  if (props.winnerInfo.winners) return props.winnerInfo.winners
  if (props.winnerInfo.winner) return [props.winnerInfo.winner]
  return []
})

const winnerNames = computed(() => {
  return winners.value.map((w) => cleanPlayerName(w.name)).join(' & ')
})

const totalAmount = computed(() => {
  return winners.value.reduce((sum, w) => sum + (w.amount || 0), 0)
})

const flattenCards = (cards) => {
  if (!cards) return []
  if (typeof cards === 'string') return [cards]
  return cards.flat()
}

const getCardsToDisplay = (obj) => {
  if (!obj) return []
  return flattenCards(
    obj.privateCards || obj.playerCards || obj.show || obj.cards,
  )
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

const winnerIds = computed(() => winners.value.map((w) => w.playerId || w.id))

const isWinner = (player) => winnerIds.value.includes(player.playerId)

const getPlayerShowdownCards = (player) => {
  return getCardsToDisplay(player).slice(0, 2)
}

const formatHandName = (name) => {
  if (!name) return ''
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

const allShowdownPlayers = computed(() => {
  let all = []
  if (props.winnerInfo?.allHands) {
    all = props.winnerInfo.allHands.filter((h) => h.lastAction !== 'Out')
  } else {
    all = pokerStore.getPlayers.filter((p) => !p.folded && p.isStarted)
  }
  all.sort((a, b) => {
    const aWin = winnerIds.value.includes(a.playerId || a.id) ? 0 : 1
    const bWin = winnerIds.value.includes(b.playerId || b.id) ? 0 : 1
    if (aWin !== bWin) return aWin - bWin
    return (a.prizeRank || 99) - (b.prizeRank || 99)
  })
  return all
})

// Confetti Styles (Copied from WinnerTournamentOverlay)
const confettiShapes = ['■', '●', '▲', '◆']
const confettiColors = [
  '#D4A853',
  '#F5D78E',
  '#E74C3C',
  '#2471A3',
  '#F0F0F0',
  '#C0392B',
]

const getConfettiStyle = (i) => {
  const left = Math.random() * 100
  const color = confettiColors[i % confettiColors.length]
  const size = 6 + Math.random() * 8
  const duration = 3 + Math.random() * 4
  const delay = Math.random() * 3
  const opacity = 0.4 + Math.random() * 0.6

  return {
    left: `${left}%`,
    color: color,
    fontSize: `${size}px`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
    opacity: opacity,
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

.font-bebas {
  font-family: 'Bebas Neue', sans-serif;
}

.animation-delay-300 {
  animation-delay: 0.3s;
}
.animation-delay-500 {
  animation-delay: 0.5s;
}
.animation-delay-700 {
  animation-delay: 0.7s;
}
.animation-delay-900 {
  animation-delay: 0.9s;
}

.animate-fade-up {
  animation: fade-up 0.6s both;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-trophy-drop {
  animation: trophy-drop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes trophy-drop {
  from {
    transform: translateY(-60px) scale(0.5);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite alternate;
}

@keyframes pulse-glow {
  from {
    opacity: 0.6;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1.1);
  }
}

.animate-trophy-bounce {
  animation: trophy-bounce 3s ease-in-out infinite;
}

@keyframes trophy-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.animate-blink {
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
}

.confetti-piece {
  position: absolute;
  width: 8px;
  height: 8px;
  top: -10px;
  animation: fall linear infinite;
}

@keyframes fall {
  to {
    transform: translateY(110vh) rotate(720deg);
    opacity: 0;
  }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(212, 168, 83, 0.2);
  border-radius: 10px;
}
</style>
