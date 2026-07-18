<template>
  <div class="relative w-full">
    <!-- Main ActionBar Templates -->
    <component
      :is="activeTemplate"
      :isMyTurn="isMyTurn"
      :canBlind="canBlind"
      :blindInfo="blindInfo"
      :options="options"
      :balance="balance"
      :currentBet="currentBet"
      :betAmount="betAmount"
      :minBet="minBet"
      :maxBet="maxBet"
      :sliderMin="sliderMin"
      :playerCards="playerCards"
      :isSittingOut="isSittingOut"
      @action="(a) => $emit('action', a)"
      @update:betAmount="(val) => $emit('update:betAmount', val)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'
import { usePokerStore } from '../store/pokerStore'

import ActionBarXSmall from '../pages/actionBarTemplates/ActionBarXSmall.vue'
import ActionBarSmall from '../pages/actionBarTemplates/ActionBarSmall.vue'
import ActionBarMedium from '../pages/actionBarTemplates/ActionBarMedium.vue'
import ActionBarLarge from '../pages/actionBarTemplates/ActionBarLarge.vue'

defineProps({
  isMyTurn: Boolean,
  canBlind: Boolean,
  blindInfo: Object,
  options: { type: Array, default: () => [] },
  balance: { type: Number, default: 0 },
  currentBet: { type: Number, default: 0 },
  betAmount: { type: Number, default: 0 },
  minBet: { type: Number, default: 0 },
  maxBet: { type: Number, default: 0 },
  sliderMin: { type: Number, default: 0 },
  playerCards: { type: Array, default: () => [] },
})

defineEmits(['action', 'update:betAmount'])

const responsive = useResponsiveStore()
const pokerStore = usePokerStore()

const isSittingOut = computed(() => {
  const me = pokerStore.getPlayers?.find((p) => p.id === pokerStore.myInfo?.id)
  return me ? !!me.isSittingOut : false
})

const activeTemplate = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall':
      return ActionBarXSmall
    case 'small':
      return ActionBarSmall
    case 'medium':
      return ActionBarMedium
    default:
      return ActionBarLarge
  }
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}
</style>
