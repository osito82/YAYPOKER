<template>
  <aside
    id="sidepanel-root"
    class="w-full lg:w-[350px] h-full bg-black/40 backdrop-blur-3xl border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col shrink-0 min-h-0 z-40"
  >
    <!-- Sidepanel Header -->
    <div id="sidepanel-header-container" class="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
      <h2 id="sidepanel-main-title" class="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
        <div id="sidepanel-live-pulse" class="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
        Players
      </h2>
      <!-- Live Players Counter -->
      <div id="sidepanel-live-players-counter" class="bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
        <span id="sidepanel-counter-value" class="text-[10px] font-mono font-bold text-gray-300">{{ players.length }} online</span>
      </div>
    </div>

    <!-- Players Scrollable List with Smooth Transitions -->
    <TransitionGroup
      name="player-list"
      tag="div"
      id="sidepanel-players-list"
      class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar pb-32 lg:pb-4"
    >
      <div
        v-for="player in sortedPlayers"
        :key="player.id"
        :id="'sidepanel-player-card-' + player.id"
        class="group relative flex items-center gap-4 p-3 rounded-xl transition-all duration-500 border border-transparent"
        :class="[
          player.id === activePlayerId 
            ? 'bg-yellow-500/20 border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.15)] z-10' 
            : 'bg-white/[0.03] hover:bg-white/[0.06]'
        ]"
      >
        <!-- Player Avatar -->
        <div :id="'sidepanel-player-avatar-box-' + player.id" class="relative">
          <div 
            :id="'sidepanel-player-initial-' + player.id"
            class="w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg border-2 transition-colors duration-500"
            :class="player.id === activePlayerId ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-gray-800 border-white/10 text-gray-400'"
          >
            {{ player.name?.charAt(0).toUpperCase() }}
          </div>
          <!-- Turn Indicator -->
          <div 
            v-if="player.id === activePlayerId"
            :id="'sidepanel-turn-dot-' + player.id"
            class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-black flex items-center justify-center animate-bounce"
          >
            <div class="w-1.5 h-1.5 bg-black rounded-full"></div>
          </div>
        </div>

        <!-- Player Info -->
        <div :id="'sidepanel-player-info-' + player.id" class="flex-1 flex flex-col min-w-0">
          <div :id="'sidepanel-player-header-' + player.id" class="flex items-center justify-between gap-2 mb-1">
            <span :id="'sidepanel-player-name-' + player.id" class="font-black text-lg text-gray-100 truncate uppercase tracking-wide transition-all duration-500" :class="{ 'text-yellow-400': player.id === activePlayerId }">{{ player.name }}</span>
          </div>
          
          <div :id="'sidepanel-player-stats-' + player.id" class="flex items-center justify-between">
            <div class="flex items-center gap-1">
              <span class="text-[14px] text-yellow-500 font-mono font-bold">$</span>
              <span :id="'sidepanel-player-chips-' + player.id" class="text-lg font-mono font-black text-white">{{ player.chips }}</span>
            </div>

            <div class="flex items-center gap-3">
              <!-- Last Action Badge -->
              <span 
                v-if="player.lastAction" 
                :id="'sidepanel-player-action-' + player.id"
                class="text-xs font-black uppercase px-2 py-1 rounded transition-all duration-500 bg-white/10 border border-white/5"
                :class="getActionColor(player.lastAction)"
              >{{ player.lastAction }}</span>

              <!-- Individual Bet -->
              <div v-if="player.currentBet > 0" class="flex items-center gap-1">
                <span :id="'sidepanel-player-card-bet-' + player.id" class="text-xl font-mono font-black text-emerald-400 tracking-tighter transition-all duration-500">${{ player.currentBet }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Connectivity Light -->
        <div 
          :id="'sidepanel-player-status-' + player.id"
          class="w-1.5 h-1.5 rounded-full transition-colors duration-500"
          :class="player.isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-600'"
        ></div>
      </div>
    </TransitionGroup>

    <!-- Sidepanel Footer -->
    <div id="sidepanel-footer-container" class="hidden lg:block p-4 bg-black/60 border-t border-white/5 shrink-0">
      <div id="sidepanel-pot-summary" class="flex justify-between items-center">
        <span id="sidepanel-pot-label" class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Pot</span>
        <span id="sidepanel-pot-value" class="text-emerald-400 text-sm font-mono font-black italic shadow-emerald-500/20 shadow-sm">${{ pot }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  players: { type: Array, default: () => [] },
  activePlayerId: { type: String, default: null },
  pot: { type: Number, default: 0 }
})

const sortedPlayers = computed(() => {
  const list = [...props.players]
  const activeIdx = list.findIndex(p => p.id === props.activePlayerId)
  if (activeIdx > 0) {
    const [activePlayer] = list.splice(activeIdx, 1)
    list.unshift(activePlayer)
  }
  return list
})

const getActionColor = (action) => {
  const a = action.toLowerCase()
  if (a.includes('fold')) return 'text-red-400 border-red-500/20 bg-red-500/10'
  if (a.includes('raise') || a.includes('bet')) return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
  if (a.includes('call')) return 'text-blue-400 border-blue-500/20 bg-blue-600/10'
  if (a.includes('check')) return 'text-gray-400 border-white/10 bg-white/5'
  return 'text-white/60'
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

/* Reordering Transitions */
.player-list-move {
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.player-list-enter-active,
.player-list-leave-active {
  transition: all 0.5s ease;
}

.player-list-enter-from,
.player-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Ensure leaving items are taken out of flow so move animation can work */
.player-list-leave-active {
  position: absolute;
}
</style>
