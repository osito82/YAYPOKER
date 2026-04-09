<template>
  <div
    id="main-game-layout-TemplateXSmall"
    class="flex-grow flex flex-col overflow-hidden relative bg-white dark:bg-neutral-950 transition-colors duration-300"
  >
    <WinnerTournamentOverlay
      v-if="winnerInfo?.isTournamentWinner"
      id="winner-tournament-overlay-TemplateXSmall"
      :winnerInfo="winnerInfo"
      @close="$emit('sendMessage', { action: 'nextRound' })"
    />
    <WinnerOverlay
      v-else-if="winnerInfo"
      id="winner-standard-overlay-TemplateXSmall"
      :winnerInfo="winnerInfo"
      @close="$emit('sendMessage', { action: 'nextRound' })"
    />

    <!-- TOP AREA -->
    <div
      id="primary-game-view-TemplateXSmall"
      class="flex flex-col min-w-0 relative flex-none"
    >
      <!-- Small Logo/Home Button for Mobile -->
      <div 
        class="absolute top-3 left-3 z-[100] w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
        @click="$emit('goHome')"
      >
        <span class="text-black font-black text-sm italic">Y</span>
      </div>

      <main
        id="poker-table-viewport-TemplateXSmall"
        class="flex-none h-auto overflow-hidden bg-gray-100 dark:bg-transparent dark:bg-[radial-gradient(circle_at_center,_#1a2e1a_0%,_#0a0a0a_100%)]"
      >
        <div
          id="poker-table-container-TemplateXSmall"
          class="flex-none relative min-h-0"
        >
          <PokerTable
            id="poker-table-component-TemplateXSmall"
            class="w-full"
            :pot="pot"
            :communityCards="communityCards"
            :players="allPlayers"
            :activePlayerId="activePlayerId"
          />
        </div>
      </main>
    </div>

    <!-- ACTION BAR -->
    <div
      id="action-bar-wrapper-TemplateXSmall"
      class="shrink-0 z-50 bg-white dark:bg-neutral-900 border-y border-gray-200 dark:border-transparent"
    >
      <ActionBar
        id="action-bar-component-TemplateXSmall"
        :isMyTurn="isMyTurn"
        :canBlind="canBlind"
        :blindInfo="blindInfo"
        :options="options"
        :balance="myPlayer?.chips || 0"
        :currentBet="myPlayer?.currentBet || 0"
        :betAmount="betAmount"
        :minBet="minBet"
        :maxBet="maxBet"
        :sliderMin="sliderMin"
        :playerCards="myPlayer?.cards || []"
        @action="(a) => $emit('action', a)"
        @setQuickBet="(m) => $emit('setQuickBet', m)"
        @update:betAmount="(val) => $emit('update:betAmount', val)"
      />
    </div>

    <!-- PLAYER SIDEPANEL & TERMINAL -->
    <footer
      id="game-footer-container-TemplateXSmall"
      class="flex-1 min-h-0 z-50 flex flex-col bg-gray-50 dark:bg-transparent"
    >
      <PlayerSidepanel
        id="game-sidepanel-component-TemplateXSmall"
        class="flex-1 min-h-0"
        :players="allPlayers"
        :activePlayerId="activePlayerId"
        :myPlayerId="myPlayerId"
        :pot="pot"
        :logs="logs"
        :invertLayout="true"
      />
      <div
        id="game-message-terminal-wrapper-TemplateXSmall"
        class="h-[150px] border-t border-gray-200 dark:border-white/5 bg-white dark:bg-black/20 shrink-0"
      >
        <MessageTerminal id="terminal-component-TemplateXSmall" :logs="logs" />
      </div>
    </footer>
  </div>
</template>

<script setup>
import PokerTable from '../../components/PokerTable.vue'
import ActionBar from '../../components/ActionBar.vue'
import WinnerOverlay from '../../components/WinnerOverlay.vue'
import WinnerTournamentOverlay from '../../components/WinnerTournamentOverlay.vue'
import PlayerSidepanel from '../../components/PlayerSidepanel.vue'
import MessageTerminal from '../../components/MessageTerminal.vue'
import { usePokerStore } from '../../store/pokerStore'

const pokerStore = usePokerStore()

defineProps({
  gameCode: String,
  playerName: String,
  isConnected: Boolean,
  allPlayers: Array,
  myPlayer: Object,
  isMyTurn: Boolean,
  canBlind: Boolean,
  blindInfo: Object,
  options: Array,
  betAmount: Number,
  minBet: Number,
  maxBet: Number,
  sliderMin: Number,
  pot: Number,
  communityCards: Array,
  activePlayerId: String,
  myPlayerId: String,
  logs: Array,
  winnerInfo: Object,
})

defineEmits(['action', 'setQuickBet', 'update:betAmount', 'sendMessage', 'goHome'])
</script>
