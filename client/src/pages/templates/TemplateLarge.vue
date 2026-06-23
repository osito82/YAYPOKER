<template>
  <div
    id="game-container-TemplateLarge"
    class="h-screen w-screen bg-white dark:bg-neutral-950 overflow-hidden flex flex-col font-sans text-gray-900 dark:text-white select-none transition-colors duration-300"
  >
    <!-- UNIFIED COMPACT HEADER -->
    <header
      id="game-header-bar-TemplateLarge"
      class="w-full backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.06] px-6 py-0 flex items-stretch z-50 shrink-0 header-bar transition-colors duration-300"
    >
      <!-- LEFT SECTION -->
      <div
        id="header-left-content-TemplateLarge"
        class="flex items-center gap-4 py-2.5"
      >
        <div
          id="header-logo-wrapper-TemplateLarge"
          class="header-logo-wrap shrink-0 cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
          @click="$emit('goHome')"
        >
          <span
            id="header-logo-text-TemplateLarge"
            class="text-black font-black text-sm"
            >Y</span
          >
        </div>
        <div
          id="header-divider-TemplateLarge"
          class="h-5 w-px bg-gray-300 dark:bg-white/8"
        ></div>
        <div
          id="game-metadata-info-TemplateLarge"
          class="flex flex-col justify-center"
        >
          <div
            id="blinds-info-wrapper-TemplateLarge"
            class="flex items-center gap-2 leading-none"
          >
            <span
              id="blinds-text-TemplateLarge"
              class="text-[11px] font-mono font-bold text-gray-600 dark:text-white/80 uppercase tracking-wider"
            >
              {{
                $t('game.blinds_info', {
                  small: pokerStore.smallBlind,
                  big: pokerStore.bigBlind,
                })
              }}
            </span>
            <span
              id="game-id-text-TemplateLarge"
              class="text-[9px] font-mono text-gray-400 dark:text-white/25 border-l border-gray-300 dark:border-white/10 pl-2"
            >
              {{ $t('game.id_label', { id: gameCode }) }}
            </span>
          </div>
          <h1
            id="game-type-title-TemplateLarge"
            class="text-[9px] font-black text-amber-600 dark:text-amber-500/70 uppercase tracking-widest mt-0.5"
          >
            {{ $t('game.type_label') }}
          </h1>
        </div>
      </div>

      <!-- RIGHT SECTION -->
      <div
        id="header-right-content-TemplateLarge"
        class="flex items-center gap-3 ml-auto py-2.5"
      >
        <div
          id="players-online-pill-TemplateLarge"
          class="flex items-center gap-1.5 px-2 py-1 rounded-md header-pill border border-gray-200 dark:border-white/10"
        >
          <div
            id="online-indicator-dot-TemplateLarge"
            class="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full animate-pulse shadow-[0_0_4px_rgba(74,222,128,0.8)]"
          ></div>
          <span
            id="online-count-text-TemplateLarge"
            class="text-[9px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter"
            >{{ $t('game.online_count', { count: allPlayers.length }) }}</span
          >
        </div>

        <div
          id="connection-status-badge-TemplateLarge"
          class="header-conn-badge px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0 border border-gray-200 dark:border-white/10"
        >
          <div
            id="conn-indicator-dot-TemplateLarge"
            class="w-1.5 h-1.5 rounded-full"
            :class="
              isConnected
                ? 'bg-green-500 dark:bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]'
                : 'bg-red-500'
            "
          ></div>
          <span
            id="conn-status-text-TemplateLarge"
            class="text-[9px] font-bold uppercase tracking-widest"
            :class="
              isConnected
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            "
            >{{
              isConnected ? $t('game.status_live') : $t('game.status_offline')
            }}</span
          >
        </div>

        <div
          id="player-profile-badge-TemplateLarge"
          class="header-player-badge px-4 py-1 rounded-full shrink-0 border border-amber-200 dark:border-amber-500/20 flex items-center gap-2"
        >
          <span
            id="current-player-name-TemplateLarge"
            class="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest"
            >{{ playerName }}</span
          >
          <span
            v-if="isGuest"
            id="spectator-badge-TemplateLarge"
            class="text-[8px] font-black text-gray-500 bg-gray-500/10 px-1.5 py-0.5 rounded uppercase tracking-widest"
          >SPECTATOR</span>
        </div>

        <div
          id="server-time-wrapper-TemplateLarge"
          class="flex flex-col items-end leading-none border-l border-gray-200 dark:border-white/8 pl-3"
        >
          <span
            id="server-time-text-TemplateLarge"
            class="text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400"
            >{{ serverTime }}</span
          >
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
      id="main-game-layout-TemplateLarge"
      class="flex-grow flex flex-row overflow-hidden relative transition-colors duration-300"
    >
      <!-- TOP AREA -->
      <div
        id="primary-game-view-TemplateLarge"
        class="flex flex-col min-w-0 relative flex-[4] h-full"
      >
        <main
          id="poker-table-viewport-TemplateLarge"
          class="flex-grow flex flex-col overflow-hidden bg-gray-100 dark:bg-transparent bg-[radial-gradient(circle_at_center,_#e2e8f0_0%,_#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_center,_#1a2e1a_0%,_#0a0a0a_100%)]"
        >
          <div
            id="poker-table-container-TemplateLarge"
            class="flex-grow relative min-h-0"
          >
            <PokerTable
              id="poker-table-component-TemplateLarge"
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
          id="game-message-terminal-wrapper-TemplateLarge"
          class="h-[150px] border-t border-gray-200 dark:border-white/5 bg-white/80 dark:bg-black/40 shrink-0"
        >
          <MessageTerminal id="terminal-component-TemplateLarge" :logs="logs" />
        </div>
      </div>

      <!-- SIDEPANEL -->
      <PlayerSidepanel
        id="game-sidepanel-container-TemplateLarge"
        class="w-[320px] min-h-0 border-l border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-transparent"
        :players="allPlayers"
        :activePlayerId="activePlayerId"
        :myPlayerId="myPlayerId"
        :pot="pot"
        :logs="logs"
      />
    </div>

    <footer
      id="game-hud-bar-TemplateLarge"
      class="shrink-0 z-50 w-full bg-white dark:bg-neutral-950 border-t border-gray-200 dark:border-transparent transition-colors duration-300"
    >
      <ActionBar
        id="action-bar-component-TemplateLarge"
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

<style scoped>
.header-bar {
  background: white;
}
.dark .header-bar {
  background: linear-gradient(
    180deg,
    rgba(5, 5, 5, 0.97) 0%,
    rgba(10, 10, 10, 0.92) 100%
  );
}

.header-logo-wrap {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #d4a017 0%, #b8860b 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 10px rgba(212, 160, 23, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.header-pill {
  background: rgba(0, 0, 0, 0.03);
}
.dark .header-pill {
  background: rgba(255, 255, 255, 0.04);
}

.header-conn-badge {
  background: rgba(0, 0, 0, 0.05);
}
.dark .header-conn-badge {
  background: rgba(0, 0, 0, 0.5);
}

.header-player-badge {
  background: rgba(212, 160, 23, 0.05);
}
.dark .header-player-badge {
  background: rgba(212, 160, 23, 0.08);
}
</style>
