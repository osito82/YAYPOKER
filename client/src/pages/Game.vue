<template>
  <div
    id="game-root"
    class="h-screen w-screen bg-neutral-950 overflow-hidden flex flex-col font-sans text-white select-none"
  >
    <!-- GLOBAL HEADER -->
    <header
      id="id-header"
      class="w-full bg-black/60 backdrop-blur-xl border-b border-white/5 py-2 px-6 flex items-center justify-between z-50 shrink-0"
    >
      <div id="header-logo-section" class="flex items-center gap-3">
        <div id="logo-icon-container" class="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)]">
          <span id="logo-letter" class="text-black font-black text-2xl">O</span>
        </div>
        <span id="logo-text" class="text-2xl font-black tracking-tighter text-white uppercase italic">
          oso<span class="text-yellow-500">POker</span>
        </span>
      </div>
      
      <div id="header-metadata-section" class="hidden md:flex items-center gap-4">
        <div id="server-time-container" class="flex flex-col items-end">
          <span id="label-server-time" class="text-[10px] font-black text-gray-300 uppercase tracking-widest">Server Time</span>
          <span id="display-server-time" class="text-[12px] font-mono font-bold text-gray-100">{{ serverTime }}</span>
        </div>
      </div>
    </header>

    <!-- WINNER ANNOUNCEMENT OVERLAY -->
    <WinnerOverlay :winnerInfo="pokerStore.getWinnerInfo" @close="sendMessage({ action: 'nextRound' })" />

    <!-- GAME VIEWPORT & SIDEPANEL CONTAINER -->
    <div id="main-layout-container" class="flex-grow flex flex-col lg:flex-row overflow-hidden relative">
      
      <!-- TOP AREA: TABLE & HUD -->
      <div id="game-primary-area" class="flex flex-col min-w-0 relative shrink-0 lg:flex-1 lg:h-full">
        
        <!-- TOP METADATA BAR -->
        <nav
          id="top-bar"
          class="w-full bg-neutral-900/40 backdrop-blur-md border-b border-white/5 p-3 px-6 z-40 flex justify-between items-center shrink-0"
        >
          <div id="info-panel" class="flex items-center gap-4">
            <div id="table-metadata" class="flex flex-col">
              <h1 id="game-type-label" class="text-[11px] font-black text-yellow-500 uppercase tracking-[0.2em] leading-none mb-1">
                No Limit Hold'em
              </h1>
              <div id="table-details" class="flex items-center gap-2">
                <span id="blinds-display" class="text-sm font-mono font-bold text-white">Blinds $10/$20</span>
                <span id="game-id-display" class="text-[11px] font-mono text-gray-400">ID: {{ gameCode }}</span>
              </div>
            </div>
          </div>

          <div id="header-status-section" class="flex items-center gap-3">
            <div id="status-panel" class="bg-black/40 px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
              <div id="connection-indicator" class="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" :class="isConnected ? 'bg-green-500 text-green-500' : 'bg-red-500 text-red-500'"></div>
              <span id="connection-text" class="text-[10px] font-bold uppercase tracking-widest text-gray-200">
                {{ isConnected ? 'LIVE' : 'RECONNECTING' }}
              </span>
            </div>
            <div id="player-badge" class="bg-yellow-500/10 px-4 py-1 rounded-full border border-yellow-500/20">
              <span id="player-name-display" class="text-[12px] font-black text-yellow-500 uppercase tracking-widest">{{ playerName }}</span>
            </div>
          </div>
        </nav>

        <!-- MAIN STAGE (Table) -->
        <main
          id="viewport-stage"
          class="h-[40vh] lg:h-auto lg:flex-grow relative overflow-hidden bg-[radial-gradient(circle_at_center,_#1a2e1a_0%,_#0a0a0a_100%)]"
        >
          <PokerTable
            id="component-poker-table"
            class="w-full h-full"
            :pot="pokerStore.getPot"
            :communityCards="pokerStore.getCommunityCards"
            :players="allPlayers"
            :activePlayerId="pokerStore.getActivePlayerId"
          />

          <!-- Notification Toast -->
          <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-4 opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-4 opacity-0">
            <div v-if="pokerStore.getDisplayMsg && !isMyTurn" id="game-toast" class="absolute bottom-32 left-1/2 -translate-x-1/2 z-30">
              <div id="toast-content" class="bg-black/80 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10 shadow-2xl">
                <span id="toast-text" class="text-sm font-bold text-gray-100 uppercase tracking-widest">{{ pokerStore.getDisplayMsg }}</span>
              </div>
            </div>
          </Transition>
        </main>

        <!-- PLAYER HUD -->
        <footer id="hud-zone" class="z-50 shrink-0">
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

      <!-- SIDEPANEL: PLAYERS (Con min-h-0 para activar scroll) -->
      <PlayerSidepanel
        id="sidepanel-container"
        class="flex-1 min-h-0"
        :players="allPlayers"
        :activePlayerId="pokerStore.getActivePlayerId"
        :myPlayerId="pokerStore.myInfo.id"
        :pot="pokerStore.getPot"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePokerStore } from '../store/pokerStore'
import useWebSocket from '../use/useSockets'
import { v4 as uuidv4 } from 'uuid'

import PokerTable from '../components/PokerTable.vue'
import ActionBar from '../components/ActionBar.vue'
import WinnerOverlay from '../components/WinnerOverlay.vue'
import PlayerSidepanel from '../components/PlayerSidepanel.vue'

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
const secretCode = uuidv4()

const wsPort = import.meta.env.VITE_WS_PORT || '8888'
const wsUrl = import.meta.env.VITE_WS_URL || 'localhost'
const wsProtocol = import.meta.env.VITE_WS_PROTOCOL ||`ws`
const wsUrlwPort = `${wsProtocol}://${wsUrl}:${wsPort}`

const connectionOptions = { gameCode, playerName, secretCode }

const { connectSocket, disconnectSocket, sendMessage } = useWebSocket(
  wsUrlwPort,
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
  const baseMin = currentMaxBetOnTable.value > 0 ? currentMaxBetOnTable.value + 20 : 20
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
