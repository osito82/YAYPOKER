<template>
  <div 
    v-if="showChips"
    :id="'hud-quick-chips-row-' + templateSuffix"
    class="flex items-center gap-2 mt-1"
  >
    <div class="flex flex-1 gap-3 overflow-x-auto no-scrollbar py-1">
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
      class="h-8 lg:h-11 px-3 bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase rounded-lg hover:bg-white/10 active:scale-95 transition-all disabled:opacity-20 disabled:pointer-events-none"
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
  isSliderDisabled: Boolean
})

const emit = defineEmits(['addChip', 'clearBet'])

const addChip = (value) => emit('addChip', value)
const clearBet = () => emit('clearBet')
</script>
