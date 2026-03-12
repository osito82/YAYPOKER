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
      class="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl"
    >
      <!-- Confetti Cannon Placeholder Effect (CSS only) -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="confetti" v-for="i in 50" :key="i"></div>
      </div>

      <div
        :id="'winner-tournament-announcement-modal-container-' + templateSuffix"
        class="relative w-full max-w-3xl max-h-[95vh] bg-gradient-to-br from-yellow-900/20 via-gray-900 to-black border-2 sm:border-4 border-yellow-500 rounded-2xl sm:rounded-[3rem] shadow-[0_0_150px_rgba(234,179,8,0.5)] flex flex-col overflow-hidden animate-glow"
      >
        <!-- Decoration -->
        <div
          :id="'winner-tournament-modal-top-accent-line-' + templateSuffix"
          class="absolute top-0 left-0 w-full h-1 sm:h-2 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"
        ></div>

        <!-- Scrollable Content -->
        <div
          :id="'winner-tournament-modal-scrollable-content-' + templateSuffix"
          class="p-6 sm:p-12 flex flex-col items-center text-center overflow-y-auto custom-scrollbar"
        >
          <!-- Big Trophy Icon -->
          <div
            :id="'winner-tournament-trophy-icon-wrapper-' + templateSuffix"
            class="w-16 h-16 sm:w-32 sm:h-32 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center mb-4 sm:mb-8 shadow-[0_0_50px_rgba(234,179,8,0.6)] shrink-0 animate-bounce-slow"
          >
             <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 sm:h-16 sm:w-16 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2H6V4H2V9C2 12.866 5.134 16 9 16V18H7V22H17V18H15V16C18.866 16 22 12.866 22 9V4H18V2ZM4 9V6H6V14C4.895 14 4 13.105 4 12V9ZM20 12C20 13.105 19.105 14 18 14V6H20V12Z" />
             </svg>
          </div>

          <h1
            :id="'winner-tournament-congratulations-text-' + templateSuffix"
            class="text-lg sm:text-3xl font-black text-yellow-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-2 sm:mb-4 animate-pulse shrink-0"
          >
            Tournament Champion
          </h1>

          <h2
            :id="'winner-tournament-announcement-title-text-' + templateSuffix"
            class="text-3xl sm:text-7xl font-black text-white uppercase tracking-tighter mb-2 sm:mb-6 shrink-0"
          >
            {{ winnerName }}
          </h2>

          <div
            :id="'winner-tournament-total-prize-amount-display-' + templateSuffix"
            class="text-5xl sm:text-8xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 mb-6 sm:mb-12 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] shrink-0"
          >
            ${{ totalAmount }}
          </div>

          <!-- Victory Message -->
          <div
            :id="'winner-tournament-victory-message-box-' + templateSuffix"
            class="bg-white/5 border border-yellow-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 w-full max-w-lg mb-6 sm:mb-8 relative overflow-hidden backdrop-blur-sm shrink-0"
          >
            <div class="absolute inset-0 bg-yellow-500/5"></div>
            <p :id="'winner-tournament-victory-subtext-' + templateSuffix" class="text-lg sm:text-2xl font-bold text-gray-200 relative z-10 leading-relaxed">
              {{ winnerName }} has conquered the table and claimed the ultimate prize!
            </p>
          </div>

          <!-- Footer Info & Timer -->
          <div
            :id="'winner-tournament-overlay-footer-action-area-' + templateSuffix"
            class="w-full flex flex-col items-center gap-3 sm:gap-6 shrink-0"
          >
            <div
              :id="'winner-tournament-overlay-lobby-timer-layout-' + templateSuffix"
              class="flex flex-col items-center gap-1 sm:gap-3 text-xs sm:text-base font-black text-gray-400 uppercase tracking-widest"
            >
               <div :id="'winner-tournament-overlay-next-game-text-' + templateSuffix">Returning to Lobby in</div>
               <div :id="'winner-tournament-overlay-countdown-timer-value-' + templateSuffix" class="text-2xl sm:text-3xl text-yellow-500">{{ countdown }}s</div>
            </div>

            <!-- Visual Timer Bar -->
            <div
              :id="'winner-tournament-overlay-countdown-progress-bar-track-' + templateSuffix"
              class="w-full max-w-xs sm:max-w-md h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden border border-white/10"
            >
              <div
                :id="'winner-tournament-overlay-countdown-progress-bar-fill-' + templateSuffix"
                class="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-50 ease-linear"
                :style="{ width: `${(countdown / 60) * 100}%` }"
              ></div>
            </div>

            <button
              :id="'winner-tournament-overlay-close-action-button-' + templateSuffix"
              @click="handleClose"
              class="mt-2 sm:mt-4 px-8 py-3 sm:px-10 sm:py-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-full text-base sm:text-lg font-black uppercase tracking-widest transition-all hover:scale-110 active:scale-95 shadow-[0_10px_30px_rgba(234,179,8,0.3)]"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, onUnmounted, watch } from 'vue'
