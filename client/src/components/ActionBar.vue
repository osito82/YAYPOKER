<template>
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
    :playerCards="playerCards"
    @action="(a) => $emit('action', a)"
    @update:betAmount="(val) => $emit('update:betAmount', val)"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'

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
  playerCards: { type: Array, default: () => [] },
})

defineEmits(['action', 'update:betAmount'])

const responsive = useResponsiveStore()

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
