<template>
  <div
    class="flex flex-col items-center justify-center py-1 px-4 sm:px-8
    bg-black/85 backdrop-blur-2xl
    rounded-b-2xl
    border-x border-b border-yellow-500/40
    shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(234,179,8,0.15)]
    transition-all duration-500
    hover:border-yellow-400/70
    hover:shadow-[0_15px_60px_rgba(0,0,0,1),0_0_40px_rgba(234,179,8,0.35)]
    group"
    :id="'pot-display-container-' + templateSuffix"
  >
    <div v-if="lobbyTimer" class="flex flex-col items-center gap-1 py-1" :id="'lobby-timer-wrapper-' + templateSuffix">
      <div class="flex items-center gap-3">
        <span class="text-xs font-black uppercase tracking-widest text-yellow-500/80">Lobby</span>
        <div class="flex items-baseline gap-1">
          <span
            class="text-3xl md:text-4xl font-mono font-black text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
            :id="'lobby-timer-countdown-text-' + templateSuffix"
          >
            {{ formattedTime }}
          </span>
          <span class="text-xs font-bold text-white/40 uppercase">sec</span>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
         <div class="flex -space-x-1">
            <template v-for="i in lobbyTimer.connectedPlayers" :key="i">
              <div 
                class="w-2 h-2 rounded-full border border-black"
                :class="i <= lobbyTimer.readyPlayers ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-white/20'"
              ></div>
            </template>
         </div>
         <span class="text-[10px] font-bold text-white/50 uppercase tracking-tighter">
           {{ lobbyTimer.readyPlayers }}/{{ lobbyTimer.connectedPlayers }} Ready
         </span>
      </div>
    </div>

    <div v-else class="flex flex-col items-center gap-1" :id="'active-pot-info-wrapper-' + templateSuffix">
      <!-- Total Pot -->
      <div class="flex items-center gap-2">
        <span
          class="text-xl md:text-2xl font-mono font-black text-white/60
          uppercase tracking-tighter"
        >
          Total
        </span>
        <span class="text-yellow-500/60 font-black text-[10px] tracking-tighter mt-1">$</span>
        <span
          class="text-2xl md:text-3xl font-mono font-black text-white
          drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]
          tracking-tight
          group-hover:scale-105
          transition-transform"
          :id="'total-pot-amount-text-' + templateSuffix"
        >
          {{ amount }}
        </span>
      </div>

      <!-- Side Pots Breakdown (Only if more than 1 pot exists) -->
      <div 
        v-if="sidePots.length > 1" 
        class="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1 border-t border-white/5 pt-1 w-full"
        :id="'side-pots-breakdown-row-' + templateSuffix"
      >
        <div 
          v-for="(p, idx) in sidePots" 
          :key="idx"
          class="flex items-center gap-1"
          :id="'side-pot-item-' + idx + '-' + templateSuffix"
        >
          <span class="text-[9px] font-black uppercase text-yellow-500/40">
            {{ idx === 0 ? 'Main' : 'Side ' + idx }}
          </span>
          <span class="text-[11px] font-mono font-bold text-white/70">
            ${{ p.amount }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onUnmounted, watch } from 'vue'
import { usePokerStore } from '../store/pokerStore'
import { useResponsiveStore } from '../store/responsiveStore'

const props = defineProps({
  amount: {
    type: [Number, String],
    default: 0,
  },
})

const store = usePokerStore()
const responsive = useResponsiveStore()

const lobbyTimer = computed(() => store.getLobbyTimer)
const sidePots = computed(() => store.sidePots || [])
const templateSuffix = computed(() => responsive.getTemplateSuffix)

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

watch(() => lobbyTimer.value?.timestamp, () => {
  if (lobbyTimer.value) {
    startCountdown()
  } else {
    stopCountdown()
  }
}, { immediate: true })

onUnmounted(() => {
  stopCountdown()
})
</script>
