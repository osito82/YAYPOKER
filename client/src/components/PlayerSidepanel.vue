<template>
  <aside
    id="sidepanel-root"
    class="w-full lg:w-[350px] flex-1 lg:h-full bg-black/40 backdrop-blur-3xl border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col shrink-0 min-h-0 z-40"
  >
    <!-- Sidepanel Header -->
    <div
      id="sidepanel-header-container"
      class="py-2 px-4 border-b border-white/5 bg-white/[0.01] flex items-center shrink-0"
    >
      <h2
        id="sidepanel-main-title"
        class="text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2"
      >
        <div
          id="sidepanel-live-pulse"
          class="w-1.5 h-1.5 bg-green-500/50 rounded-full"
        ></div>
        Players List
      </h2>
    </div>

    <!-- Players Scrollable List with Smooth Transitions -->
    <TransitionGroup
      name="player-list"
      tag="div"
      id="sidepanel-players-list"
      class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar min-h-0 pb-10"
    >
      <div
        v-for="player in sortedPlayers"
        :key="player.id"
        :id="'sidepanel-player-card-' + player.id"
        class="group relative flex items-center gap-4 p-3 rounded-xl transition-all duration-500 border border-transparent"
        :class="[
          player.id === delayedActivePlayerId
            ? 'bg-yellow-500/20 border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.15)] z-10'
            : 'bg-white/[0.03] hover:bg-white/[0.06]',
        ]"
      >
        <!-- Player Avatar -->
        <div :id="'sidepanel-player-avatar-box-' + player.id" class="relative">
          <div
            :id="'sidepanel-player-initial-' + player.id"
            class="w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg border-2 transition-colors duration-500"
            :class="
              player.id === delayedActivePlayerId
                ? 'bg-yellow-500 border-yellow-400 text-black'
                : 'bg-gray-800 border-white/10 text-gray-400'
            "
          >
            {{ player.name?.charAt(0).toUpperCase() }}
          </div>
          <!-- Turn Indicator -->
          <div
            v-if="player.id === delayedActivePlayerId"
            :id="'sidepanel-turn-dot-' + player.id"
            class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-black flex items-center justify-center animate-bounce"
          >
            <div class="w-1.5 h-1.5 bg-black rounded-full"></div>
          </div>
        </div>

        <!-- Player Info -->
        <div
          :id="'sidepanel-player-info-' + player.id"
          class="flex-1 flex flex-col min-w-0"
        >
          <!-- Main Header Row: Name & Roles -->
          <div
            :id="'sidepanel-player-header-' + player.id"
            class="flex items-start justify-between gap-2 mb-1"
          >
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2">
                <span
                  :id="'sidepanel-player-name-' + player.id"
                  class="font-black text-xl text-gray-100 truncate uppercase tracking-tight transition-all duration-500"
                  :class="{
                    'text-yellow-400': player.id === delayedActivePlayerId,
                  }"
                >
                  {{ player.name }}
                </span>
                <!-- Connection Status -->
                <div
                  :id="'sidepanel-player-status-' + player.id"
                  class="w-2 h-2 rounded-full shrink-0"
                  :class="
                    player.isConnected
                      ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                      : 'bg-gray-600'
                  "
                ></div>
              </div>

              <!-- Sub-header: Status or Is Playing -->
              <div class="h-4 flex items-center">
                <span
                  v-if="player.id === activePlayerId"
                  class="text-[11px] font-bold uppercase tracking-widest text-yellow-500/90 animate-pulse"
                >
                  Current Turn
                </span>
                <span
                  v-else-if="player.folded"
                  class="text-[10px] font-bold uppercase tracking-widest text-gray-500"
                >
                  Folded
                </span>
                <span
                  v-else-if="!player.isConnected"
                  class="text-[10px] font-bold uppercase tracking-widest text-red-500/70"
                >
                  Played
                </span>
              </div>
            </div>

            <!-- Chips Display (Top Right) -->
            <div class="flex flex-col items-end shrink-0">
              <span
                class="text-[10px] font-black text-gray-500 uppercase tracking-tighter leading-none mb-1"
                >Stack</span
              >
              <div class="flex items-center gap-0.5">
                <span class="text-xs text-yellow-500 font-mono font-bold"
                  >$</span
                >
                <span
                  :id="'sidepanel-player-chips-' + player.id"
                  class="text-lg font-mono font-black text-white leading-none"
                  >{{ player.chips }}</span
                >
              </div>
            </div>
          </div>

          <!-- Bottom Row: Action & Bet -->
          <div
            :id="'sidepanel-player-bottom-row-' + player.id"
            class="flex items-end justify-between mt-2 pt-2 border-t border-white/5"
          >
            <!-- Current Bet (Bottom Left) -->
            <div class="flex flex-col">
              <template v-if="player.currentBet > 0">
                <span
                  class="text-[9px] font-black text-emerald-500/70 uppercase tracking-wider mb-0.5"
                  >Live Bet</span
                >
                <span
                  :id="'sidepanel-player-card-bet-' + player.id"
                  class="text-xl font-mono font-black text-emerald-400 leading-none transition-all duration-500"
                  >${{ player.currentBet }}</span
                >
              </template>
            </div>

            <!-- Action Display (Bottom Right) -->
            <div
              v-if="player.lastAction"
              :id="'sidepanel-player-action-container-' + player.id"
              class="flex flex-col items-end text-right"
            >
              <span
                :id="'sidepanel-player-action-label-' + player.id"
                class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1"
              >
                Last Action
              </span>
              <div
                :id="'sidepanel-player-action-value-wrapper-' + player.id"
                class="flex justify-end"
              >
                <Transition name="action-highlight" mode="out-in">
                  <span
                    :key="player.lastAction"
                    :id="'sidepanel-player-action-badge-' + player.id"
                    class="text-xl font-black uppercase px-4 py-1.5 rounded-lg transition-all duration-500 bg-white/10 border border-white/10 shadow-lg"
                    :class="[
                      getActionColor(player.lastAction),
                      player.id === justActedPlayerId
                        ? 'animate-action-flash'
                        : '',
                    ]"
                  >
                    {{ player.lastAction }}
                  </span>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- Sidepanel Footer -->
    <div
      id="sidepanel-footer-container"
      class="hidden lg:block p-4 bg-black/60 border-t border-white/5 shrink-0"
    >
      <div id="sidepanel-pot-summary" class="flex justify-between items-center">
        <span
          id="sidepanel-pot-label"
          class="text-[10px] font-black text-gray-500 uppercase tracking-widest"
          >Global Pot</span
        >
        <span
          id="sidepanel-pot-value"
          class="text-emerald-400 text-sm font-mono font-black italic shadow-emerald-500/20 shadow-sm"
          >${{ pot }}</span
        >
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  players: { type: Array, default: () => [] },
  activePlayerId: { type: String, default: null },
  myPlayerId: { type: String, default: null },
  pot: { type: Number, default: 0 },
})

