<template>
  <div
    id="game-container-TemplateMedium"
    class="h-screen w-screen bg-neutral-950 overflow-hidden flex flex-col font-sans text-white select-none"
  >
    <!-- UNIFIED COMPACT HEADER -->
    <header
      id="game-header-bar-TemplateMedium"
      class="w-full bg-black/80 backdrop-blur-xl border-b border-white/5 px-4 py-1.5 flex items-center justify-between z-50 shrink-0"
    >
      <!-- LEFT SECTION -->
      <div id="header-left-content-TemplateMedium" class="flex items-center gap-3">
        <div
          id="logo-icon-wrapper-TemplateMedium"
          class="w-7 h-7 bg-yellow-500 rounded flex items-center justify-center shadow-[0_0_10px_rgba(234,179,8,0.3)] shrink-0"
        >
          <span id="logo-text-icon-TemplateMedium" class="text-black font-black text-lg">O</span>
        </div>
        <div class="h-6 w-px bg-white/10"></div>
        <div id="game-metadata-info-TemplateMedium" class="flex flex-col justify-center">
          <div class="flex items-center gap-2 leading-none">
            <span class="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Blinds $10/$20</span>
            <span class="text-[9px] font-mono text-gray-500 border-l border-white/10 pl-2">ID: {{ gameCode }}</span>
          </div>
          <h1 class="text-[9px] font-black text-yellow-500 uppercase tracking-widest mt-0.5 opacity-80">No Limit Hold'em</h1>
        </div>
      </div>

      <!-- RIGHT SECTION -->
      <div id="header-right-content-TemplateMedium" class="flex items-center gap-3">
        <div id="players-online-counter-TemplateMedium" class="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded border border-white/5">
          <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span class="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-tighter">{{ allPlayers.length }} Online</span>
        </div>
        <div id="connection-status-panel-TemplateMedium" class="bg-black/40 px-2 py-0.5 rounded-full border border-white/5 flex items-center gap-1.5 shrink-0">
          <div class="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" :class="isConnected ? 'bg-green-500 text-green-500' : 'bg-red-500 text-red-500'"></div>
          <span class="text-[9px] font-bold uppercase tracking-widest text-gray-200">{{ isConnected ? 'LIVE' : 'OFFLINE' }}</span>
        </div>
        <div id="current-player-badge-TemplateMedium" class="bg-yellow-500/10 px-3 py-0.5 rounded-full border border-yellow-500/20 shrink-0">
          <span class="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{{ playerName }}</span>
        </div>
      </div>
    </header>

    <WinnerTournamentOverlay v-if="winnerInfo?.isTournamentWinner" :winnerInfo="winnerInfo" @close="$emit('sendMessage', { action: 'nextRound' })" />
    <WinnerOverlay v-else-if="winnerInfo" :winnerInfo="winnerInfo" @close="$emit('sendMessage', { action: 'nextRound' })" />

    <div id="main-game-layout-TemplateMedium" class="flex-grow flex flex-col md:flex-row overflow-hidden relative">
      <!-- TOP AREA -->
      <div id="primary-game-view-TemplateMedium" class="flex flex-col min-w-0 relative flex-[7] h-full">
        <main id="poker-table-viewport-TemplateMedium" class="flex-grow flex flex-col overflow-hidden bg-[radial-gradient(circle_at_center,_#1a2e1a_0%,_#0a0a0a_100%)]">
          <div id="poker-table-container-TemplateMedium" class="flex-grow relative min-h-0">
            <PokerTable
              id="poker-table-component-TemplateMedium"
              class="w-full h-full"
              :pot="pot"
              :communityCards="communityCards"
              :players="allPlayers"
              :activePlayerId="activePlayerId"
            />
          </div>
        </main>
        
        <!-- Terminal Area (Bottom of table) -->
        <div id="game-message-terminal-wrapper-TemplateMedium" class="h-[120px] border-t border-white/5 bg-black/40 shrink-0">
          <MessageTerminal :logs="logs" />
        </div>

        <footer id="game-hud-bar-TemplateMedium" class="shrink-0 z-50">
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
        id="game-sidepanel-container-TemplateMedium"
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
import WinnerTournamentOverlay from '../../components/WinnerTournamentOverlay.vue'
import PlayerSidepanel from '../../components/PlayerSidepanel.vue'
import MessageTerminal from '../../components/MessageTerminal.vue'

defineProps({
  gameCode: String,
  playerName: String,
  serverTime: String,
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
