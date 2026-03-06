<template>
  <div
    id="game-root"
    class="h-screen w-screen bg-neutral-950 overflow-hidden flex flex-col font-sans text-white select-none"
  >
    <!-- UNIFIED COMPACT HEADER -->
    <header
      id="unified-game-header"
      class="w-full bg-black/80 backdrop-blur-xl border-b border-white/5 px-3 py-1.5 lg:px-6 lg:py-2 flex items-center justify-between z-50 shrink-0"
    >
      <!-- LEFT SECTION: Game Identity & Table Context -->
      <div id="header-left-section" class="flex items-center gap-2 lg:gap-4">
        <!-- Brand Icon -->
        <div
          id="logo-icon-container"
          class="w-7 h-7 bg-yellow-500 rounded flex items-center justify-center shadow-[0_0_10px_rgba(234,179,8,0.3)] shrink-0"
        >
          <span id="logo-letter" class="text-black font-black text-lg">O</span>
        </div>
        
        <div class="h-6 w-px bg-white/10 hidden sm:block"></div>

        <!-- Table Context -->
        <div id="table-metadata" class="flex flex-col justify-center">
          <div class="flex items-center gap-2 leading-none">
            <span
              id="blinds-display"
              class="text-[10px] lg:text-xs font-mono font-bold text-white uppercase tracking-wider"
              >Blinds $10/$20</span
            >
            <span
              id="game-id-display"
              class="hidden md:inline text-[9px] font-mono text-gray-500 border-l border-white/10 pl-2"
              >ID: {{ gameCode }}</span
            >
          </div>
          <h1
            id="game-type-label"
            class="text-[8px] lg:text-[10px] font-black text-yellow-500 uppercase tracking-widest mt-0.5 opacity-80"
          >
            No Limit Hold'em
          </h1>
        </div>
      </div>

      <!-- RIGHT SECTION: Social, Connection & Personal Identity -->
      <div id="header-right-section" class="flex items-center gap-1.5 lg:gap-4">
        <!-- 1. Social Presence (Online Players) -->
        <div
          id="header-players-counter"
          class="hidden sm:flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded border border-white/5"
        >
          <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span class="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-tighter">
            {{ allPlayers.length }} Online
          </span>
        </div>

        <!-- 2. Technical Health (Connection) -->
        <div
          id="status-panel"
          class="bg-black/40 px-2 py-0.5 lg:px-3 lg:py-1 rounded-full border border-white/5 flex items-center gap-1.5 lg:gap-2 shrink-0"
        >
          <div
            id="connection-indicator"
            class="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full shadow-[0_0_8px_currentColor]"
            :class="isConnected ? 'bg-green-500 text-green-500' : 'bg-red-500 text-red-500'"
          ></div>
          <span class="text-[8px] lg:text-[10px] font-bold uppercase tracking-widest text-gray-200">
            {{ isConnected ? 'LIVE' : 'OFFLINE' }}
          </span>
        </div>

        <!-- 3. Personal Identity -->
        <div
          id="player-badge"
          class="bg-yellow-500/10 px-2 py-0.5 lg:px-4 lg:py-1 rounded-full border border-yellow-500/20 max-w-[70px] sm:max-w-none shrink-0"
        >
          <span
            id="player-name-display"
            class="text-[9px] lg:text-[12px] font-black text-yellow-500 uppercase tracking-widest truncate block"
            >{{ playerName }}</span
          >
        </div>

        <!-- 4. System Time -->
        <div id="server-time-container" class="hidden lg:flex flex-col items-end leading-none border-l border-white/10 pl-4">
          <span class="text-[11px] font-mono font-bold text-gray-400">{{ serverTime }}</span>
        </div>
      </div>
    </header>

    <!-- WINNER ANNOUNCEMENT OVERLAY -->
    <WinnerOverlay
      :winnerInfo="pokerStore.getWinnerInfo"
      @close="sendMessage({ action: 'nextRound' })"
    />

    <!-- GAME VIEWPORT & SIDEPANEL CONTAINER -->
    <div
      id="main-layout-container"
      class="flex-grow flex flex-col md:flex-row overflow-hidden relative"
    >
      <!-- TOP AREA: TABLE & HUD -->
      <div
        id="game-primary-area"
        class="flex flex-col min-w-0 relative flex-[3] md:flex-[7] md:h-full"
      >
        <!-- MAIN STAGE (Table only) -->
        <main
          id="viewport-stage"
          class="flex-grow flex flex-col overflow-hidden bg-[radial-gradient(circle_at_center,_#1a2e1a_0%,_#0a0a0a_100%)]"
        >
          <!-- TABLE AREA: Now takes full stage space -->
          <div
            id="table-area"
            class="flex-grow relative min-h-0"
          >
            <PokerTable
              id="component-poker-table"
              class="w-full h-full"
              :pot="pokerStore.getPot"
              :communityCards="pokerStore.getCommunityCards"
              :players="allPlayers"
              :activePlayerId="pokerStore.getActivePlayerId"
            />
          </div>
        </main>

        <!-- PLAYER HUD -->
        <footer id="hud-zone" class="shrink-0 z-50">
          <ActionBar
            id="component-action-bar"
            :isMyTurn="isMyTurn"
            :canBlind="canBlind"
            :options="options"
            :balance="myPlayer?.chips || 0"
            :currentBet="myPlayer?.currentBet || 0"
            v-model:betAmount="betAmount"
            :minBet="minBet"
            :maxBet="maxBet"
            :playerCards="myPlayer?.cards || []"
            @action="sendAction"
            @setQuickBet="setQuickBet"
          />
        </footer>
      </div>

      <!-- SIDEPANEL: PLAYERS & TERMINAL -->
      <PlayerSidepanel
        id="sidepanel-container"
        class="flex-1 min-h-0"
        :players="allPlayers"
        :activePlayerId="pokerStore.getActivePlayerId"
        :myPlayerId="pokerStore.myInfo.id"
        :pot="pokerStore.getPot"
        :logs="[...pokerStore.getDealerLog].reverse()"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePokerStore } from '../store/pokerStore'
