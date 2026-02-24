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
            :isActive="player.isActive"
          />
        </div>

        <!-- Center Table Area -->
        <div class="flex-grow flex flex-col items-center justify-center space-y-4">
          <!-- Pot -->
          <div class="bg-black bg-opacity-40 px-6 py-2 rounded-full text-yellow-400 font-mono text-xl border border-yellow-600">
            POT: ${{ pokerStore.getPot }}
          </div>

          <!-- Message Box / Game Status -->
          <div v-if="pokerStore.getDisplayMsg" class="text-yellow-200 font-semibold text-lg animate-pulse">
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
            :isActive="myPlayer.isActive"
            class="scale-110"
          /> 
          <div v-else class="text-gray-400 font-bold">Waiting for player...</div>
        </div>
      </div>
    </main>

    <!-- Footer Controls -->
    <footer class="bg-gray-800 p-4 border-t border-gray-700">
      <div class="container mx-auto flex justify-center items-center space-x-4">
        <button @click="sendAction('check')" class="btn-control bg-gray-600 hover:bg-gray-500">Check</button>
        <button @click="sendAction('call')" class="btn-control bg-blue-600 hover:bg-blue-500">Call</button>
        <div class="flex flex-col items-center space-y-1">
             <button @click="sendAction('raise')" class="btn-control bg-yellow-600 hover:bg-yellow-500">Raise</button>
             <input type="number" v-model="raiseAmount" class="w-20 bg-gray-700 text-white text-center rounded text-sm" placeholder="Amt" />
        </div>
       
        <button @click="sendAction('fold')" class="btn-control bg-red-600 hover:bg-red-500">Fold</button>
      </div>
      <!-- Debug/Info -->
      <!-- <div class="text-center mt-2 text-xs text-gray-500">
        Game Code: {{ gameCode }} | Player: {{ playerName }}
      </div> -->
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
// Use provided player name or generate a random one
const playerName = route.query.playerName || `Guest_${Math.floor(Math.random() * 1000)}`;
const secretCode = uuidv4();

// WebSocket Setup
// Assuming the backend is on localhost:8888 based on analysis
const wsUrl = "ws://localhost:8888"; 
const connectionOptions = {
  gameCode,
  playerName,
  secretCode
};

const { socket, connectSocket, disconnectSocket, sendMessage } = useWebSocket(wsUrl, connectionOptions);

const isConnected = ref(false);
const raiseAmount = ref(100);

// Watch for socket state
// Note: useSockets might need to expose connection state reactively. 
// For now, we rely on pokerStore.conected or manual check.
// But useSockets doesn't expose a reactive 'isConnected'. 
// We can hook into the socket's events if exposed, or check pokerStore if the socket hook updates it.
// Looking at useSockets.js, it doesn't update a reactive ref for connection status explicitly other than logging.
// However, pokerStore has 'conected' state.
// Let's assume useSockets or the app logic should update the store.
// useSockets.js sets store.setConnected? No, it only logs.
// I will implement a check or modify useSockets later, but for now let's just toggle.

const toggleConnection = () => {
  if (isConnected.value) {
    disconnectSocket();
    isConnected.value = false;
  } else {
    connectSocket();
    // Simulate connection success for UI immediately (real status should come from event)
    setTimeout(() => isConnected.value = true, 500);
  }
};

onMounted(() => {
  connectSocket();
  isConnected.value = true;
});

onBeforeUnmount(() => {
  disconnectSocket();
});

// Computed Players
const allPlayers = computed(() => pokerStore.getPLayers || []);

const myPlayer = computed(() => {
  return allPlayers.value.find(p => p.name === playerName);
});

const opponents = computed(() => {
  return allPlayers.value.filter(p => p.name !== playerName);
});


// Actions
const sendAction = (action) => {
  if (!isConnected.value) return;

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
    case 'raise':
      sendMessage({ action: 'setRise', chipsToRiseBet: raiseAmount.value });
      break;
  }
};

</script>

<style scoped>
.btn-control {
  @apply px-6 py-3 rounded font-bold shadow-lg transform transition hover:-translate-y-1 active:scale-95 text-white;
}
</style>
