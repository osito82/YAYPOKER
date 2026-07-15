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
      :id="'winner-tournament-overlay-viewport-root-' + templateSuffix"
      class="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-3 bg-[#060E07]/95 backdrop-blur-2xl overflow-hidden font-sans select-none"
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
        :id="'winner-tournament-announcement-modal-container-' + templateSuffix"
        class="relative w-full max-w-3xl h-full flex flex-col items-center z-10 p-1 sm:p-2"
      >
        <div
          class="flex-1 w-full flex flex-col items-center gap-1 overflow-y-auto custom-scrollbar py-1"
        >
          <!-- Trophy -->
          <div class="trophy-wrap relative animate-trophy-drop shrink-0">
            <div
              class="trophy-glow absolute -inset-6 bg-[radial-gradient(ellipse,rgba(212,168,83,0.35)_0%,transparent_70%)] animate-pulse-glow"
            ></div>
            <span
              class="trophy-icon text-5xl sm:text-6xl relative z-10 drop-shadow-[0_0_20px_rgba(212,168,83,0.7)] animate-trophy-bounce"
              >🏆</span
            >
          </div>

          <!-- Title -->
          <div
            class="title-block text-center animate-fade-up animation-delay-300 shrink-0"
          >
            <p
              class="font-mono text-[9px] tracking-[3px] uppercase text-[#D4A853]"
            >
              YAY Poker · {{ $t('tournament.finished') }}
            </p>
            <h1
              class="font-bebas text-4xl sm:text-5xl leading-tight tracking-[2px] bg-gradient-to-br from-[#F5D78E] via-[#D4A853] to-[#8A6A2A] bg-clip-text text-transparent"
            >
              {{ $t('tournament.champion') }}
            </h1>
            <p
              class="font-bebas text-xl sm:text-2xl tracking-[4px] text-[#F5F0E8] opacity-85"
            >
              {{ $t('tournament.of_the_tournament') }}
            </p>
          </div>

          <!-- Winner Card -->
          <div
            :id="'winner-tournament-card-' + templateSuffix"
            class="winner-card w-full max-w-lg bg-gradient-to-br from-[#1E3D20] to-[#142A16] border border-[#D4A853]/30 rounded-xl p-3 relative overflow-hidden animate-fade-up animation-delay-500 shrink-0"
          >
            <div
              class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4A853] to-transparent"
            ></div>

            <div
              class="flex items-center justify-between gap-2 mb-1 relative z-10"
            >
              <span
                class="winner-label font-mono text-[8px] tracking-[2px] uppercase text-[#D4A853] shrink-0"
              >
                {{ $t('tournament.winner') }}
              </span>
              <span
                class="winner-name font-bebas text-xl sm:text-2xl tracking-[1px] text-[#F5F0E8] truncate relative z-10"
              >
                {{ winnerName.toUpperCase() }}
              </span>
            </div>

            <!-- Stats row -->
            <div
              class="flex items-center gap-3 text-[10px] font-mono text-[#9E9080] relative z-10"
            >
              <span class="text-[#F5D78E] font-medium">
                {{ totalAmount.toLocaleString() }}
                {{ $t('lobby.chips').toLowerCase() }}
              </span>
              <span class="text-white/20">|</span>
              <span
                >{{
                  (certificate?.torneoId || pokerStore.torneoId || '').slice(
                    0,
                    8,
                  )
                }}...</span
              >
              <span class="text-white/20">|</span>
              <span>{{ formattedDate }}</span>
            </div>

            <!-- Final Winning Hand (if available) -->
            <div
              v-if="hasCardsToDisplay"
              class="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-[#D4A853]/20 relative z-10"
            >
              <div
                v-if="getCardsToDisplay(winnerObj).length > 0"
                class="flex gap-1"
              >
                <Card
                  v-for="(card, i) in getCardsToDisplay(winnerObj)"
                  :key="'hole-' + i"
                  size="xsmall"
                  :numSymbol="card"
                />
              </div>
              <div
                v-if="getWinningCards(winnerObj).length > 0"
                class="flex gap-1"
              >
                <Card
                  v-for="(card, i) in getWinningCards(winnerObj)"
                  :key="'card-' + i"
                  size="xsmall"
                  :numSymbol="card"
                  class="ring-1 ring-[#D4A853]/50 shadow-[0_0_8px_rgba(212,168,83,0.3)]"
                />
              </div>
              <span
                v-if="winnerObj.handName"
                class="font-bebas text-sm text-[#F5F0E8] tracking-[0.5px]"
              >
                {{ winnerObj.handName }}
              </span>
            </div>
          </div>

          <!-- Showdown - All Players -->
          <div
            v-if="allShowdownPlayers.length > 1"
            class="w-full max-w-lg animate-fade-up animation-delay-600 shrink-0"
          >
            <div
              class="flex flex-col gap-1 max-h-[30vh] overflow-y-auto custom-scrollbar pr-1"
            >
              <div
                v-for="(player, idx) in allShowdownPlayers"
                :key="player.playerId || idx"
                class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 border transition-colors"
                :class="
                  isWinner(player)
                    ? 'bg-[#1E3D20] border-[#D4A853]/40'
                    : 'bg-black/30 border-white/5'
                "
              >
                <div
                  class="w-5 h-5 rounded flex items-center justify-center text-[8px] font-black shrink-0"
                  :class="
                    isWinner(player)
                      ? 'bg-[#D4A853] text-black'
                      : 'bg-white/10 text-white/50'
                  "
                >
                  {{ idx + 1 }}
                </div>

                <div class="min-w-0 flex-1">
                  <div
                    class="text-[10px] font-bold text-[#F5F0E8] truncate leading-tight"
                    :class="{ 'text-[#F5D78E]': isWinner(player) }"
                  >
                    {{ cleanPlayerName(player.name) }}
                  </div>
                  <div
                    class="text-[7px] font-mono uppercase text-[#9E9080] tracking-wider leading-tight truncate"
                  >
                    {{
                      formatHandName(player.pokerHand || player.handName || '')
                    }}
                  </div>
                </div>

                <div class="flex shrink-0">
                  <Card
                    v-for="(card, ci) in getCardsToDisplay(player).slice(0, 2)"
                    :key="ci"
                    size="small"
                    :percentage="55"
                    :numSymbol="card"
                  />
                </div>

                <div
                  v-if="isWinner(player) && player.amount"
                  class="text-[10px] font-mono font-bold text-[#F5D78E] shrink-0 ml-1"
                >
                  +${{ player.amount.toLocaleString() }}
                </div>
                <div
                  v-else-if="player.handContribution > 0"
                  class="text-[8px] font-mono text-[#9E9080] shrink-0 ml-1"
                >
                  -${{ player.handContribution }}
                </div>
              </div>
            </div>
          </div>

          <!-- Certificate Box -->
          <div
            :id="'winner-tournament-cert-box-' + templateSuffix"
            class="cert-box w-full max-w-lg bg-[#060E07] border border-[#D4A853]/20 rounded-xl p-3 relative animate-fade-up animation-delay-700 shrink-0"
          >
            <div class="flex items-center justify-between mb-2">
              <span
                class="font-mono text-[8px] tracking-[2px] uppercase text-[#D4A853]"
              >
                🎖 {{ $t('tournament.cert_code') }}
              </span>
              <div
                class="flex items-center gap-1 px-2 py-0.5 bg-[#D4A853]/10 border border-[#D4A853]/25 rounded-full"
              >
                <div
                  class="w-1 h-1 bg-[#D4A853] rounded-full animate-blink"
                ></div>
                <span class="font-mono text-[7px] text-[#D4A853]">{{
                  $t('tournament.official')
                }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2 mb-2">
              <div class="flex gap-1.5">
                <div
                  v-for="(digit, i) in codeDisplay"
                  :key="i"
                  class="code-digit w-9 h-11 bg-[#1E3D20] border border-[#D4A853]/40 rounded-lg flex items-center justify-center font-bebas text-xl text-[#F5D78E] relative overflow-hidden shadow-lg animate-digit-reveal"
                  :style="{ animationDelay: `${0.5 + i * 0.1}s` }"
                >
                  {{ digit }}
                  <div
                    class="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/5 to-transparent"
                  ></div>
                </div>
              </div>
            </div>

            <p class="text-[10px] text-[#9E9080] leading-relaxed mb-2">
              {{ $t('tournament.cert_desc') }}
            </p>

            <div
              class="flex items-center justify-between p-2 bg-white/[0.03] border border-white/[0.06] rounded-lg"
            >
              <span
                class="font-mono text-[8px] tracking-[1px] uppercase text-[#9E9080]"
                >{{ $t('tournament.id') }}</span
              >
              <span
                class="font-mono text-[10px] text-[#F5F0E8] mx-2 truncate"
                >{{ certificate?.torneoId || pokerStore.torneoId }}</span
              >
              <button
                @click="copyTorneoId"
                class="bg-transparent border border-[#D4A853]/30 rounded-md text-[#D4A853] font-mono text-[8px] px-2 py-0.5 transition-all hover:bg-[#D4A853]/10 active:scale-95 shrink-0"
              >
                {{ copyStatus }}
              </button>
            </div>
          </div>

          <!-- Verify Link -->
          <div
            class="w-full max-w-lg animate-fade-up animation-delay-900 shrink-0"
          >
            <router-link
              :to="{
                name: 'verify',
                params: {
                  torneoId: certificate?.torneoId || pokerStore.torneoId,
                  code: certificate?.code,
                },
              }"
              target="_blank"
              class="block w-full py-2 text-center bg-gradient-to-br from-[#D4A853]/15 to-[#D4A853]/08 border border-[#D4A853]/35 rounded-lg text-[#F5D78E] font-mono text-[10px] tracking-[1px] uppercase transition-all hover:bg-[#D4A853]/25 hover:border-[#D4A853] active:scale-[0.99]"
            >
              →
              {{ $t('tournament.verify_link', { url: 'yaypoker.com/verify' }) }}
            </router-link>
          </div>

          <button
            @click="handleClose"
            class="w-full max-w-lg py-2 bg-transparent border border-[#D4A853]/20 hover:border-[#D4A853]/50 text-[#D4A853]/70 hover:text-[#D4A853] rounded-lg text-[10px] font-black uppercase tracking-[0.15em] transition-all active:scale-95 animate-fade-up animation-delay-900 shrink-0"
          >
            {{ $t('tournament.back_to_lobby', { count: countdown }) }}
          </button>
        </div>

        <div
          class="text-center font-mono text-[8px] text-[#8A6A2A] opacity-60 animate-fade-up animation-delay-1100 shrink-0"
        >
          {{ $t('tournament.system_footer') }}
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, onUnmounted, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Card from './Card.vue'
import { usePokerStore } from '../store/pokerStore'
import { useResponsiveStore } from '../store/responsiveStore'
import { cleanPlayerName } from '../vutils'

