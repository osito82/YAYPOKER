<template>
  <div class="min-h-screen bg-gray-950 text-white flex flex-col font-sans overflow-hidden">
    <!-- Header -->
    <header class="bg-gray-900 p-4 shadow-2xl flex justify-between items-center z-50 border-b-2 border-yellow-600/30">
      <div class="flex items-center space-x-4">
        <Logo class="h-10 w-auto" />
        <h1 class="text-2xl font-black tracking-tighter text-yellow-500 uppercase italic">DEUSH <span class="text-white not-italic">POKER</span></h1>
      </div>
      <div class="flex items-center space-x-4">
        <div class="px-4 py-1 bg-gray-800 rounded-full border border-gray-700">
          <span class="text-[10px] text-gray-500 uppercase font-bold mr-2">Status:</span>
          <span class="text-xs font-mono" :class="isConnected ? 'text-green-400' : 'text-red-400'">{{ isConnected ? 'CONNECTED' : 'OFFLINE' }}</span>
        </div>
      </div>
    </header>

    <!-- Main Game Table Area -->
    <main class="flex-grow flex flex-col items-center justify-center p-4 relative">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-800/20 via-black to-black opacity-60"></div>

      <!-- Poker Table -->
      <div class="relative bg-green-900 border-[16px] border-yellow-950 rounded-[180px] w-full max-w-6xl h-[520px] shadow-[0_0_150px_rgba(0,0,0,1)] flex flex-col justify-between p-16 mb-12">
        
        <!-- Opponents -->
        <div class="flex justify-center space-x-16 -mt-28 z-20">
          <Player
            v-for="p in opponents"
            :key="p.id"
            :playerName="p.name"
            :playerChips="p.chips"
            :playerAction="p.lastAction"
            :playerCards="p.cards || []"
            :isActive="pokerStore.getActivePlayerId === p.id"
          />
        </div>

        <!-- Pot and Community Cards -->
        <div class="flex-grow flex flex-col items-center justify-center space-y-8">
          <div class="bg-black/80 backdrop-blur-xl px-12 py-4 rounded-3xl border-2 border-yellow-500/50 shadow-[0_0_40px_rgba(234,179,8,0.2)]">
            <span class="block text-center text-[10px] text-yellow-500 uppercase font-black tracking-[0.3em] mb-1">THE POT</span>
            <span class="text-4xl font-mono font-black text-white">${{ pokerStore.getPot }}</span>
          </div>

          <div class="flex space-x-4 h-36">
             <template v-if="pokerStore.getCommunityCards?.length > 0">
                <Card v-for="(c, i) in pokerStore.getCommunityCards" :key="i" size="large" :numSymbol="c" />
             </template>
             <template v-else>
               <CardSpace v-for="i in 5" :key="i" size="large" class="opacity-20" />
             </template>
          </div>
        </div>

        <!-- My Seat -->
        <div class="flex justify-center -mb-32 z-30">
           <Player
            v-if="myPlayer"
            :playerName="myPlayer.name"
            :playerChips="myPlayer.chips"
            :playerAction="myPlayer.lastAction"
            :playerCards="myPlayer.cards || []"
            :showCards="true"
            :isActive="isMyTurn"
            class="scale-150 origin-bottom"
          /> 
        </div>
      </div>

      <!-- Central Turn Alert -->
      <div v-if="pokerStore.getDisplayMsg" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
         <div class="bg-yellow-500 text-black px-10 py-4 rounded-2xl font-black text-3xl shadow-[0_0_100px_rgba(234,179,8,0.6)] border-4 border-black uppercase italic tracking-tighter animate-bounce">
            {{ pokerStore.getDisplayMsg }}
         </div>
      </div>
    </main>

    <!-- CONTROL CONSOLE (FOOTER) -->
    <footer class="bg-gray-900 border-t-4 border-yellow-600/20 p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-50">
      <div class="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-10">
        
        <!-- Turn Status -->
        <div class="flex items-center space-x-6 min-w-[250px]">
           <div v-if="isMyTurn" class="flex items-center text-yellow-500">
              <div class="w-4 h-4 bg-yellow-500 rounded-full mr-3 animate-ping"></div>
              <span class="text-2xl font-black uppercase italic tracking-widest">IT'S YOUR TURN!</span>
           </div>
           <div v-else class="text-gray-600 flex items-center font-bold uppercase tracking-widest">
              <svg class="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Waiting for others...
           </div>
        </div>

        <!-- ACTION CENTER -->
        <div class="flex flex-wrap items-center justify-center gap-6">
          
          <!-- BIG POST BLIND -->
          <button v-if="canBlind || pokerStore.getDisplayMsg?.toLowerCase().includes('blind')" 
            @click="sendAction('blind')" 
            class="px-16 py-8 bg-gradient-to-b from-purple-500 to-purple-800 hover:from-purple-400 hover:to-purple-700 rounded-2xl font-black text-4xl shadow-[0_0_50px_rgba(168,85,247,0.4)] border-b-[10px] border-purple-950 active:border-b-0 active:translate-y-2 transition-all uppercase italic text-white tracking-tighter">
            Post Blind
          </button>

          <!-- Standard Buttons (Only if not blind) -->
          <div v-if="isMyTurn && !canBlind" class="flex gap-4">
            <button v-if="canFold || options.includes('fold')" @click="sendAction('fold')" class="btn-casino bg-red-800 border-red-950 hover:bg-red-700">Fold</button>
            <button v-if="canCheck || options.includes('check')" @click="sendAction('check')" class="btn-casino bg-gray-700 border-gray-900 hover:bg-gray-600">Check</button>
            <button v-if="canCall || options.includes('call')" @click="sendAction('call')" class="btn-casino bg-blue-800 border-blue-950 hover:bg-blue-700">Call</button>
          </div>

          <!-- BETTING CONSOLE -->
          <div v-if="isMyTurn && (canBet || canRaise || options.includes('bet') || options.includes('rise')) && !canBlind" 
               class="flex items-center bg-black/40 p-6 rounded-3xl border-2 border-gray-800 shadow-inner gap-8">
             
             <div class="flex flex-col w-64">
                <div class="flex justify-between mb-2">
                   <span class="text-xs font-black text-gray-500 uppercase tracking-widest">Amount</span>
                   <span class="text-2xl font-mono font-bold text-yellow-500">${{ betAmount }}</span>
                </div>
                <input type="range" v-model.number="betAmount" :min="minBet" :max="maxBet" step="10" class="bet-slider-pro" />
                <div class="flex justify-between mt-4 gap-2">
                   <button @click="setQuickBet(0.5)" class="chip-btn">1/2</button>
                   <button @click="setQuickBet(1)" class="chip-btn font-black">POT</button>
                   <button @click="setQuickBet('all')" class="chip-btn bg-red-900/20 border-red-900/50 text-red-500">MAX</button>
                </div>
             </div>

             <button @click="sendAction(canBet || options.includes('bet') ? 'bet' : 'raise')" 
                     class="px-14 py-8 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl font-black text-3xl shadow-[0_10px_40px_rgba(234,179,8,0.3)] border-b-8 border-yellow-700 active:border-b-0 active:translate-y-2 transition-all uppercase italic">
                {{ (canBet || options.includes('bet')) ? 'BET' : 'RAISE' }}
             </button>
          </div>
        </div>

        <!-- Balance Section -->
        <div class="min-w-[250px] flex flex-col items-end bg-black/30 p-4 rounded-2xl border border-white/5">
           <span class="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Your Balance</span>
           <span class="text-4xl font-mono font-black text-white tracking-tighter">${{ myPlayer?.chips || 0 }}</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import { usePokerStore } from "../store/pokerStore";
