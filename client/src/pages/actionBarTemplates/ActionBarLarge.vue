<template>
  <div
    :id="'poker-action-hud-root-container-' + templateSuffix"
    class="w-full z-50 shrink-0"
  >
    <TurnTimer
      :isMyTurn="isMyTurn"
      :progress="progress"
      :templateSuffix="templateSuffix"
    />

    <div
      :id="'hud-main-actions-container-' + templateSuffix"
      class="relative w-full pointer-events-auto backdrop-blur-3xl p-2 lg:p-4 hud-container"
      :class="{ 'hud-container--active': isMyTurn }"
    >
      <div
        :id="'hud-content-layout-wrapper-' + templateSuffix"
        class="max-w-[1600px] mx-auto flex gap-4 lg:gap-10 flex-row items-end"
      >
        <PlayerInfoPanel
          :templateSuffix="templateSuffix"
          :screenSize="responsive.screenSize"
          :playerCards="playerCards"
          :balance="balance"
          :currentBet="currentBet"
        />

        <div
          :id="'hud-player-actions-control-area-' + templateSuffix"
          class="flex flex-col gap-2 flex-1 min-w-0"
        >
          <BettingSlider
            :isMyTurn="isMyTurn"
            :options="options"
            :betAmount="betAmount"
            :minBet="minBet"
            :maxBet="maxBet"
            :sliderMin="sliderMin"
            :isSliderDisabled="isSliderDisabled"
            :templateSuffix="templateSuffix"
            @update:betAmount="(val) => $emit('update:betAmount', val)"
          />

          <WaitingState
            :isMyTurn="isMyTurn"
            :activePlayerName="activePlayerName"
          />

          <ActionButtonsRow
            :isMyTurn="isMyTurn"
            :canBlind="canBlind"
            :blindInfo="blindInfo"
            :options="options"
            :isRaiseActionDisabled="isRaiseActionDisabled"
            @action="(a) => $emit('action', a)"
          />
        </div>

        <QuickChipsRow
          :showChips="showChips"
          :templateSuffix="templateSuffix"
          :chips="chips"
          :chipResponsiveSize="chipResponsiveSize"
          :isMyTurn="isMyTurn"
          :isSliderDisabled="isSliderDisabled"
          :isVertical="true"
          :betAmount="betAmount"
          :maxBet="maxBet"
          @addChip="addChip"
          @clearBet="clearBet"
          @allIn="$emit('update:betAmount', maxBet)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import TurnTimer from '../../components/actionBar/TurnTimer.vue'
import PlayerInfoPanel from '../../components/actionBar/PlayerInfoPanel.vue'
import ActionButtonsRow from '../../components/actionBar/ActionButtonsRow.vue'
import BettingSlider from '../../components/actionBar/BettingSlider.vue'
import QuickChipsRow from '../../components/actionBar/QuickChipsRow.vue'
import WaitingState from '../../components/actionBar/WaitingState.vue'
import { useActionBar } from '../../components/actionBar/useActionBar'

const props = defineProps({
  isMyTurn: Boolean,
  canBlind: Boolean,
  blindInfo: Object,
  options: Array,
  balance: Number,
  currentBet: Number,
  betAmount: Number,
  minBet: Number,
  maxBet: Number,
  sliderMin: Number,
  playerCards: Array,
})

const emit = defineEmits(['action', 'update:betAmount'])

const {
  progress,
  chips,
  addChip,
  clearBet,
  showChips,
  chipResponsiveSize,
  templateSuffix,
  isSliderDisabled,
  isRaiseActionDisabled,
  activePlayerName,
  responsive,
} = useActionBar(props, emit)
</script>

<style scoped>
.hud-container {
  background: linear-gradient(
    180deg,
    rgba(8, 8, 8, 0.97) 0%,
    rgba(5, 5, 5, 0.99) 100%
  );
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow:
    0 -4px 30px rgba(0, 0, 0, 0.7),
    0 -1px 0 rgba(255, 255, 255, 0.03);
}

.hud-container--active {
  border-top-color: rgba(212, 160, 23, 0.35);
  box-shadow:
    0 -4px 40px rgba(0, 0, 0, 0.8),
    0 -8px 30px rgba(212, 160, 23, 0.08);
}
</style>
