<template>
  <div
    :id="`odds-panel-container-${templateSuffix}`"
    class="odds-panel w-full flex items-stretch overflow-hidden"
  >
    <!-- WIN -->
    <div
      :id="`odds-win-column-${templateSuffix}`"
      class="flex flex-col items-center justify-center flex-1 px-2 py-1.5 border-r border-white/5"
    >
      <span
        :id="`odds-win-label-${templateSuffix}`"
        class="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-0.5 leading-none"
        >Win</span
      >
      <div
        :id="`odds-win-value-wrapper-${templateSuffix}`"
        class="flex items-baseline gap-0.5 leading-none"
      >
        <span
          :id="`odds-win-percentage-text-${templateSuffix}`"
          :class="[
            'font-mono font-black tracking-tighter leading-none',
            'text-2xl sm:text-3xl',
            winColor,
          ]"
          >{{ Math.round(winProb) }}</span
        >
        <span
          :id="`odds-win-percent-symbol-${templateSuffix}`"
          class="text-[9px] font-bold text-gray-600 leading-none"
          >%</span
        >
      </div>
      <!-- Win probability bar -->
      <div
        :id="`odds-win-progress-track-${templateSuffix}`"
        class="w-full h-0.5 bg-white/5 rounded-full mt-1 overflow-hidden"
      >
        <div
          :id="`odds-win-progress-fill-${templateSuffix}`"
          class="h-full rounded-full transition-all duration-500"
          :class="winBarColor"
          :style="{ width: Math.round(winProb) + '%' }"
        ></div>
      </div>
    </div>

    <!-- TIE -->
    <div
      :id="`odds-tie-column-${templateSuffix}`"
      class="flex flex-col items-center justify-center flex-1 px-2 py-1.5 border-r border-white/5"
    >
      <span
        :id="`odds-tie-label-${templateSuffix}`"
        class="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-0.5 leading-none"
        >Tie</span
      >
      <div
        :id="`odds-tie-value-wrapper-${templateSuffix}`"
        class="flex items-baseline gap-0.5 leading-none"
      >
        <span
          :id="`odds-tie-percentage-text-${templateSuffix}`"
          class="text-lg sm:text-xl font-mono font-black text-blue-400 tracking-tighter leading-none"
          >{{ Math.round(tieProb) }}</span
        >
        <span
          :id="`odds-tie-percent-symbol-${templateSuffix}`"
          class="text-[9px] font-bold text-gray-600 leading-none"
          >%</span
        >
      </div>
      <div
        :id="`odds-tie-progress-track-${templateSuffix}`"
        class="w-full h-0.5 bg-white/5 rounded-full mt-1 overflow-hidden"
      >
        <div
          :id="`odds-tie-progress-fill-${templateSuffix}`"
          class="h-full bg-blue-500 rounded-full transition-all duration-500"
          :style="{ width: Math.round(tieProb) + '%' }"
        ></div>
      </div>
    </div>

    <!-- HAND -->
    <div
      :id="`odds-hand-column-${templateSuffix}`"
      class="flex flex-col items-center justify-center flex-1 px-2 py-1.5"
    >
      <span
        :id="`odds-hand-label-${templateSuffix}`"
        class="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-0.5 leading-none"
        >{{ $t('game.hand') }}</span
      >
      <span
        :id="`odds-hand-name-text-${templateSuffix}`"
        class="text-[9px] sm:text-[10px] font-black text-yellow-500 uppercase italic leading-none truncate max-w-[90px] text-center"
        >{{ handName || $t('game.waiting') }}</span
      >
      <div
        :id="`odds-hand-rank-visual-wrapper-${templateSuffix}`"
        class="flex gap-0.5 mt-1"
      >
        <div
          v-for="i in 10"
          :key="i"
          :id="`odds-hand-rank-dot-${i}-${templateSuffix}`"
          class="w-1.5 h-0.5 rounded-full transition-all duration-300"
          :class="i <= 11 - (handRank || 11) ? 'bg-yellow-500' : 'bg-white/8'"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'

const props = defineProps({
  winProb: { type: Number, default: 0 },
  tieProb: { type: Number, default: 0 },
  handName: { type: String, default: '' },
  handRank: { type: Number, default: 0 },
})

const responsive = useResponsiveStore()
const templateSuffix = computed(() => responsive.templateSuffix)

const winColor = computed(() => {
  if (props.winProb >= 70) return 'text-green-400'
  if (props.winProb >= 40) return 'text-yellow-400'
  if (props.winProb >= 20) return 'text-orange-400'
  return 'text-red-400'
})

const winBarColor = computed(() => {
  if (props.winProb >= 70) return 'bg-green-500'
  if (props.winProb >= 40) return 'bg-yellow-500'
  if (props.winProb >= 20) return 'bg-orange-500'
  return 'bg-red-500'
})
</script>

<style scoped>
.odds-panel {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  backdrop-filter: blur(8px);
}
</style>
