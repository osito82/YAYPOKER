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
        :id="'winner-tournament-announcement-modal-container-' + templateSuffix"
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
            Deush Poker · {{ $t('tournament.finished') }}
          </p>
          <h1
            class="title-main font-bebas text-7xl sm:text-8xl leading-[0.95] tracking-[2px] bg-gradient-to-br from-[#F5D78E] via-[#D4A853] to-[#8A6A2A] bg-clip-text text-transparent"
          >
            {{ $t('tournament.champion') }}
          </h1>
          <p
            class="title-sub font-bebas text-3xl sm:text-4xl tracking-[6px] text-[#F5F0E8] opacity-85 mt-1"
          >
            {{ $t('tournament.of_the_tournament') }}
          </p>
        </div>

        <!-- Winner Card -->
        <div
          class="winner-card w-full bg-gradient-to-br from-[#1E3D20] to-[#142A16] border border-[#D4A853]/30 rounded-2xl p-7 sm:p-8 mb-5 relative overflow-hidden animate-fade-up animation-delay-500"
        >
          <div
            class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4A853] to-transparent"
          ></div>
          <div
            class="absolute -top-5 -right-2 text-[120px] text-black/25 rotate-[-15deg] select-none"
          >
            ♠
          </div>

          <p
            class="winner-label font-mono text-[10px] tracking-[3px] uppercase text-[#D4A853] mb-1.5"
          >
            {{ $t('tournament.winner') }}
          </p>
          <h2
            class="winner-name font-bebas text-5xl sm:text-6xl tracking-[2px] leading-none text-[#F5F0E8] mb-4 relative z-10"
          >
            {{ winnerName.toUpperCase() }}
          </h2>

          <div class="winner-stats flex gap-6 flex-wrap relative z-10">
            <div class="stat flex flex-col gap-0.5">
              <span
                class="stat-label font-mono text-[9px] tracking-[2px] uppercase text-[#9E9080]"
                >{{ $t('tournament.final_chips') }}</span
              >
              <span
                class="stat-value font-mono text-base text-[#F5D78E] font-medium"
                >{{ totalAmount.toLocaleString() }} {{ $t('lobby.chips').toLowerCase() }}</span
              >
            </div>
            <div class="stat flex flex-col gap-0.5">
              <span
                class="stat-label font-mono text-[9px] tracking-[2px] uppercase text-[#9E9080]"
                >{{ $t('tournament.id') }}</span
              >
              <span
                class="stat-value font-mono text-base text-[#F5D78E] font-medium"
                >{{
                  (certificate?.torneoId || pokerStore.torneoId || '').slice(
                    0,
                    8,
                  )
                }}...</span
              >
            </div>
            <div class="stat flex flex-col gap-0.5">
              <span
                class="stat-label font-mono text-[9px] tracking-[2px] uppercase text-[#9E9080]"
                >{{ $t('tournament.date') }}</span
              >
              <span
                class="stat-value font-mono text-base text-[#F5D78E] font-medium"
                >{{ formattedDate }}</span
              >
            </div>
          </div>
        </div>

        <!-- Certificate Box -->
        <div
          class="cert-box w-full bg-[#060E07] border border-[#D4A853]/20 rounded-2xl p-7 sm:p-8 mb-5 relative animate-fade-up animation-delay-700"
        >
          <div class="cert-header flex items-center justify-between mb-5">
            <span
              class="cert-title font-mono text-[10px] tracking-[3px] uppercase text-[#D4A853]"
              >🎖 {{ $t('tournament.cert_code') }}</span
            >
            <div
              class="cert-badge flex items-center gap-1.5 px-2.5 py-1 bg-[#D4A853]/10 border border-[#D4A853]/25 rounded-full"
            >
              <div
                class="cert-badge-dot w-1.5 h-1.5 bg-[#D4A853] rounded-full animate-blink"
              ></div>
              <span
                class="cert-badge-text font-mono text-[9px] tracking-[1px] text-[#D4A853]"
                >{{ $t('tournament.official') }}</span
              >
            </div>
          </div>

          <div class="code-display flex items-center gap-3 mb-4">
            <div class="code-digits flex gap-2">
              <div
                v-for="(digit, i) in codeDisplay"
                :key="i"
                class="code-digit w-14 h-18 bg-[#1E3D20] border-2 border-[#D4A853]/40 rounded-xl flex items-center justify-center font-bebas text-4xl text-[#F5D78E] relative overflow-hidden shadow-2xl animate-digit-reveal"
                :style="{ animationDelay: `${0.8 + i * 0.15}s` }"
              >
                {{ digit }}
                <div
                  class="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/5 to-transparent"
                ></div>
              </div>
            </div>
          </div>

          <p class="code-info text-xs text-[#9E9080] leading-relaxed mb-6">
            {{ $t('tournament.cert_desc') }}
          </p>

          <div
            class="torneo-row flex items-center justify-between p-3 px-4 bg-white/[0.03] border border-white/[0.06] rounded-lg"
          >
            <span
              class="torneo-id-label font-mono text-[10px] tracking-[2px] uppercase text-[#9E9080]"
              >{{ $t('tournament.id') }}</span
            >
            <span
              class="torneo-id-value font-mono text-[12px] text-[#F5F0E8] mx-2 truncate"
              >{{ certificate?.torneoId || pokerStore.torneoId }}</span
            >
            <button
              @click="copyTorneoId"
              class="copy-btn bg-transparent border border-[#D4A853]/30 rounded-md text-[#D4A853] font-mono text-[10px] tracking-[1px] px-2.5 py-1 transition-all hover:bg-[#D4A853]/10 hover:border-[#D4A853] active:scale-95 shrink-0"
            >
              {{ copyStatus }}
            </button>
          </div>
        </div>

        <!-- Verify Link -->
        <div class="verify-link w-full animate-fade-up animation-delay-900">
          <router-link
            :to="{
              name: 'verify',
              params: {
                torneoId: certificate?.torneoId || pokerStore.torneoId,
                code: certificate?.code,
              },
            }"
            target="_blank"
            class="verify-btn block w-full p-4 text-center bg-gradient-to-br from-[#D4A853]/15 to-[#D4A853]/08 border border-[#D4A853]/35 rounded-xl text-[#F5D78E] font-mono text-xs tracking-[2px] uppercase transition-all hover:bg-[#D4A853]/25 hover:border-[#D4A853] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(212,168,83,0.15)]"
          >
            → {{ $t('tournament.verify_link', { url: 'deush.poker/verify' }) }}
          </router-link>
        </div>

        <button
          @click="handleClose"
          class="mt-8 px-10 py-4 bg-transparent border-2 border-[#D4A853]/20 hover:border-[#D4A853]/50 text-[#D4A853]/70 hover:text-[#D4A853] rounded-full text-sm font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95"
        >
          {{ $t('tournament.back_to_lobby', { count: countdown }) }}
        </button>

        <div
          class="footer mt-8 text-center font-mono text-[10px] tracking-[2px] text-[#8A6A2A] opacity-60 animate-fade-up animation-delay-1100"
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
import { usePokerStore } from '../store/pokerStore'
import { useResponsiveStore } from '../store/responsiveStore'

const { t, locale } = useI18n()
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
  emit('close')
  isVisible.value = false
  setTimeout(() => {
    pokerStore.clearWinnerInfo()
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

const winnerName = computed(() => {
  if (!props.winnerInfo) return 'Champion'
  return (
    props.winnerInfo.winner?.name ||
    props.winnerInfo.winners?.[0]?.name ||
    'Champion'
  )
})

const totalAmount = computed(() => {
  if (!props.winnerInfo) return 0
  return (
    props.winnerInfo.winner?.amount ||
    props.winnerInfo.winners?.[0]?.amount ||
    0
  )
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
.2);
  border-radius: 10px;
}
</style>
ustom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(212, 168, 83, 0.2);
  border-radius: 10px;
}
</style>
.2);
  border-radius: 10px;
}
</style>

}
</style>
tyle>