import useWebSocket from "../use/useSockets";
import { v4 as uuidv4 } from "uuid";

import Logo from "../components/Logo.vue";
import Player from "../components/Player.vue";
import Card from "../components/Card.vue";
import CardSpace from "../components/CardSpace.vue";

const route = useRoute();
const pokerStore = usePokerStore();
const gameCode = route.params.gameCode || "default_Torneo";

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

const isConnected = computed(() => pokerStore.getConnected);
const minBet = computed(() => 20);
const maxBet = computed(() => myPlayer.value?.chips || 1000);
const betAmount = ref(minBet.value);

const setQuickBet = (m) => {
  if (m === 'all') betAmount.value = maxBet.value;
  else {
    let a = Math.max(minBet.value, (pokerStore.getPot || 0) * m);
    betAmount.value = Math.min(a, maxBet.value);
  }
};

watch(() => pokerStore.getActivePlayerId, (id) => {
  if (id === myPlayer.value?.id) betAmount.value = minBet.value;
});

const toggleConnection = () => isConnected.value ? disconnectSocket() : connectSocket();
onMounted(() => { if (!isConnected.value) connectSocket(); });
onBeforeUnmount(() => disconnectSocket());

const allPlayers = computed(() => pokerStore.getPLayers || []);
const myPlayer = computed(() => allPlayers.value.find(p => p.id === pokerStore.myInfo.id || p.name === playerName));
const opponents = computed(() => allPlayers.value.filter(p => p.id !== myPlayer.value?.id));
const isMyTurn = computed(() => pokerStore.getActivePlayerId === myPlayer.value?.id);
const options = computed(() => pokerStore.getBettingOptions || []);

const canCheck = computed(() => isMyTurn.value && options.value.includes('check'));
const canCall = computed(() => isMyTurn.value && options.value.includes('call'));
const canFold = computed(() => isMyTurn.value && options.value.includes('fold'));
const canBet = computed(() => isMyTurn.value && options.value.includes('bet'));
const canRaise = computed(() => isMyTurn.value && (options.value.includes('rise') || options.value.includes('raise')));
const canBlind = computed(() => isMyTurn.value && options.value.includes('blind'));

const sendAction = (action) => {
  if (!isConnected.value) return;
  switch (action) {
    case 'check': sendMessage({ action: 'setCheck' }); break;
    case 'call': sendMessage({ action: 'setCall' }); break;
    case 'fold': sendMessage({ action: 'fold' }); break;
    case 'bet': sendMessage({ action: 'setBet', chipsToBet: betAmount.value }); break;
    case 'raise': sendMessage({ action: 'setRise', chipsToRiseBet: betAmount.value }); break;
    case 'blind':
      const isS = pokerStore.getDisplayMsg?.toLowerCase().includes('small');
      sendMessage({ action: 'setBet', chipsToBet: isS ? 10 : 20 });
      break;
  }
};
</script>

<style scoped>
.btn-casino {
  @apply px-10 py-6 rounded-2xl font-black text-2xl shadow-xl border-b-[6px] transition-all active:border-b-0 active:translate-y-1 uppercase italic tracking-tighter text-white;
}
.chip-btn {
  @apply px-4 py-2 bg-gray-800 border-2 border-white/10 rounded-xl text-xs hover:bg-gray-700 transition-colors uppercase font-black text-gray-400;
}
.bet-slider-pro {
  @apply w-full h-3 bg-gray-800 rounded-full appearance-none cursor-pointer accent-yellow-500 border border-white/5;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  @apply w-8 h-8 bg-yellow-500 rounded-full border-4 border-black shadow-2xl;
}
</style>
