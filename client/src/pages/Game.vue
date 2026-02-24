<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
    <!-- Header -->
    <header class="bg-gray-800 p-4 shadow-md flex justify-between items-center z-10">
      <div class="flex items-center space-x-4">
        <Logo class="h-10 w-auto" />
        <h1 class="text-xl font-bold tracking-wider">Deush Poker</h1>
      </div>
      <div class="flex items-center space-x-4">
        <div
          class="px-3 py-1 rounded-full text-xs font-semibold"
          :class="isConnected ? 'bg-green-500 text-green-900' : 'bg-red-500 text-red-900'"
        >
          {{ isConnected ? "CONNECTED" : "DISCONNECTED" }}
        </div>
        <button
          @click="toggleConnection"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors"
        >
          {{ isConnected ? "Disconnect" : "Connect" }}
        </button>
      </div>
    </header>

    <!-- Game Area -->
    <main class="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
      <!-- Background Texture (Optional) -->
      <div class="absolute inset-0 bg-green-900 opacity-50 pointer-events-none"></div>

      <!-- Dealer Message Box (Top Left) -->
      <div class="absolute top-4 left-4 z-30 w-64 bg-black bg-opacity-60 rounded-lg p-3 border border-gray-700 shadow-xl pointer-events-none">
        <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Dealer Info</h3>
        <div class="space-y-2">
          <div 
            v-for="log in pokerStore.getDealerLog" 
            :key="log.id" 
            class="text-sm transition-opacity duration-500"
            :class="log.type === 'private' ? 'text-blue-300 italic' : 'text-gray-200'"
          >
            {{ log.text }}
          </div>
          <div v-if="pokerStore.getDealerLog.length === 0" class="text-sm text-gray-600">
            Waiting for game start...
          </div>
        </div>
      </div>

      <!-- Poker Table -->
      <div
        class="relative bg-green-800 border-8 border-yellow-900 rounded-[100px] w-full max-w-6xl h-[600px] shadow-2xl flex flex-col justify-between p-8"
        style="box-shadow: inset 0 0 100px rgba(0,0,0,0.6);"
      >
        <!-- Top Players -->
        <div class="flex justify-center space-x-8 -mt-16 z-20">
          <Player
            v-for="player in opponents"
            :key="player.id || player.name"
            :playerName="player.name"
            :playerChips="player.chips"
            :playerAction="player.lastAction"
            :playerCards="player.cards || []"
            :showCards="player.showCards"
            :isActive="pokerStore.getActivePlayerId === player.id"
          />
        </div>

        <!-- Center Table Area -->
        <div class="flex-grow flex flex-col items-center justify-center space-y-4">
          <!-- Pot -->
          <div class="bg-black bg-opacity-40 px-6 py-2 rounded-full text-yellow-400 font-mono text-xl border border-yellow-600">
            POT: ${{ pokerStore.getPot }}
          </div>

          <!-- Message Box / Game Status (Central) -->
          <div v-if="pokerStore.getDisplayMsg" class="text-yellow-200 font-bold text-2xl animate-pulse text-center max-w-md drop-shadow-md">
            {{ pokerStore.getDisplayMsg }}
          </div>

          <!-- Community Cards -->
          <div class="flex space-x-2 min-h-[9rem]">
             <template v-if="pokerStore.getCommunityCards && pokerStore.getCommunityCards.length > 0">
                <Card
                  v-for="(card, index) in pokerStore.getCommunityCards"
                  :key="index"
                  :size="'large'"
                  :numSymbol="card"
                />
             </template>
             <template v-else>
               <CardSpace v-for="i in 5" :key="i" :size="'large'" />
             </template>
          </div>
        </div>

        <!-- Bottom Player (Me) -->
        <div class="flex justify-center -mb-16 z-20">
           <Player
            v-if="myPlayer"
            :playerName="myPlayer.name"
            :playerChips="myPlayer.chips"
            :playerAction="myPlayer.lastAction"
            :playerCards="myPlayer.cards || []"
            :showCards="true"
            :isActive="pokerStore.getActivePlayerId === myPlayer.id"
            class="scale-110"
          /> 
          <div v-else class="text-gray-400 font-bold">Waiting for player...</div>
        </div>
      </div>
    </main>

    <!-- Footer Controls -->
    <footer class="bg-gray-800 p-4 border-t border-gray-700">
      <div class="container mx-auto flex justify-center items-center space-x-4">
        <!-- Blind Bet Button -->
        <button v-if="canBlind" @click="sendAction('blind')" class="btn-control bg-purple-600 hover:bg-purple-500">Post Blind</button>

        <button v-if="canCheck" @click="sendAction('check')" class="btn-control bg-gray-600 hover:bg-gray-500">Check</button>
        <button v-if="canCall" @click="sendAction('call')" class="btn-control bg-blue-600 hover:bg-blue-500">Call</button>
        
        <div v-if="canBet || canRaise" class="flex flex-col items-center space-y-1">
             <button @click="sendAction(canBet ? 'bet' : 'raise')" class="btn-control bg-yellow-600 hover:bg-yellow-500">
                {{ canBet ? 'Bet' : 'Raise' }}
             </button>
             <input type="number" v-model="betAmount" class="w-20 bg-gray-700 text-white text-center rounded text-sm" placeholder="Amt" />
        </div>
       
        <button v-if="canFold" @click="sendAction('fold')" class="btn-control bg-red-600 hover:bg-red-500">Fold</button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { usePokerStore } from "../store/pokerStore";
