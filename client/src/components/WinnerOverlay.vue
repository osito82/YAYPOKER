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
      class="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-[#060E07]/95 backdrop-blur-2xl overflow-hidden font-sans select-none"
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
        class="relative w-full max-w-2xl max-h-[95vh] flex flex-col items-center gap-0 z-10 overflow-y-auto custom-scrollbar p-4 sm:p-8"
      >
        <!-- Chip decoration -->
        <div class="chip-deco flex gap-1.5 justify-center mb-6 animate-fade-up">
          <div
            class="chip w-5 h-5 rounded-full border-2 border-white/20 bg-[#2471A3]"
          ></div>
          <div
            class="chip w-5 h-5 rounded-full border-2 border-white/20 bg-[#C0392B]"
          ></div>
          <div
            class="chip w-5 h-5 rounded-full border-2 border-white/30 bg-[#D4A853]"
          ></div>
          <div
            class="chip w-5 h-5 rounded-full border-2 border-white/20 bg-[#F5F0E8]"
          ></div>
          <div
            class="chip w-5 h-5 rounded-full border-2 border-white/20 bg-[#C0392B]"
          ></div>
          <div
            class="chip w-5 h-5 rounded-full border-2 border-white/20 bg-[#2471A3]"
          ></div>
        </div>

        <!-- Trophy -->
        <div class="trophy-wrap relative mb-6 animate-trophy-drop">
          <div
            class="trophy-glow absolute -inset-8 bg-[radial-gradient(ellipse,rgba(212,168,83,0.35)_0%,transparent_70%)] animate-pulse-glow"
          ></div>
          <span
            class="trophy-icon text-8xl sm:text-9xl relative z-10 drop-shadow-[0_0_20px_rgba(212,168,83,0.7)] animate-trophy-bounce"
            >🏆</span
          >
        </div>

        <!-- Title -->
        <div
          class="title-block text-center mb-8 animate-fade-up animation-delay-300"
        >
          <p
            class="title-eyebrow font-mono text-[11px] tracking-[4px] uppercase text-[#D4A853] mb-2"
          >
            YAY Poker ·
            {{
              winners.length > 1 ? $t('winner.split_pot') : $t('winner.wins')
            }}
          </p>
          <h1
            class="title-main font-bebas text-6xl sm:text-8xl leading-[0.95] tracking-[2px] bg-gradient-to-br from-[#F5D78E] via-[#D4A853] to-[#8A6A2A] bg-clip-text text-transparent"
          >
            {{ winnerNames.toUpperCase() }}
          </h1>
          <div
            class="text-4xl sm:text-6xl font-mono font-black text-[#F5D78E] mt-4 drop-shadow-2xl"
          >
            +${{ totalAmount.toLocaleString() }}
          </div>
        </div>

        <!-- Winning Hands Grid -->
        <div class="w-full grid gap-4 mb-8 animate-fade-up animation-delay-500">
          <div
            v-for="(winner, idx) in winners"
            :key="'winner-' + idx"
            class="winner-card w-full bg-gradient-to-br from-[#1E3D20] to-[#142A16] border border-[#D4A853]/30 rounded-2xl p-6 relative overflow-hidden"
          >
            <div
              class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4A853] to-transparent"
            ></div>

            <div class="flex justify-between items-center mb-4 relative z-10">
              <span
                class="font-mono text-[10px] tracking-[3px] uppercase text-[#D4A853]"
              >
                {{
                  winners.length > 1
                    ? $t('winner.player_hand', { name: cleanPlayerName(winner.name) })
                    : $t('winner.winning_hand')
                }}
              </span>
              <span
                v-if="winners.length > 1"
                class="font-mono text-lg text-[#F5D78E] font-bold"
                >+${{ winner.amount.toLocaleString() }}</span
              >
            </div>

            <h3 class="font-bebas text-3xl text-[#F5F0E8] mb-6 tracking-[1px]">
              {{ winner.handName }}
            </h3>

            <div
              class="flex flex-col gap-6 items-center sm:flex-row sm:justify-around"
            >
              <!-- Hole Cards -->
              <div class="flex flex-col items-center gap-2">
                <span
                  class="font-mono text-[9px] tracking-[2px] uppercase text-[#9E9080]"
                  >{{ $t('winner.hole_cards') }}</span
                >
                <div
                  v-if="flattenCards(winner.playerCards).length > 0"
                  class="flex gap-1.5"
                >
                  <Card
                    v-for="(card, i) in flattenCards(winner.playerCards)"
                    :key="'hole-' + i"
                    size="small"
                    :numSymbol="card"
                  />
                </div>
                <div v-else class="text-[10px] text-[#9E9080] italic">
                  {{ $t('winner.no_cards') }}
                </div>
              </div>

              <!-- Best Hand -->
              <div
                v-if="!winnerInfo.isFold"
                class="flex flex-col items-center gap-2"
              >
                <span
                  class="font-mono text-[9px] tracking-[2px] uppercase text-[#D4A853]/70"
                  >{{ $t('winner.best_hand') }}</span
                >
                <div
                  v-if="flattenCards(winner.winningCards).length > 0"
                  class="flex gap-1.5"
                >
                  <Card
                    v-for="(card, i) in flattenCards(winner.winningCards)"
                    :key="'card-' + i"
                    size="small"
                    :numSymbol="card"
                    class="ring-1 ring-[#D4A853]/50 shadow-[0_0_15px_rgba(212,168,83,0.3)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Showdown Opponents -->
        <div
          v-if="opponentsHands.length > 0"
          class="w-full mb-8 animate-fade-up animation-delay-700"
        >
          <span
            class="font-mono text-[10px] tracking-[3px] uppercase text-[#9E9080] block mb-4 border-b border-white/5 pb-2"
          >
            {{ $t('winner.showdown_opponents') }}
          </span>
          <div
            class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar"
          >
            <div
              v-for="player in opponentsHands"
              :key="player.playerId"
              class="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
            >
              <div class="flex-1 min-w-0">
                <div class="text-sm font-bold text-[#F5F0E8] truncate">
                  {{ cleanPlayerName(player.name) }}
                </div>
                <div
                  class="text-[9px] font-mono uppercase text-[#9E9080] tracking-wider"
                >
                  {{
                    player.pokerHand ||
                    (player.folded ? $t('winner.folded') : $t('winner.active'))
                  }}
                </div>
              </div>
              <div class="flex -space-x-4 opacity-90 scale-75 origin-right">
                <template
                  v-if="
                    flattenCards(player.playerCards || player.show).length > 0
                  "
                >
                  <Card
                    v-for="(c, idx) in flattenCards(
                      player.playerCards || player.show,
                    ).slice(0, 2)"
                    :key="idx"
                    size="small"
                    :numSymbol="c"
                  />
                </template>
                <template v-else>
                  <div
                    class="w-8 h-12 bg-white/5 rounded-md border border-white/10 flex items-center justify-center opacity-30"
                  >
                    <div
                      class="w-full h-full bg-[repeating-linear-gradient(45deg,#2d3748,#2d3748_5px,#1a202c_5px,#1a202c_10px)] rounded-sm"
                    ></div>
                  </div>
                  <div
                    class="w-8 h-12 bg-white/5 rounded-md border border-white/10 flex items-center justify-center opacity-30"
                  >
                    <div
                      class="w-full h-full bg-[repeating-linear-gradient(45deg,#2d3748,#2d3748_5px,#1a202c_5px,#1a202c_10px)] rounded-sm"
                    ></div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer & Timer -->
        <div
          class="w-full flex flex-col items-center gap-6 animate-fade-up animation-delay-900"
        >
          <div class="flex flex-col items-center gap-3 w-full">
            <div
              class="flex justify-between w-full font-mono text-[10px] tracking-[2px] uppercase text-[#9E9080]"
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-1.5 h-1.5 bg-green-500 rounded-full animate-blink"
                ></div>
                {{ $t('winner.next_round', { count: countdown }) }}
              </div>
              <div>{{ $t('winner.pot_cleared') }}</div>
            </div>
            <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-[#D4A853]/50 to-[#D4A853] transition-all duration-50 ease-linear"
                :style="{ width: `${(countdown / 15) * 100}%` }"
              ></div>
            </div>
          </div>

          <button
            @click="handleClose"
            :disabled="isWaiting"
            class="group relative px-12 py-4 bg-transparent border-2 border-[#D4A853]/20 hover:border-[#D4A853]/50 text-[#D4A853]/70 hover:text-[#D4A853] rounded-full text-sm font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
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
  const winnerIds = winners.value.map((w) => w.playerId || w.id)
  return props.winnerInfo.allHands.filter(
    (h) => !winnerIds.includes(h.playerId) && h.lastAction !== 'Out',
  )
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
