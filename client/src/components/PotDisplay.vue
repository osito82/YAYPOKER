<template>
  <div
    :id="`pot-display-container-${templateSuffix}`"
    class="pot-display flex items-center justify-center py-1.5 px-6 backdrop-blur-2xl rounded-b-2xl transition-all duration-500 group"
  >
    <div
      v-if="lobbyTimer"
      :id="`pot-display-lobby-timer-${templateSuffix}`"
      class="flex flex-col items-center gap-1 py-1"
    >
      <div
        :id="`pot-display-lobby-header-${templateSuffix}`"
        class="flex items-center gap-3"
      >
        <span
          :id="`pot-display-lobby-label-${templateSuffix}`"
          class="text-xs font-black uppercase tracking-widest text-yellow-500/80"
          >Lobby</span
        >
        <div
          :id="`pot-display-lobby-time-wrapper-${templateSuffix}`"
          class="flex items-baseline gap-1"
        >
          <span
            :id="`pot-display-lobby-time-value-${templateSuffix}`"
            class="text-3xl md:text-4xl font-mono font-black text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
          >
            {{ formattedTime }}
          </span>
          <span
            :id="`pot-display-lobby-time-unit-${templateSuffix}`"
            class="text-xs font-bold text-white/40 uppercase"
            >sec</span
          >
        </div>
      </div>

      <div
        :id="`pot-display-lobby-players-status-${templateSuffix}`"
        class="flex items-center gap-2"
      >
        <div
          :id="`pot-display-lobby-players-dots-${templateSuffix}`"
          class="flex -space-x-1"
        >
          <template v-for="i in lobbyTimer.connectedPlayers" :key="i">
            <div
              :id="`pot-display-lobby-player-dot-${i}-${templateSuffix}`"
              class="w-2 h-2 rounded-full border border-black"
              :class="
                i <= lobbyTimer.readyPlayers
                  ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]'
                  : 'bg-white/20'
              "
            ></div>
          </template>
        </div>
        <span
          :id="`pot-display-lobby-players-text-${templateSuffix}`"
          class="text-[10px] font-bold text-white/50 uppercase tracking-tighter"
        >
          {{ lobbyTimer.readyPlayers }}/{{ lobbyTimer.connectedPlayers }} Ready
        </span>
      </div>
    </div>

    <!-- Multiple Pots Display -->
    <div
      v-else-if="pots && pots.length > 1"
      :id="`pot-display-multi-pots-${templateSuffix}`"
      class="flex flex-col items-center py-1"
    >
      <div
        :id="`pot-display-total-pot-wrapper-${templateSuffix}`"
        class="flex items-center gap-2 mb-1"
      >
        <span
          :id="`pot-display-total-pot-label-${templateSuffix}`"
          class="text-xs font-black uppercase tracking-widest text-yellow-500/60"
          >Total Pot</span
        >
        <span
          :id="`pot-display-total-pot-value-${templateSuffix}`"
          class="text-xl font-mono font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
        >
          ${{ amount }}
        </span>
      </div>
      <div
        :id="`pot-display-side-pots-scroll-${templateSuffix}`"
        class="flex gap-4 overflow-x-auto max-w-xs md:max-w-md no-scrollbar pb-1"
      >
        <div
          v-for="(p, index) in pots"
          :key="index"
          :id="`pot-display-pot-item-${index}-${templateSuffix}`"
          class="flex flex-col items-center px-2 border-l border-white/10 first:border-0"
        >
          <span
            :id="`pot-display-pot-label-${index}-${templateSuffix}`"
            class="text-[9px] font-bold uppercase text-white/40 tracking-tighter whitespace-nowrap"
          >
            {{ index === 0 ? 'Main' : 'Side ' + index }}
          </span>
          <span
            :id="`pot-display-pot-value-${index}-${templateSuffix}`"
            :title="
              index === 0
                ? $t('game.main_pot_tooltip')
                : $t('game.side_pot_tooltip')
            "
            class="text-sm font-mono font-bold text-yellow-500/90 tracking-tighter"
          >
            ${{ p.amount }}
          </span>
        </div>
      </div>
    </div>

    <!-- Single Pot Display (Default) -->
    <div
      v-else
      :id="`pot-display-single-pot-${templateSuffix}`"
      class="flex items-center gap-2"
    >
      <span
        :id="`pot-display-label-${templateSuffix}`"
        class="text-2xl md:text-3xl font-mono font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.25)] tracking-tight group-hover:scale-105 transition-transform"
      >
        Pot
      </span>

      <span
        :id="`pot-display-currency-symbol-${templateSuffix}`"
        class="text-yellow-500/60 font-black text-[10px] tracking-tighter mt-1"
        >$</span
      >

      <span
        :id="`pot-display-value-${templateSuffix}`"
        class="text-2xl md:text-3xl font-mono font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.25)] tracking-tight group-hover:scale-105 transition-transform"
      >
        {{ amount }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onUnmounted, watch } from 'vue'
import { usePokerStore } from '../store/pokerStore'
import { useResponsiveStore } from '../store/responsiveStore'

defineProps({
  amount: { type: [Number, String], default: 0 },
})

const store = usePokerStore()
const responsive = useResponsiveStore()
const templateSuffix = computed(() => responsive.templateSuffix)

const lobbyTimer = computed(() => store.getLobbyTimer)
const pots = computed(() => store.getPots)

const localTime = ref(0)
let interval = null

const formattedTime = computed(() => {
  return Math.max(0, Math.ceil(localTime.value))
})

const startCountdown = () => {
  stopCountdown()
  if (!lobbyTimer.value) return

  // Sync with store time
  localTime.value = lobbyTimer.value.timeRemaining

  // Calculate offset based on when the message was received
  const now = Date.now()
  const elapsedSinceMsg = (now - lobbyTimer.value.timestamp) / 1000
  localTime.value -= elapsedSinceMsg

  interval = setInterval(() => {
    localTime.value -= 0.1
    if (localTime.value <= 0) {
      localTime.value = 0
      stopCountdown()
    }
  }, 100)
}

const stopCountdown = () => {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

watch(
  () => lobbyTimer.value?.timestamp,
  () => {
    if (lobbyTimer.value) {
      startCountdown()
    } else {
      stopCountdown()
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  stopCountdown()
})
</script>

<style scoped>
.pot-display {
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.92) 0%,
    rgba(0, 0, 0, 0.85) 100%
  );
  border: 1px solid rgba(234, 179, 8, 0.25);
  border-top: none;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.8),
    0 0 0 1px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 0 20px rgba(234, 179, 8, 0.08);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
