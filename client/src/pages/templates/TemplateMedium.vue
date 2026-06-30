<template>
  <div
    id="game-container-TemplateMedium"
    class="h-screen w-screen bg-white dark:bg-neutral-950 overflow-hidden flex flex-col font-sans text-gray-900 dark:text-white select-none transition-colors duration-300"
  >
    <!-- UNIFIED COMPACT HEADER -->
    <header
      id="game-header-bar-TemplateMedium"
      class="w-full bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-4 py-1.5 flex items-center justify-between z-50 shrink-0"
    >
      <!-- LEFT SECTION -->
      <div
        id="header-left-content-TemplateMedium"
        class="flex items-center gap-3"
      >
        <div
          id="logo-icon-wrapper-TemplateMedium"
          class="w-7 h-7 bg-yellow-500 rounded flex items-center justify-center shadow-[0_0_10px_rgba(234,179,8,0.3)] shrink-0 cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
          @click="$emit('goHome')"
        >
          <span
            id="logo-text-icon-TemplateMedium"
            class="text-black font-black text-lg"
            >Y</span
          >
        </div>
        <div
          id="header-divider-TemplateMedium"
          class="h-6 w-px bg-gray-200 dark:bg-white/10"
        ></div>
        <div
          id="game-metadata-info-TemplateMedium"
          class="flex flex-col justify-center"
        >
          <div
            id="blinds-info-wrapper-TemplateMedium"
            class="flex items-center gap-2 leading-none"
          >
            <span
              id="blinds-text-TemplateMedium"
              class="text-[10px] font-mono font-bold text-gray-700 dark:text-white uppercase tracking-wider"
              >{{
                $t('game.blinds_info', {
                  small: pokerStore.smallBlind,
                  big: pokerStore.bigBlind,
                })
              }}</span
            >
            <span
              id="game-id-text-TemplateMedium"
              class="text-[9px] font-mono text-gray-400 border-l border-gray-200 dark:border-white/10 pl-2"
              >{{ $t('game.id_label', { id: gameCode }) }}</span
            >
          </div>
          <h1
            id="game-type-title-TemplateMedium"
            class="text-[9px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mt-0.5 opacity-80"
          >
            {{ $t('game.type_label') }}
          </h1>
        </div>
      </div>

      <!-- RIGHT SECTION -->
      <div
        id="header-right-content-TemplateMedium"
        class="flex items-center gap-3"
      >
        <div
          id="players-online-counter-TemplateMedium"
          class="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded border border-gray-200 dark:border-white/5"
        >
          <div
            id="online-indicator-dot-TemplateMedium"
            class="w-1.5 h-1.5 bg-green-500 dark:bg-green-500 rounded-full animate-pulse"
          ></div>
          <span
            id="online-count-text-TemplateMedium"
            class="text-[9px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter"
            >{{ $t('game.online_count', { count: allPlayers.length }) }}</span
          >
        </div>
        <div
          id="connection-status-panel-TemplateMedium"
          class="bg-gray-100 dark:bg-black/40 px-2 py-0.5 rounded-full border border-gray-200 dark:border-white/5 flex items-center gap-1.5 shrink-0"
        >
          <div
            id="conn-indicator-dot-TemplateMedium"
            class="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]"
            :class="
              isConnected
                ? 'bg-green-500 text-green-500 dark:text-green-500'
                : 'bg-red-500 text-red-500 dark:text-red-500'
            "
          ></div>
          <span
            id="conn-status-text-TemplateMedium"
            class="text-[8px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-200"
            >{{
              isConnected ? $t('game.status_live') : $t('game.status_offline')
            }}</span
          >
        </div>
        <div
          id="current-player-badge-TemplateMedium"
          class="bg-yellow-500/10 px-3 py-0.5 rounded-full border border-yellow-500/20 shrink-0 flex items-center gap-1.5"
        >
          <span
            id="current-player-name-TemplateMedium"
            class="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest"
            >{{ playerName }}</span
          >
          <span
            v-if="isGuest"
            id="spectator-badge-TemplateMedium"
            class="text-[7px] font-black text-gray-500 bg-gray-500/10 px-1 py-0.5 rounded uppercase tracking-widest"
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
      id="main-game-layout-TemplateMedium"
      class="flex-grow flex flex-col overflow-hidden relative"
    >
      <!-- MAIN CONTENT AREA -->
      <div
        id="primary-game-view-TemplateMedium"
        class="flex-grow flex flex-col min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar bg-gray-50 dark:bg-transparent transition-colors duration-300"
      >
        <!-- Table Area -->
        <main
          id="poker-table-viewport-TemplateMedium"
          class="min-h-[400px] flex flex-col overflow-hidden bg-gray-100 dark:bg-transparent dark:bg-[radial-gradient(circle_at_center,_#1a2e1a_0%,_#0a0a0a_100%)]"
        >
          <div
            id="poker-table-container-TemplateMedium"
            class="flex-grow relative min-h-0"
          >
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

        <!-- Terminal Area -->
        <div
          id="game-message-terminal-wrapper-TemplateMedium"
          class="h-[120px] border-t border-gray-200 dark:border-white/5 bg-white/80 dark:bg-black/40 shrink-0"
        >
          <MessageTerminal
            id="terminal-component-TemplateMedium"
            :logs="logs"
          />
        </div>

        <!-- SIDEPANEL -->
        <div
          id="game-sidepanel-container-TemplateMedium"
          class="w-full border-t border-gray-200 dark:border-white/5 bg-white dark:bg-black/20"
        >
          <PlayerSidepanel
            :players="allPlayers"
            :activePlayerId="activePlayerId"
            :myPlayerId="myPlayerId"
            :pot="pot"
            :logs="logs"
          />
        </div>
      </div>
    </div>

    <footer
      id="game-hud-bar-TemplateMedium"
      class="shrink-0 z-50 w-full bg-white dark:bg-neutral-950 border-t border-gray-200 dark:border-transparent"
    >
      <ActionBar
        id="action-bar-component-TemplateMedium"
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
  serverTime: String,
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