const delayedActivePlayerId = ref(props.activePlayerId)
const justActedPlayerId = ref(null)

watch(
  () => props.activePlayerId,
  (newId, oldId) => {
    if (newId === oldId) return

    // The player who just finished their turn is oldId
    if (oldId) {
      justActedPlayerId.value = oldId
      // Clear the highlight after the animation duration (1s)
      setTimeout(() => {
        if (justActedPlayerId.value === oldId) {
          justActedPlayerId.value = null
        }
      }, 1000)
    }

    // Wait 1 second before reordering to keep the actor at the top during feedback
    setTimeout(() => {
      delayedActivePlayerId.value = newId
    }, 1000)
  },
  { immediate: true },
)

const sortedPlayers = computed(() => {
  const list = [...props.players]
  const activeIdx = list.findIndex((p) => p.id === delayedActivePlayerId.value)
  if (activeIdx > 0) {
    const [activePlayer] = list.splice(activeIdx, 1)
    list.unshift(activePlayer)
  }
  return list
})

const getActionColor = (action) => {
  const a = action.toLowerCase()
  if (a.includes('fold')) return 'text-red-400 border-red-500/20 bg-red-500/10'
  if (a.includes('raise') || a.includes('bet'))
    return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
  if (a.includes('call'))
    return 'text-blue-400 border-blue-500/20 bg-blue-600/10'
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

#sidepanel-players-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
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

/* Action Flash Animation */
@keyframes action-flash-green {
  0% {
    color: #4ade80;
    border-color: #4ade80;
    background-color: rgba(74, 222, 128, 0.2);
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(74, 222, 128, 0.4);
  }
  80% {
    color: #4ade80;
    border-color: #4ade80;
    background-color: rgba(74, 222, 128, 0.2);
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.animate-action-flash {
  animation: action-flash-green 1s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Action Transition */
.action-highlight-enter-active {
  transition: all 0.3s ease-out;
}
.action-highlight-leave-active {
  transition: all 0.2s ease-in;
}
.action-highlight-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.9);
}
.action-highlight-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}
</style>
