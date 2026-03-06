<template>
  <div
    id="odds-display-container"
    class="w-full max-w-md mx-auto flex flex-col bg-white/5 backdrop-blur-md rounded-lg border border-white/10 shadow-lg transition-all hover:bg-white/10"
  >
    <div
      id="odds-values-wrapper"
      class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 sm:gap-6"
    >
      <!-- WIN GROUP -->
      <div
        id="odds-win-group"
        class="flex flex-col items-center flex-1 min-w-[80px] px-2 py-1 rounded-md bg-black/20 border border-white/5"
      >
        <span
          class="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1"
        >
          Win
        </span>
        <div class="flex items-baseline gap-0.5 leading-none">
          <span
            :class="[
              'font-mono font-black tracking-tighter',
              'text-2xl sm:text-3xl',
              winColor,
            ]"
          >
            {{ Math.round(winProb) }}
          </span>
          <span class="text-[10px] sm:text-xs font-bold text-gray-500/60">
            %
          </span>
        </div>
      </div>

      <!-- TIE GROUP -->
      <div
        id="odds-tie-group"
        class="flex flex-col items-center flex-1 min-w-[70px]"
      >
        <span
          class="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1"
        >
          Tie
        </span>
        <div class="flex items-baseline gap-0.5 leading-none">
          <span
            class="text-lg sm:text-xl font-mono font-black text-blue-400 tracking-tighter"
          >
            {{ Math.round(tieProb) }}
          </span>
          <span class="text-[9px] sm:text-[10px] font-bold text-gray-500/60">
            %
          </span>
        </div>
      </div>

      <!-- HAND EVALUATION -->
      <div
        id="odds-hand-eval-section"
        class="flex flex-col items-center flex-1 min-w-[100px]"
      >
        <span
          class="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1"
        >
          Hand
        </span>

        <span
          class="text-[10px] sm:text-xs lg:text-sm font-black text-yellow-500 uppercase italic leading-none truncate max-w-[110px]"
        >
          {{ handName || 'Waiting...' }}
        </span>

        <div class="flex gap-1 mt-2">
          <div
            v-for="i in 10"
            :key="i"
            class="w-2 h-0.5 rounded-full"
            :class="
              i <= 11 - (handRank || 11) ? 'bg-yellow-500' : 'bg-white/10'
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  winProb: { type: Number, default: 0 },
  tieProb: { type: Number, default: 0 },
  handName: { type: String, default: '' },
  handRank: { type: Number, default: 0 },
})

const winColor = computed(() => {
  if (props.winProb >= 70) return 'text-green-400'
  if (props.winProb >= 40) return 'text-yellow-400'
  if (props.winProb >= 20) return 'text-orange-400'
  return 'text-red-400'
})
</script>