import useWebSocket from "../use/useSockets";
import { v4 as uuidv4 } from "uuid";

// Components
import Logo from "../components/Logo.vue";
import Player from "../components/Player.vue";
import Card from "../components/Card.vue";
import CardSpace from "../components/CardSpace.vue";

const route = useRoute();
const pokerStore = usePokerStore();

// Game State Setup
const gameCode = route.params.gameCode || "default_Torneo";

// Persistir nombre para reconexiones
const getSavedName = () => {
  const saved = localStorage.getItem(`poker_name_${gameCode}`);
  if (saved) return saved;
  const newName = route.query.playerName || `Guest_${Math.floor(Math.random() * 1000)}`;
  localStorage.setItem(`poker_name_${gameCode}`, newName);
  return newName;
};

const playerName = getSavedName();
const secretCode = uuidv4();

const wsUrl = "ws://localhost:8888"; 
const connectionOptions = {
  gameCode,
  playerName,
  secretCode
};

const { socket, connectSocket, disconnectSocket, sendMessage } = useWebSocket(wsUrl, connectionOptions);

const isConnected = computed(() => pokerStore.getConnected);
const betAmount = ref(100);

const toggleConnection = () => {
  if (isConnected.value) {
    disconnectSocket();
  } else {
    connectSocket();
  }
};

onMounted(() => {
  if (!isConnected.value) {
    connectSocket();
  }
});

onBeforeUnmount(() => {
  disconnectSocket();
});

// Computed Players
const allPlayers = computed(() => pokerStore.getPLayers || []);
const myPlayer = computed(() => allPlayers.value.find(p => p.id === pokerStore.myInfo.id || p.name === playerName));
const opponents = computed(() => allPlayers.value.filter(p => p.id !== myPlayer.value?.id));

// Interaction Logic
const isMyTurn = computed(() => pokerStore.getActivePlayerId === myPlayer.value?.id);
const options = computed(() => pokerStore.getBettingOptions || []);

const canCheck = computed(() => isMyTurn.value && options.value.includes('check'));
const canCall = computed(() => isMyTurn.value && options.value.includes('call'));
const canFold = computed(() => isMyTurn.value && options.value.includes('fold'));
const canBet = computed(() => isMyTurn.value && options.value.includes('bet'));
const canRaise = computed(() => isMyTurn.value && options.value.includes('rise'));
const canBlind = computed(() => isMyTurn.value && options.value.includes('blind'));

// Actions
const sendAction = (action) => {
  if (!isConnected.value || !isMyTurn.value) return;

  switch (action) {
    case 'check':
      sendMessage({ action: 'setCheck' });
      break;
    case 'call':
      sendMessage({ action: 'setCall' });
      break;
    case 'fold':
      sendMessage({ action: 'fold' });
      break;
    case 'bet':
      sendMessage({ action: 'setBet', chipsToBet: betAmount.value });
      break;
    case 'raise':
      sendMessage({ action: 'setRise', chipsToRiseBet: betAmount.value });
      break;
    case 'blind':
      const isSmallBlind = pokerStore.getDisplayMsg.toLowerCase().includes('small');
      sendMessage({ action: 'setBet', chipsToBet: isSmallBlind ? 10 : 20 });
      break;
  }
};

</script>

<style scoped>
.btn-control {
  @apply px-6 py-3 rounded font-bold shadow-lg transform transition hover:-translate-y-1 active:scale-95 text-white disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
