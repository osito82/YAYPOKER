<template>
  <div
    id="game-container-TemplateSmall"
    class="h-screen w-screen bg-white dark:bg-neutral-950 overflow-hidden flex flex-col font-sans text-gray-900 dark:text-white select-none transition-colors duration-300"
  >
    <!-- UNIFIED COMPACT HEADER -->
    <header
      id="game-header-bar-TemplateSmall"
      class="w-full bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-3 py-1 flex items-center justify-between z-50 shrink-0"
    >
      <!-- LEFT SECTION -->
      <div
        id="header-left-content-TemplateSmall"
        class="flex items-center gap-2"
      >
        <div
          id="logo-icon-wrapper-TemplateSmall"
          class="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center shadow-[0_0_10px_rgba(234,179,8,0.3)] shrink-0 cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
          @click="$emit('goHome')"
        >
          <span
            id="logo-text-icon-TemplateSmall"
            class="text-black font-black text-sm"
            >Y</span
          >
        </div>
        <div
          id="game-metadata-info-TemplateSmall"
          class="flex flex-col justify-center"
        >
          <span
            class="text-[9px] font-mono font-bold text-gray-700 dark:text-white uppercase tracking-wider leading-none"
            >{{
              $t('game.blinds_info', {
                small: pokerStore.smallBlind,
                big: pokerStore.bigBlind,
              })
            }}</span
          >
          <h1
            class="text-[8px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mt-0.5 opacity-80 leading-none"
          >
            {{ $t('game.type_label') }}
          </h1>
        </div>
      </div>

      <!-- RIGHT SECTION -->
      <div
        id="header-right-content-TemplateSmall"
        class="flex items-center gap-2"
      >
        <div
          id="connection-status-panel-TemplateSmall"
          class="bg-gray-100 dark:bg-black/40 px-2 py-0.5 rounded-full border border-gray-200 dark:border-white/5 flex items-center gap-1.5 shrink-0"
        >
          <div
            class="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]"
            :class="
              isConnected
                ? 'bg-green-500 text-green-500'
                : 'bg-red-500 text-red-500'
            "
          ></div>
          <span
            class="text-[8px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-200"
            >{{
              isConnected ? $t('game.status_live') : $t('game.status_offline')
            }}</span
          >
        </div>
        <div
          id="current-player-badge-TemplateSmall"
          class="bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 max-w-[90px] shrink-0 flex items-center gap-1"
        >
          <span
            class="text-[9px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest truncate block"
            >{{ playerName }}</span
          >
          <span
            v-if="isGuest"
            id="spectator-badge-TemplateSmall"
            class="text-[6px] font-black text-gray-500 bg-gray-500/10 px-1 py-0.5 rounded uppercase tracking-widest shrink-0"
          >SPECTATOR</span>
        </div>
      </div>
    </header>

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

    <div
      id="main-game-layout-TemplateSmall"
      class="flex-grow flex flex-col overflow-hidden relative"
    >
      <!-- TOP AREA -->
      <div
        id="primary-game-view-TemplateSmall"
        class="flex flex-col min-w-0 relative flex-[4]"
      >
        <main
          id="poker-table-viewport-TemplateSmall"
          class="flex-none h-auto overflow-hidden bg-gray-100 dark:bg-transparent dark:bg-[radial-gradient(circle_at_center,_#1a2e1a_0%,_#0a0a0a_100%)]"
        >
          <div
            id="poker-table-container-TemplateSmall"
            class="flex-none relative min-h-0"
          >
            <PokerTable
              id="poker-table-component-TemplateSmall"
              class="w-full"
              :pot="pot"
              :communityCards="communityCards"
              :players="allPlayers"
              :activePlayerId="activePlayerId"
            />
          </div>
        </main>
        <footer
          id="game-hud-bar-TemplateSmall"
          class="shrink-0 z-50 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-transparent"
        >
          <ActionBar
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
        </footer>
      </div>

      <!-- SIDEPANEL & TERMINAL -->
      <div
        id="game-sidepanel-terminal-container-TemplateSmall"
        class="flex-1 min-h-0 flex flex-col bg-gray-50 dark:bg-black/40 backdrop-blur-3xl border-t border-gray-200 dark:border-white/5 transition-colors duration-300"
      >
        <PlayerSidepanel
          id="game-sidepanel-component-TemplateSmall"
          class="flex-1 min-h-0"
          :players="allPlayers"
          :activePlayerId="activePlayerId"
          :myPlayerId="myPlayerId"
          :pot="pot"
          :logs="logs"
        />
        <div
          id="game-message-terminal-wrapper-TemplateSmall"
          class="h-[180px] border-t border-gray-200 dark:border-white/5 bg-white dark:bg-black/20 shrink-0"
        >
          <MessageTerminal :logs="logs" />
        </div>
      </div>
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
  isGuest: Boolean,
})

defineEmits(['action', 'setQuickBet', 'update:betAmount', 'sendMessage', 'goHome'])
</script>