const { t, locale } = useI18n()
const router = useRouter()
const responsive = useResponsiveStore()
const templateSuffix = computed(() => responsive.templateSuffix || 'Default')

const props = defineProps({
  winnerInfo: Object,
})

const emit = defineEmits(['close'])

const pokerStore = usePokerStore()
const DURATION = 120 // Increased to 2 minutes to let winner enjoy the certificate
const countdown = ref(DURATION)
const isVisible = ref(true)
const copyStatus = ref(t('tournament.copy'))
let timer = null

const certificate = computed(() => props.winnerInfo?.certificate)
const codeDisplay = computed(() => {
  const code = String(certificate.value?.code || '????').padStart(4, '0')
  return code.split('')
})

const formattedDate = computed(() => {
  const date = certificate.value?.date
    ? new Date(certificate.value.date)
    : new Date()
  return date.toLocaleDateString(locale.value === 'es' ? 'es-ES' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
})

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

const startTimer = () => {
  stopTimer()
  countdown.value = DURATION
  isVisible.value = true
  const startTime = Date.now()

  const tick = () => {
    const elapsed = Date.now() - startTime
    const remaining = Math.max(0, Math.ceil((DURATION * 1000 - elapsed) / 1000))
    countdown.value = remaining

    if (elapsed < DURATION * 1000) {
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
  // Mostrar mensaje de confirmación antes de salir
  const hasSaved = confirm(t('tournament.save_cert_warning'))
  if (!hasSaved) return

  isVisible.value = false
  setTimeout(() => {
    pokerStore.clearWinnerInfo()
    router.push('/')
  }, 500)
}

const copyTorneoId = () => {
  const id = certificate.value?.torneoId || pokerStore.torneoId
  if (!id) return

  navigator.clipboard.writeText(id).then(() => {
    copyStatus.value = t('tournament.copied')
    setTimeout(() => {
      copyStatus.value = t('tournament.copy')
    }, 1500)
  })
}

const winnerObj = computed(() => {
  if (!props.winnerInfo) return null
  return (
    props.winnerInfo.winner ||
    (props.winnerInfo.winners ? props.winnerInfo.winners[0] : props.winnerInfo)
  )
})

const winnerName = computed(() => {
  return cleanPlayerName(winnerObj.value?.name || 'Champion')
})

const totalAmount = computed(() => {
  return winnerObj.value?.amount || 0
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

const getWinningCards = (obj) => {
  if (!obj) return []
  return flattenCards(obj.winningCards)
}

const hasCardsToDisplay = computed(() => {
  if (!winnerObj.value) return false
  return (
    getCardsToDisplay(winnerObj.value).length > 0 ||
    getWinningCards(winnerObj.value).length > 0
  )
})

const tournamentWinnerIds = computed(() => {
  if (!props.winnerInfo) return []
  if (props.winnerInfo.winners)
    return props.winnerInfo.winners.map((w) => w.playerId)
  if (props.winnerInfo.winner) return [props.winnerInfo.winner.playerId]
  return []
})

const isWinner = (player) => tournamentWinnerIds.value.includes(player.playerId)

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
    const aWin = tournamentWinnerIds.value.includes(a.playerId || a.id) ? 0 : 1
    const bWin = tournamentWinnerIds.value.includes(b.playerId || b.id) ? 0 : 1
    if (aWin !== bWin) return aWin - bWin
    return (a.prizeRank || 99) - (b.prizeRank || 99)
  })
  return all
})

watch(
  () => props.winnerInfo,
  (newVal) => {
    if (newVal) {
      startTimer()
    } else {
      stopTimer()
      isVisible.value = false
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  stopTimer()
})
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
.animation-delay-1100 {
  animation-delay: 1.1s;
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

.animate-digit-reveal {
  animation: digit-reveal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes digit-reveal {
  from {
    transform: scale(0.5) rotateX(90deg);
    opacity: 0;
  }
  to {
    transform: scale(1) rotateX(0deg);
    opacity: 1;
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
