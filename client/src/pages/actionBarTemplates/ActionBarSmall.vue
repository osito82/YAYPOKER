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
      class="relative w-full pointer-events-auto bg-black/95 backdrop-blur-3xl border-t border-white/10 p-2 lg:p-4"
      :class="{
        'border-yellow-500/40 shadow-[0_-15px_40px_rgba(0,0,0,0.8)]': isMyTurn,
      }"
    >
      <div
        :id="'hud-content-layout-wrapper-' + templateSuffix"
        class="max-w-[1600px] mx-auto flex gap-3 lg:gap-8 flex-row items-end"
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
            :canBlind="canBlind" :blindInfo="blindInfo"
            :options="options"
            :isRaiseActionDisabled="isRaiseActionDisabled"
            @action="(a) => $emit('action', a)"
          />

          <QuickChipsRow
            :showChips="showChips"
            :templateSuffix="templateSuffix"
            :chips="chips"
            :chipResponsiveSize="chipResponsiveSize"
            :isMyTurn="isMyTurn"
            :isSliderDisabled="isSliderDisabled"
            @addChip="addChip"
            @clearBet="clearBet"
          />
        </div>
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
