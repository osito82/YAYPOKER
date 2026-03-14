<template>
  <div
    v-if="isMyTurn && (options.includes('bet') || options.includes('raise'))"
    class="flex items-center gap-3 bg-black/40 p-1.5 rounded-lg border border-yellow-500/20 h-8 lg:h-10"
    :class="{ 'opacity-40 grayscale pointer-events-none': isSliderDisabled }"
  >
    <input
      type="range"
      v-model.number="betProxy"
      :min="minBet"
      :max="maxBet"
      :disabled="isSliderDisabled"
      class="flex-1 h-1 accent-yellow-500 bg-gray-800 rounded-full appearance-none cursor-pointer"
    />
    <span
      class="text-xs font-mono font-black text-yellow-500 min-w-[50px] text-right"
      >${{ betAmount }}</span
    >
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
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #eab308;
  border-radius: 50%;
  cursor: pointer;
}
</style>