import useWebSocket from '../use/useSockets'
import { urlsFactory } from '../vutils'

import PokerTable from '../components/PokerTable.vue'
import ActionBar from '../components/ActionBar.vue'
import WinnerOverlay from '../components/WinnerOverlay.vue'
import PlayerSidepanel from '../components/PlayerSidepanel.vue'
import MessageTerminal from '../components/MessageTerminal.vue'

const route = useRoute()
const pokerStore = usePokerStore()
const gameCode = route.params.gameCode || 'default_Torneo'

const serverTime = ref(new Date().toLocaleTimeString())
let timeInterval = null

// Logic for name/uuid generation
const getSavedName = () => {
  if (route.query.playerName) return route.query.playerName
  const saved = sessionStorage.getItem(`poker_name_${gameCode}`)
  if (saved) return saved
  const newName = `Guest_${Math.floor(Math.random() * 1000)}`
  sessionStorage.setItem(`poker_name_${gameCode}`, newName)
  return newName
}

const playerName = getSavedName()
const secretCode = route.query.secretCode || generateSecretCode()

const connectionOptions = { gameCode, playerName, secretCode }

const urls = urlsFactory()
const { connectSocket, disconnectSocket, sendMessage } = useWebSocket(
  urls.server,
  connectionOptions,
)

// 1. BASIC COMPUTEDS
const isConnected = computed(() => pokerStore.getConnected)
const currentMaxBetOnTable = computed(
  () => pokerStore.getCurrentHighestBet || 0,
)

// 2. PLAYER LOGIC COMPUTEDS
const allPlayers = computed(() => pokerStore.getPlayers || [])
const myPlayer = computed(() =>
  allPlayers.value.find(
    (p) => p.id === pokerStore.myInfo.id || p.name === playerName,
  ),
)
const isMyTurn = computed(
  () => pokerStore.getActivePlayerId === myPlayer.value?.id,
)
const options = computed(() => pokerStore.getBettingOptions || [])
const canBlind = computed(
  () => isMyTurn.value && options.value.includes('blind'),
)

// 3. DYNAMIC BETTING LIMITS
const minBet = computed(() => {
  const baseMin =
    currentMaxBetOnTable.value > 0 ? currentMaxBetOnTable.value + 20 : 20
  return Math.min(baseMin, maxBet.value)
})

const maxBet = computed(() => {
  const stack = myPlayer.value?.chips || 0
  const alreadyBet = myPlayer.value?.currentBet || 0
  return stack + alreadyBet
})

// 4. REACTIVE STATE
const betAmount = ref(minBet.value)

// 5. ACTIONS & WATCHERS
const setQuickBet = (m) => {
  if (m === 'all') betAmount.value = maxBet.value
  else {
    const callAmount = Math.max(
      0,
      currentMaxBetOnTable.value - (myPlayer.value?.currentBet || 0),
    )
    let a = currentMaxBetOnTable.value + (pokerStore.getPot + callAmount) * m
    betAmount.value = Math.min(
      Math.max(minBet.value, Math.round(a)),
      maxBet.value,
    )
  }
}

watch(isMyTurn, (newVal) => {
  if (newVal) {
    betAmount.value = minBet.value
  }
})

watch([minBet, maxBet], ([newMin, newMax]) => {
  if (isMyTurn.value) {
    if (betAmount.value < newMin) betAmount.value = newMin
    if (betAmount.value > newMax) betAmount.value = newMax
  }
})

const generateSecretCode = () => {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}

const sendAction = (action) => {
  if (!isConnected.value) return
  switch (action) {
    case 'check':
      sendMessage({ action: 'setCheck' })
      break
    case 'call':
      sendMessage({ action: 'setCall' })
      break
    case 'fold':
      sendMessage({ action: 'fold' })
      break
    case 'bet':
    case 'raise':
      sendMessage({
        action: action === 'bet' ? 'setBet' : 'setRise',
        [action === 'bet' ? 'chipsToBet' : 'chipsToRiseBet']: betAmount.value,
      })
      break
    case 'blind':
      const isS = pokerStore.getDisplayMsg?.toLowerCase().includes('small')
      sendMessage({ action: 'setBet', chipsToBet: isS ? 10 : 20 })
      break
  }
}

onMounted(() => {
  if (!isConnected.value) connectSocket()
  timeInterval = setInterval(() => {
    serverTime.value = new Date().toLocaleTimeString()
  }, 1000)
})

onBeforeUnmount(() => {
  disconnectSocket()
  if (timeInterval) clearInterval(timeInterval)
})
</script>