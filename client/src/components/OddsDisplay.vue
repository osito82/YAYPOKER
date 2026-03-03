<template>
  <div
    id="odds-display-container"
    class="flex flex-col items-center bg-white/5 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 transition-all hover:bg-white/10 shadow-lg"
  >
    <div id="odds-values-wrapper" class="flex items-center gap-6">
      <!-- WIN GROUP -->
      <div id="odds-win-group" class="flex flex-col items-center px-3 py-1 rounded-md bg-black/20 border border-white/5">
        <span id="odds-win-label" class="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Win</span>
        <div id="odds-win-value-display" class="flex items-baseline gap-0.5 leading-none">
          <span
            id="odds-win-percent-text"
            :class="['text-3xl font-mono font-black tracking-tighter', winColor]"
          >{{ Math.round(winProb) }}</span>
          <span id="odds-win-symbol" class="text-xs font-bold text-gray-500/60">%</span>
        </div>
      </div>

      <!-- Main Divider -->
      <div v-if="handName || tieProb > 0" id="odds-vertical-divider-main" class="w-px h-10 bg-white/10"></div>

      <!-- HAND EVALUATION -->
      <div
        v-if="handName"
        id="odds-hand-eval-section"
        class="flex flex-col items-center min-w-[80px]"
      >
        <span id="odds-hand-label" class="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Hand</span>
        <span id="odds-hand-name-text" class="text-xs lg:text-sm font-black text-yellow-500 uppercase italic leading-none truncate max-w-[100px]">{{ handName }}</span>
        <div id="odds-hand-rank-indicator" class="flex gap-1 mt-2">
          <div
            v-for="i in 10"
            :id="'odds-rank-dot-' + i"
            :key="i"
            class="w-2 h-0.5 rounded-full"
            :class="i <= (11 - handRank) ? 'bg-yellow-500' : 'bg-white/10'"
          ></div>
        </div>
      </div>

      <!-- TIE GROUP (Optional) -->
      <template v-if="tieProb > 0">
        <div id="odds-vertical-divider-tie" class="w-px h-8 bg-white/10"></div>
        <div id="odds-tie-group" class="flex flex-col items-center">
          <span id="odds-tie-label" class="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Tie</span>
          <div id="odds-tie-value-display" class="flex items-baseline gap-0.5 leading-none">
            <span
              id="odds-tie-percent-text"
              class="text-xl font-mono font-black text-blue-400 tracking-tighter"
            >{{ Math.round(tieProb) }}</span>
            <span id="odds-tie-symbol" class="text-[10px] font-bold text-gray-500/60">%</span>
          </div>
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
