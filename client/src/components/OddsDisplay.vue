<template>
  <div
    id="odds-display-badge"
    class="flex flex-col items-center bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 transition-all hover:bg-white/10"
  >
    <div id="odds-values-flex" class="flex items-center gap-3">
      <!-- Win Odds & Hand Evaluation -->
      <div id="win-group" class="flex flex-col items-center">
        <div id="win-value-wrapper" class="flex items-baseline gap-0.5 leading-none">
          <span
            id="display-win-percent"
            :class="['text-xl font-mono font-black tracking-tighter', winColor]"
          >{{ Math.round(winProb) }}</span>
          <span id="win-symbol" class="text-[8px] font-bold text-gray-500">%</span>
        </div>
        
        <!-- Integrated Hand Evaluation -->
        <div
          v-if="handName"
          id="hand-evaluation-mini"
          class="flex flex-col items-center mt-0.5"
        >
          <span id="display-hand-name" class="text-[9px] font-bold text-yellow-500 uppercase italic leading-none truncate max-w-[65px]">{{ handName }}</span>
          <div id="hand-rank-dots" class="flex gap-0.5 mt-0.5">
            <div
              v-for="i in 10"
              :key="i"
              class="w-1 h-0.5 rounded-full"
              :class="i <= (11 - handRank) ? 'bg-yellow-500' : 'bg-white/10'"
            ></div>
          </div>
        </div>
      </div>

      <!-- Tie (Optional) -->
      <template v-if="tieProb > 0">
        <div id="odds-divider" class="w-px h-6 bg-white/10"></div>
        <div id="tie-odds-container" class="flex flex-col items-center">
          <div id="tie-value-wrapper" class="flex items-baseline gap-0.5 leading-none">
            <span
              id="display-tie-percent"
              class="text-lg font-mono font-black text-blue-400 tracking-tighter"
            >{{ Math.round(tieProb) }}</span>
            <span id="tie-symbol" class="text-[8px] font-bold text-gray-500">%</span>
          </div>
          <span id="tie-text" class="text-[7px] font-black text-gray-400 uppercase">Tie</span>
        </div>
      </template>
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
