<template>
  <div
    :id="'hud-player-info-column-' + templateSuffix"
    class="flex flex-col gap-2 shrink-0"
    :class="[screenSize === 'small' ? 'w-[280px]' : '']"
  >
    <!-- Odds Panel -->
    <div
      :id="'hud-hand-odds-display-panel-' + templateSuffix"
      class="w-full transition-all duration-500"
      :class="{
        'opacity-20 grayscale pointer-events-none': !playerCards?.length,
      }"
    >
      <OddsDisplay
        :id="`hud-odds-display-component-${templateSuffix}`"
        :winProb="pokerStore.getOdds.win"
        :tieProb="pokerStore.getOdds.tie"
        :handName="pokerStore.getCurrentHand?.pokerHand"
        :handRank="pokerStore.getCurrentHand?.prizeRank"
      />
    </div>

    <!-- Cards & Finance Row -->
    <div
      :id="'hud-player-cards-finance-section-' + templateSuffix"
      class="flex items-center gap-2 justify-between"
    >
      <!-- Cards -->
      <div
        :id="'hud-player-hand-cards-wrapper-' + templateSuffix"
        class="flex gap-1 items-end bg-white/5 p-1 rounded-lg border border-white/5"
      >
        <template v-if="playerCards?.length">
          <Card
            v-for="(card, i) in playerCards"
            :id="`hud-player-hand-card-${i}-${templateSuffix}`"
            :key="'player-card-' + i"
            :size="'small'"
            :percentage="screenSize === 'xsmall' ? 40 : 45"
            :numSymbol="card"
            class="shadow-lg"
          />
        </template>
        <template v-else>
          <CardBack
            :id="`hud-player-hand-card-back-1-${templateSuffix}`"
            :size="'small'"
            :percentage="screenSize === 'xsmall' ? 40 : 45"
            class="opacity-10"
          />
          <CardBack
            :id="`hud-player-hand-card-back-2-${templateSuffix}`"
            :size="'small'"
            :percentage="screenSize === 'xsmall' ? 40 : 45"
            class="opacity-10"
          />
        </template>
      </div>

      <!-- Finance -->
      <div
        :id="`hud-player-finance-stats-wrapper-${templateSuffix}`"
        class="flex flex-1 items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/10 justify-around"
      >
        <div :id="`hud-player-stack-info-box-${templateSuffix}`" class="text-center">
          <span
            :id="`hud-player-stack-label-${templateSuffix}`"
            class="block text-[7px] font-black text-gray-500 uppercase leading-none mb-0.5"
            >Stack</span
          >
          <span
            :id="`hud-player-stack-value-text-${templateSuffix}`"
            class="text-xs lg:text-lg font-mono font-black text-white leading-none"
            >${{ balance }}</span
          >
        </div>
        <div :id="`hud-player-finance-divider-${templateSuffix}`" class="w-px h-3 bg-white/10"></div>
        <div :id="`hud-player-bet-info-box-${templateSuffix}`" class="text-center">
          <span
            :id="`hud-player-bet-label-${templateSuffix}`"
            class="block text-[7px] font-black text-emerald-500 uppercase leading-none mb-0.5"
            >Bet</span
          >
          <span
            :id="`hud-player-bet-value-text-${templateSuffix}`"
            class="text-xs lg:text-lg font-mono font-black text-white leading-none"
            >${{ currentBet }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Card from '../Card.vue'
import CardBack from '../CardBack.vue'
import OddsDisplay from '../OddsDisplay.vue'
import { usePokerStore } from '../../store/pokerStore'

defineProps({
  templateSuffix: String,
  screenSize: String,
  playerCards: Array,
  balance: Number,
  currentBet: Number,
})

const pokerStore = usePokerStore()
</script>
