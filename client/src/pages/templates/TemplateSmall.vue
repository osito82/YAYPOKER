<template>
  <div
    id="game-root"
    class="h-screen w-screen bg-neutral-950 overflow-hidden flex flex-col font-sans text-white select-none"
  >
    <!-- UNIFIED COMPACT HEADER -->
    <header
      id="unified-game-header"
      class="w-full bg-black/80 backdrop-blur-xl border-b border-white/5 px-3 py-1 flex items-center justify-between z-50 shrink-0"
    >
      <!-- LEFT SECTION -->
      <div id="header-left-section" class="flex items-center gap-2">
        <div
          id="logo-icon-container"
          class="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center shadow-[0_0_10px_rgba(234,179,8,0.3)] shrink-0"
        >
          <span id="logo-letter" class="text-black font-black text-sm">O</span>
        </div>
        <div id="table-metadata" class="flex flex-col justify-center">
          <span class="text-[9px] font-mono font-bold text-white uppercase tracking-wider leading-none">Blinds $10/$20</span>
          <h1 class="text-[8px] font-black text-yellow-500 uppercase tracking-widest mt-0.5 opacity-80 leading-none">No Limit Hold'em</h1>
        </div>
      </div>

      <!-- RIGHT SECTION -->
      <div id="header-right-section" class="flex items-center gap-2">
        <div id="status-panel" class="bg-black/40 px-2 py-0.5 rounded-full border border-white/5 flex items-center gap-1.5 shrink-0">
          <div class="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" :class="isConnected ? 'bg-green-500 text-green-500' : 'bg-red-500 text-red-500'"></div>
          <span class="text-[8px] font-bold uppercase tracking-widest text-gray-200">{{ isConnected ? 'LIVE' : 'OFF' }}</span>
        </div>
        <div id="player-badge" class="bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 max-w-[70px] shrink-0">
          <span class="text-[9px] font-black text-yellow-500 uppercase tracking-widest truncate block">{{ playerName }}</span>
        </div>
      </div>
    </header>

    <WinnerOverlay :winnerInfo="winnerInfo" @close="$emit('sendMessage', { action: 'nextRound' })" />

    <div id="main-layout-container" class="flex-grow flex flex-col overflow-hidden relative">
      <!-- TOP AREA -->
      <div id="game-primary-area" class="flex flex-col min-w-0 relative flex-[4]">
        <main id="viewport-stage" class="flex-none h-auto overflow-hidden bg-[radial-gradient(circle_at_center,_#1a2e1a_0%,_#0a0a0a_100%)]">
          <div id="table-area" class="flex-none relative min-h-0">
            <PokerTable
              id="component-poker-table"
              class="w-full"
              :pot="pot"
              :communityCards="communityCards"
              :players="allPlayers"
              :activePlayerId="activePlayerId"
            />
          </div>
        </main>
        <footer id="hud-zone" class="shrink-0 z-50">
          <ActionBar
            :isMyTurn="isMyTurn"
            :canBlind="canBlind"
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
        </footer>
      </div>

      <!-- SIDEPANEL -->
      <PlayerSidepanel
        id="sidepanel-container"
        class="flex-1 min-h-0"
        :players="allPlayers"
        :activePlayerId="activePlayerId"
        :myPlayerId="myPlayerId"
        :pot="pot"
        :logs="logs"
      />
    </div>
  </div>
</template>

<script setup>
import PokerTable from '../../components/PokerTable.vue'
import ActionBar from '../../components/ActionBar.vue'
import WinnerOverlay from '../../components/WinnerOverlay.vue'
import PlayerSidepanel from '../../components/PlayerSidepanel.vue'

defineProps({
  gameCode: String,
  playerName: String,
  isConnected: Boolean,
  allPlayers: Array,
  myPlayer: Object,
  isMyTurn: Boolean,
  canBlind: Boolean,
  options: Array,
  betAmount: Number,
  minBet: Number,
  maxBet: Number,
  pot: Number,
  communityCards: Array,
  activePlayerId: String,
  myPlayerId: String,
  logs: Array,
  winnerInfo: Object
})

defineEmits(['action', 'setQuickBet', 'update:betAmount', 'sendMessage'])
</script>
