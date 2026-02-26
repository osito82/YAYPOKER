<template>
  <div id="game-root" class="h-screen w-screen bg-neutral-950 overflow-hidden flex flex-col font-sans text-white select-none">
    
    <!-- WINNER ANNOUNCEMENT OVERLAY -->
    <WinnerOverlay :winnerInfo="pokerStore.getWinnerInfo" />

    <!-- TOP METADATA BAR (Professional Status) -->
    <nav id="top-bar" class="absolute top-0 left-0 w-full p-4 z-40 flex justify-between items-start pointer-events-none">
      
      <!-- Table Info -->
      <div id="info-panel" class="pointer-events-auto flex flex-col items-start bg-black/40 backdrop-blur-md border-l-4 border-yellow-500 px-5 py-2 rounded-r-2xl shadow-xl">
        <h1 id="lbl-table-type" class="text-[10px] font-black text-yellow-500 uppercase tracking-[0.25em] mb-1">No Limit Hold'em</h1>
        <div class="flex items-center gap-3">
          <span id="lbl-blinds" class="text-sm font-mono font-bold text-gray-200">Blinds $10/$20</span>
          <div class="h-3 w-px bg-white/20"></div>
          <span id="lbl-table-code" class="text-[10px] font-mono text-gray-500">REF: {{ gameCode }}</span>
        </div>
      </div>

      <!-- Connection & Player Info -->
      <div class="flex flex-col items-end gap-2">
        <div id="player-badge" class="pointer-events-auto bg-yellow-500/10 backdrop-blur-md px-4 py-1 rounded-full border border-yellow-500/20">
          <span class="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{{ playerName }}</span>
        </div>
        
        <div id="status-panel" class="pointer-events-auto bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
          <div id="status-dot" class="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" :class="isConnected ? 'bg-green-500 text-green-500' : 'bg-red-500 text-red-500'"></div>
          <span id="lbl-connection" class="text-[9px] font-bold uppercase tracking-widest text-gray-400">{{ isConnected ? 'LIVE' : 'RECONNECTING' }}</span>
        </div>
      </div>
    </nav>

    <!-- MAIN STAGE -->
    <main id="viewport-stage" class="flex-grow flex items-center justify-center relative overflow-hidden bg-[radial-gradient(circle_at_center,_#1a2e1a_0%,_#0a0a0a_100%)]">
      
      <!-- Ambient Lights -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1/2 bg-yellow-500/5 blur-[120px] pointer-events-none"></div>

      <!-- Poker Table -->
      <PokerTable 
        id="component-poker-table"
        :pot="pokerStore.getPot"
        :communityCards="pokerStore.getCommunityCards"
        :opponents="opponents"
        :activePlayerId="pokerStore.getActivePlayerId"
      />

      <!-- Notification Toast (Subtle) -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-y-4 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-4 opacity-0"
      >
        <div v-if="pokerStore.getDisplayMsg && !isMyTurn" id="game-toast" class="absolute bottom-32 left-1/2 -translate-x-1/2 z-30">
           <div class="bg-black/80 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10 shadow-2xl">
              <span class="text-xs font-bold text-gray-300 uppercase tracking-widest">{{ pokerStore.getDisplayMsg }}</span>
           </div>
        </div>
      </Transition>
    </main>

    <!-- PLAYER COCKPIT (HUD) -->
    <footer id="hud-zone" class="z-50">
      <ActionBar 
        id="component-action-bar"
        :isMyTurn="isMyTurn"
        :canBlind="canBlind"
        :options="options"
        :balance="myPlayer?.chips || 0"
        v-model:betAmount="betAmount"
        :minBet="minBet"
        :maxBet="maxBet"
        :playerCards="myPlayer?.cards || []"
        @action="sendAction"
        @setQuickBet="setQuickBet"
      />
    </footer>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import { usePokerStore } from "../store/pokerStore";
import useWebSocket from "../use/useSockets";
import { v4 as uuidv4 } from "uuid";

