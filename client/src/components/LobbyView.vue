<template>
  <div
    :id="`lobby-view-container-${templateSuffix}`"
    class="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 select-none"
  >
    <div
      :id="`lobby-main-card-${templateSuffix}`"
      class="w-full max-w-lg bg-gray-900 rounded-[2.5rem] shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden border border-white/5 animate-fade-in"
    >
      <!-- Header Area -->
      <div
        :id="`lobby-card-header-${templateSuffix}`"
        class="bg-black/40 p-10 flex flex-col items-center border-b border-white/5 relative"
      >
        <Logo :id="`lobby-brand-logo-${templateSuffix}`" class="mb-8 transform scale-150" />
        
        <div :id="`game-code-badge-wrapper-${templateSuffix}`" class="relative group">
          <div 
            :id="`game-code-display-badge-${templateSuffix}`"
            class="bg-yellow-500/10 border border-yellow-500/20 px-6 py-2 rounded-full mb-4 cursor-pointer hover:bg-yellow-500/20 transition-all active:scale-95"
            @click="copyCode"
          >
            <span :id="`game-code-label-${templateSuffix}`" class="text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em] mr-2">Table Code:</span>
            <span :id="`game-code-value-${templateSuffix}`" class="text-yellow-500 font-mono font-black tracking-widest text-lg">{{ gameCode }}</span>
          </div>
          <!-- Tooltip -->
          <div 
            v-if="copyStatus === 'Copied!'"
            :id="`copy-status-tooltip-${templateSuffix}`"
            class="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest shadow-xl animate-bounce"
          >
            Copied!
          </div>
        </div>

        <h2
          :id="`lobby-title-text-${templateSuffix}`"
          class="text-gray-200 text-xl font-black uppercase tracking-[0.4em] italic mt-2"
        >
          Waiting <span class="text-yellow-500">Room</span>
        </h2>
      </div>

      <!-- Player List Area -->
      <div :id="`players-list-container-${templateSuffix}`" class="p-8 space-y-6">
        <div :id="`players-header-info-${templateSuffix}`" class="flex justify-between items-center px-2">
          <h3 :id="`players-count-label-${templateSuffix}`" class="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">
            Players Connected ({{ players.length }}/10)
          </h3>
          <div :id="`players-status-indicator-${templateSuffix}`" class="flex items-center gap-2">
             <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
             <span class="text-[9px] font-black text-green-500/80 uppercase tracking-widest">Live Updates</span>
          </div>
        </div>

        <div :id="`players-list-scroller-${templateSuffix}`" class="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          <div 
            v-for="player in players" 
            :key="player.id"
            :id="`player-item-row-${player.id}-${templateSuffix}`"
            class="group flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-all hover:translate-x-1"
            :class="{ 'border-yellow-500/30 bg-yellow-500/5': player.id === hostId }"
          >
            <div :id="`player-identity-wrapper-${player.id}-${templateSuffix}`" class="flex items-center gap-4">
              <div 
                :id="`player-avatar-circle-${player.id}-${templateSuffix}`"
                class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                :class="player.id === hostId ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400 border border-white/5'"
              >
                {{ player.name.charAt(0).toUpperCase() }}
              </div>
              <div :id="`player-name-labels-${player.id}-${templateSuffix}`" class="flex flex-col">
                <span 
                  :id="`player-display-name-${player.id}-${templateSuffix}`"
                  class="font-bold text-base tracking-tight"
                  :class="player.id === myId ? 'text-white' : 'text-gray-300'"
                >
                  {{ player.name }}
                  <span v-if="player.id === myId" class="text-[10px] text-yellow-500/50 ml-1 font-black">YOU</span>
                </span>
                <span 
                  v-if="player.id === hostId" 
                  :id="`player-role-badge-${player.id}-${templateSuffix}`"
                  class="text-[9px] font-black text-yellow-600 uppercase tracking-widest"
                >
                  Table Host
                </span>
              </div>
            </div>

            <div :id="`player-connectivity-status-${player.id}-${templateSuffix}`" class="flex items-center gap-2">
              <span 
                :id="`connectivity-status-text-${player.id}-${templateSuffix}`"
                class="text-[9px] font-black uppercase tracking-widest"
                :class="player.connected ? 'text-green-500' : 'text-red-500'"
              >
                {{ player.connected ? 'Ready' : 'Lost' }}
              </span>
              <div 
                :id="`connectivity-dot-${player.id}-${templateSuffix}`"
                class="w-1.5 h-1.5 rounded-full"
                :class="player.connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Area -->
      <div
        :id="`lobby-actions-footer-${templateSuffix}`"
        class="bg-black/60 p-8 border-t border-white/5"
      >
        <div v-if="isHost" :id="`host-controls-wrapper-${templateSuffix}`" class="space-y-4">
          <p 
            v-if="players.length < 2" 
            :id="`waiting-players-warning-${templateSuffix}`"
            class="text-yellow-500/70 text-[10px] text-center font-black uppercase tracking-[0.2em] italic animate-pulse"
          >
            Need at least 2 players to start the match
          </p>
          <button 
            :id="`start-game-submit-button-${templateSuffix}`"
            @click="$emit('start')" 
            :disabled="players.length < 2"
            class="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black py-5 rounded-2xl focus:outline-none transition-all transform hover:-translate-y-1 active:scale-95 shadow-2xl uppercase tracking-[0.2em] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed text-base"
          >
            Deal First Hand
          </button>
        </div>
        
        <div v-else :id="`guest-waiting-view-${templateSuffix}`" class="flex flex-col items-center py-4 space-y-4">
          <div :id="`waiting-loader-animation-${templateSuffix}`" class="flex gap-1.5">
            <div class="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div class="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div class="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
          </div>
          <p :id="`waiting-host-message-${templateSuffix}`" class="text-gray-400 text-xs font-black uppercase tracking-[0.2em] italic">
            Waiting for Host to Start...
          </p>
        </div>
      </div>
    </div>

    <!-- Footer Attribution -->
    <p :id="`lobby-copyright-footer-${templateSuffix}`" class="mt-10 text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">
      &copy; 2026 <span class="text-yellow-500/50">OsoPoker</span> Engineering
    </p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import Logo from './Logo.vue'

const props = defineProps({
  players: { type: Array, required: true },
  hostId: { type: String, default: null },
  myId: { type: String, default: null },
  gameCode: { type: String, required: true },
  templateSuffix: { type: String, default: 'Lobby' }
})

const isHost = computed(() => props.myId === props.hostId)
const copyStatus = ref('')

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.gameCode)
    copyStatus.value = 'Copied!'
    setTimeout(() => {
      copyStatus.value = ''
    }, 2000)
  } catch (err) {
    // Fallback or error handling
  }
}

defineEmits(['start'])
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(234, 179, 8, 0.2);
}
</style>
