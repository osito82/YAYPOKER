<template>
  <div
    v-if="isMyTurn && (options.includes('bet') || options.includes('raise'))"
    :id="`hud-betting-slider-container-${templateSuffix}`"
    class="flex items-center gap-3 p-1.5 rounded-xl h-9 lg:h-11 betting-slider-wrap"
    :class="{ 'opacity-40 grayscale pointer-events-none': isSliderDisabled }"
  >
    <input
      :id="`hud-betting-slider-input-${templateSuffix}`"
      type="range"
      v-model.number="betProxy"
      :min="minBet"
      :max="maxBet"
      :disabled="isSliderDisabled"
      class="slider-input flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
    />
    <div :id="`hud-bet-amount-display-box-${templateSuffix}`" class="bet-amount-display">
      <span :id="`hud-bet-label-${templateSuffix}`" class="text-[9px] font-black text-yellow-500/60 uppercase leading-none">Bet</span>
      <span :id="`hud-bet-value-text-${templateSuffix}`" class="text-sm font-mono font-black text-yellow-400 leading-none">${{ betAmount }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isMyTurn: Boolean,
  options: Array,
  betAmount: Number,
  minBet: Number,
  maxBet: Number,
  isSliderDisabled: Boolean,
  templateSuffix: String,
})

const emit = defineEmits(['update:betAmount'])

const betProxy = computed({
  get: () => props.betAmount,
  set: (val) => emit('update:betAmount', val),
})
</script>

<style scoped>
.betting-slider-wrap {
  background: rgba(0,0,0,0.5);
  border: 1px solid rgba(234, 179, 8, 0.15);
}

.slider-input {
  background: rgba(255,255,255,0.06);
  accent-color: #eab308;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: radial-gradient(circle at 35% 35%, #f5c842 0%, #eab308 60%, #a07810 100%);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid rgba(255,220,80,0.4);
  box-shadow: 0 0 8px rgba(234, 179, 8, 0.4), 0 2px 4px rgba(0,0,0,0.4);
}

.slider-input::-webkit-slider-track {
  height: 6px;
  border-radius: 3px;
  background: rgba(255,255,255,0.06);
}

.bet-amount-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  min-width: 56px;
  padding: 4px 8px;
  background: rgba(234, 179, 8, 0.08);
  border: 1px solid rgba(234, 179, 8, 0.15);
  border-radius: 8px;
}
</style>