import PokerTable from "../components/PokerTable.vue";
import ActionBar from "../components/ActionBar.vue";
import WinnerOverlay from "../components/WinnerOverlay.vue";

const route = useRoute();
const pokerStore = usePokerStore();
const gameCode = route.params.gameCode || "default_Torneo";

// Logic for name/uuid generation
const getSavedName = () => {
  if (route.query.playerName) return route.query.playerName;
  const saved = sessionStorage.getItem(`poker_name_${gameCode}`);
  if (saved) return saved;
  const newName = `Guest_${Math.floor(Math.random() * 1000)}`;
  sessionStorage.setItem(`poker_name_${gameCode}`, newName);
  return newName;
};

const playerName = getSavedName();
const secretCode = uuidv4();
const wsUrl = "ws://localhost:8888"; 
const connectionOptions = { gameCode, playerName, secretCode };

const { socket, connectSocket, disconnectSocket, sendMessage } = useWebSocket(wsUrl, connectionOptions);

// 1. BASIC COMPUTEDS
const isConnected = computed(() => pokerStore.getConnected);
const currentMaxBetOnTable = computed(() => pokerStore.getCurrentHighestBet || 0);

// 2. PLAYER LOGIC COMPUTEDS (Must be before watchers)
const allPlayers = computed(() => pokerStore.getPlayers || []);
const myPlayer = computed(() => allPlayers.value.find(p => p.id === pokerStore.myInfo.id || p.name === playerName));
const opponents = computed(() => allPlayers.value.filter(p => p.id !== myPlayer.value?.id));
const isMyTurn = computed(() => pokerStore.getActivePlayerId === myPlayer.value?.id);
const options = computed(() => pokerStore.getBettingOptions || []);
const canBlind = computed(() => isMyTurn.value && options.value.includes('blind'));

// 3. DYNAMIC BETTING LIMITS
const minBet = computed(() => {
  return currentMaxBetOnTable.value > 0 ? currentMaxBetOnTable.value + 20 : 20;
});

const maxBet = computed(() => {
  const stack = myPlayer.value?.chips || 0;
  const alreadyBet = myPlayer.value?.currentBet || 0;
  return stack + alreadyBet;
});

// 4. REACTIVE STATE
const betAmount = ref(minBet.value);

// 5. ACTIONS & WATCHERS
const setQuickBet = (m) => {
  if (m === 'all') betAmount.value = maxBet.value;
  else {
    const callAmount = Math.max(0, currentMaxBetOnTable.value - (myPlayer.value?.currentBet || 0));
    let a = currentMaxBetOnTable.value + (pokerStore.getPot + callAmount) * m;
    betAmount.value = Math.min(Math.max(minBet.value, Math.round(a)), maxBet.value);
  }
};

watch(isMyTurn, (newVal) => {
  if (newVal) {
    betAmount.value = Math.min(minBet.value, maxBet.value);
  }
});

watch(currentMaxBetOnTable, (newMax) => {
    if (isMyTurn.value && betAmount.value < minBet.value) {
        betAmount.value = Math.min(minBet.value, maxBet.value);
    }
});

const sendAction = (action) => {
  if (!isConnected.value) return;
  switch (action) {
    case 'check': sendMessage({ action: 'setCheck' }); break;
    case 'call': sendMessage({ action: 'setCall' }); break;
    case 'fold': sendMessage({ action: 'fold' }); break;
    case 'bet': 
    case 'raise': 
      sendMessage({ 
        action: action === 'bet' ? 'setBet' : 'setRise', 
        [action === 'bet' ? 'chipsToBet' : 'chipsToRiseBet']: betAmount.value 
      }); 
      break;
    case 'blind':
      const isS = pokerStore.getDisplayMsg?.toLowerCase().includes('small');
      sendMessage({ action: 'setBet', chipsToBet: isS ? 10 : 20 });
      break;
  }
};

onMounted(() => { if (!isConnected.value) connectSocket(); });
onBeforeUnmount(() => disconnectSocket());
</script>
