<template>
  <div
    id="main-game-layout-TemplateXSmall"
    class="flex-grow flex flex-col overflow-hidden relative"
  >
    <WinnerTournamentOverlay
      v-if="winnerInfo?.isTournamentWinner"
      :winnerInfo="winnerInfo"
      @close="$emit('sendMessage', { action: 'nextRound' })"
    />
    <WinnerOverlay
      v-else-if="winnerInfo"
      :winnerInfo="winnerInfo"
      @close="$emit('sendMessage', { action: 'nextRound' })"
    />

    <!-- TOP AREA -->
    <div
      id="primary-game-view-TemplateXSmall"
      class="flex flex-col min-w-0 relative flex-none"
    >
      <main
        id="poker-table-viewport-TemplateXSmall"
        class="flex-none h-auto overflow-hidden bg-[radial-gradient(circle_at_center,_#1a2e1a_0%,_#0a0a0a_100%)]"
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

    <!-- ACTION BAR (now middle) -->
    <div id="actionbar-wrapper-TemplateXSmall" class="shrink-0 z-50">
      <ActionBar
        :isMyTurn="isMyTurn"
        :canBlind="canBlind" :blindInfo="blindInfo"
        :options="options"
        :balance="myPlayer?.chips || 0"
        :currentBet="myPlayer?.currentBet || 0"
        :betAmount="betAmount"
        :minBet="minBet"
        :maxBet="maxBet"
        :playerCards="myPlayer?.cards || []"
        @action="(a) => $emit('action', a)"
        @setQuickBet="(m) => $emit('setQuickBet', m)"
        @update:betAmount="(val) => $emit('update:betAmount', val)"
      />
    </div>

    <!-- PLAYER SIDEPANEL & TERMINAL (now footer) -->
    <footer
      id="game-sidepanel-container-TemplateXSmall"
      class="flex-1 min-h-0 z-50 flex flex-col"
    >
      <PlayerSidepanel
        :players="allPlayers"
        :activePlayerId="activePlayerId"
        :myPlayerId="myPlayerId"
        :pot="pot"
        :logs="logs"
        :invertLayout="true"
      />
      <div
        id="game-message-terminal-wrapper-TemplateXSmall"
        class="h-[150px] border-t border-white/5 bg-black/20 shrink-0"
      >
        <MessageTerminal :logs="logs" />
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
  pot: Number,
  communityCards: Array,
  activePlayerId: String,
  myPlayerId: String,
  logs: Array,
  winnerInfo: Object,
})

defineEmits(['action', 'setQuickBet', 'update:betAmount', 'sendMessage'])
</script>