import { usePokerStore } from '../store/pokerStore'
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()
const templateSuffix = computed(() => responsive.templateSuffix || 'Default')

const props = defineProps({
  winnerInfo: Object,
})

const emit = defineEmits(['close'])

const pokerStore = usePokerStore()
const DURATION = 60 // 1 minute as requested
const countdown = ref(DURATION)
const isVisible = ref(true)
let timer = null

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
  // For tournament winner, we might want to redirect or reset differently, 
  // but following the pattern for now.
  setTimeout(() => {
    pokerStore.clearWinnerInfo()
  }, 500)
}

const winnerName = computed(() => {
  if (!props.winnerInfo) return 'Champion'
  // Match.js winnerTournament sends winnersInfo[0] as 'winner' in the msgBuilder
  return props.winnerInfo.winner?.name || props.winnerInfo.winners?.[0]?.name || 'Champion'
})

const totalAmount = computed(() => {
  if (!props.winnerInfo) return 0
  return props.winnerInfo.winner?.amount || props.winnerInfo.winners?.[0]?.amount || 0
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
.animate-bounce-slow {
  animation: bounce-slow 3s infinite;
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.animate-glow {
  animation: glow 4s infinite alternate;
}

@keyframes glow {
  from { box-shadow: 0 0 50px rgba(234,179,8,0.3); }
  to { box-shadow: 0 0 100px rgba(234,179,8,0.6); }
}

/* Simple Confetti Effect */
.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #eab308;
  top: -20px;
  animation: fall var(--d) linear infinite;
  left: var(--l);
  opacity: var(--o);
}

@keyframes fall {
  to { transform: translateY(100vh) rotate(360deg); }
}

/* Generate random positions/durations via CSS vars if possible, 
   but since we are in a static block, we'll just add a few variations */
.confetti:nth-child(2n) { background-color: #ffffff; width: 7px; height: 7px; }
.confetti:nth-child(3n) { background-color: #000000; border: 1px solid #eab308; }

/* Set some defaults for the loop elements */
.confetti {
  --d: 3s;
  --l: 50%;
  --o: 0.7;
}

/* Using simple nth-child selectors to spread them out manually in CSS since we can't use random() in standard CSS easily */
.confetti:nth-child(1) { --l: 10%; --d: 3s; }
.confetti:nth-child(2) { --l: 20%; --d: 4s; }
.confetti:nth-child(3) { --l: 30%; --d: 2.5s; }
.confetti:nth-child(4) { --l: 40%; --d: 5s; }
.confetti:nth-child(5) { --l: 50%; --d: 3.5s; }
.confetti:nth-child(6) { --l: 60%; --d: 4.5s; }
.confetti:nth-child(7) { --l: 70%; --d: 2.8s; }
.confetti:nth-child(8) { --l: 80%; --d: 4.2s; }
.confetti:nth-child(9) { --l: 90%; --d: 3.2s; }
.confetti:nth-child(10) { --l: 95%; --d: 4.8s; }
/* ... and so on for more variety if needed */
</style>
