<template>
  <div
    v-if="showChips"
    :id="'hud-quick-chips-row-' + templateSuffix"
    :class="[
      'flex mt-1 transition-all duration-300',
      isVertical
        ? 'flex-col gap-3 min-w-[120px] lg:min-w-[160px]'
        : 'flex-row items-center gap-2',
    ]"
  >
    <div
      :class="[
        'flex gap-2 lg:gap-3',
        isVertical
          ? 'flex-wrap justify-center'
          : 'flex-1 overflow-x-auto no-scrollbar py-1',
      ]"
    >
      <Chip
        v-for="chip in chips"
        :key="chip.value"
        :value="chip.label"
        :color="chip.color"
        :textColor="chip.text"
        :border="chip.border"
        :size="chipResponsiveSize"
        :disabled="!isMyTurn || isSliderDisabled"
        @click="addChip(chip.value)"
      />
    </div>
    <button
      @click="clearBet"
      :disabled="!isMyTurn || isSliderDisabled"
      :id="'hud-clear-bet-button-' + templateSuffix"
      :class="[
        'bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase rounded-lg hover:bg-white/10 active:scale-95 transition-all disabled:opacity-20 disabled:pointer-events-none',
        isVertical ? 'w-full py-2' : 'h-8 lg:h-11 px-3',
      ]"
    >
      Clear
    </button>
  </div>
</template>

<script setup>
import Chip from '../Chip.vue'

defineProps({
  showChips: Boolean,
  templateSuffix: String,
  chips: Array,
  chipResponsiveSize: String,
  isMyTurn: Boolean,
  isSliderDisabled: Boolean,
  isVertical: Boolean,
})

const emit = defineEmits(['addChip', 'clearBet'])

const addChip = (value) => emit('addChip', value)
const clearBet = () => emit('clearBet')
</script>
