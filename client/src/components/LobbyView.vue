<template>
  <div
    :id="`lobby-view-container-${templateSuffix}`"
    class="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 select-none"
  >
    <div
      :id="`lobby-main-card-${templateSuffix}`"
      class="w-full bg-gray-900 shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden border border-white/5 animate-fade-in"
      :class="cardClasses"
    >
      <!-- Header Area -->
      <div
        :id="`lobby-card-header-${templateSuffix}`"
        class="bg-black/40 flex flex-col items-center border-b border-white/5 relative"
        :class="headerPadding"
      >
        <Logo :id="`lobby-brand-logo-${templateSuffix}`" :class="logoScale" />

        <div
          :id="`generated-table-code-display-box-${templateSuffix}`"
          class="flex flex-col items-center gap-4 mb-4"
        >
          <div
            :id="`qr-code-container-${templateSuffix}`"
            class="bg-white p-3 rounded-2xl shadow-2xl border-4 border-yellow-500/20 group hover:border-yellow-500/40 transition-all duration-500"
          >
            <qrCode :width="qrSize" :height="qrSize" :gameCode="gameCode" />
          </div>

          <div
            :id="`game-code-copy-wrapper-${templateSuffix}`"
            class="relative"
          >
            <div
              :id="`game-code-copy-button-${templateSuffix}`"
              class="bg-yellow-500/10 border border-yellow-500/20 rounded-full cursor-pointer hover:bg-yellow-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 group"
              :class="badgePadding"
              @click="copyToClipboard"
            >
              <span
                :id="`game-code-label-${templateSuffix}`"
                class="font-black text-yellow-600 uppercase tracking-[0.2em]"
                :class="badgeLabelSize"
                >Table Code:</span
              >
              <span
                :id="`game-code-value-${templateSuffix}`"
                class="text-yellow-500 font-mono font-black tracking-widest"
                :class="badgeValueSize"
                >{{ gameCode }}</span
              >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 text-yellow-500/50 group-hover:text-yellow-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <!-- Tooltip -->
            <div
              v-if="copyStatus === 'Copied!'"
              :id="`copy-status-tooltip-${templateSuffix}`"
              class="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-widest shadow-2xl animate-bounce z-10 whitespace-nowrap"
            >
              Copied!
            </div>
          </div>
        </div>

        <h2
          :id="`lobby-title-text-${templateSuffix}`"
          class="text-gray-200 font-black uppercase italic mt-2 text-center"
          :class="subtitleSize"
        >
          Waiting <span class="text-yellow-500">Room</span>
        </h2>
      </div>

      <!-- Player List Area -->
      <div
        :id="`players-list-container-${templateSuffix}`"
        class="space-y-6"
        :class="playersListPadding"
      >
        <div
          :id="`players-header-info-${templateSuffix}`"
          class="flex justify-between items-center px-2"
        >
          <h3
            :id="`players-count-label-${templateSuffix}`"
            class="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]"
          >
            Players Connected ({{ players.length }}/10)
          </h3>
          <div
            :id="`players-status-indicator-${templateSuffix}`"
            class="flex items-center gap-2"
          >
            <div
              class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"
            ></div>
            <span
              class="text-[9px] font-black text-green-500/80 uppercase tracking-widest"
              >Live Updates</span
            >
          </div>
        </div>

        <div
          :id="`players-list-scroller-${templateSuffix}`"
          class="space-y-3 overflow-y-auto pr-2 custom-scrollbar"
          :style="{ maxHeight: scrollHeight }"
        >
          <div
            v-for="player in players"
            :key="player.id"
            :id="`player-item-row-${player.id}-${templateSuffix}`"
            class="group flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-all hover:translate-x-1"
            :class="{
              'border-yellow-500/30 bg-yellow-500/5': player.id === hostId,
            }"
          >
            <div
              :id="`player-identity-wrapper-${player.id}-${templateSuffix}`"
              class="flex items-center gap-4"
            >
              <div
                :id="`player-avatar-circle-${player.id}-${templateSuffix}`"
                class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                :class="
                  player.id === hostId
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-gray-400 border border-white/5'
                "
              >
                {{ player.name.charAt(0).toUpperCase() }}
              </div>
              <div
                :id="`player-name-labels-${player.id}-${templateSuffix}`"
                class="flex flex-col"
              >
                <span
                  :id="`player-display-name-${player.id}-${templateSuffix}`"
                  class="font-bold text-base tracking-tight"
                  :class="player.id === myId ? 'text-white' : 'text-gray-300'"
                >
                  {{ player.name }}
                  <span
                    v-if="player.id === myId"
                    class="text-[10px] text-yellow-500/50 ml-1 font-black"
                    >YOU</span
                  >
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

            <div
              :id="`player-connectivity-status-${player.id}-${templateSuffix}`"
              class="flex items-center gap-2"
            >
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
                :class="
                  player.connected
                    ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                    : 'bg-red-500'
                "
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Area -->
      <div
        :id="`lobby-actions-footer-${templateSuffix}`"
        class="bg-black/60 border-t border-white/5"
        :class="footerPadding"
      >
        <div
          v-if="isHost"
          :id="`host-controls-wrapper-${templateSuffix}`"
          class="space-y-4"
        >
          <!-- Bot Selection (Conditional) -->
          <div
            v-if="botsEnabled"
            :id="`bot-selection-container-${templateSuffix}`"
            class="flex flex-col gap-2 mb-4 bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/10"
          >
            <label
              class="text-yellow-500/80 text-[10px] font-black uppercase tracking-widest"
            >
              Add AI Bots to Table (Max 10 players total)
            </label>
            <select
              v-model="botCount"
              class="bg-black/60 text-white border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-yellow-500/50"
            >
              <option
                v-for="n in maxSelectableBots"
                :key="n - 1"
                :value="n - 1"
              >
                {{
                  n - 1 === 0
                    ? 'No Bots'
                    : n - 1 + (n - 1 === 1 ? ' Bot' : ' Bots')
                }}
              </option>
            </select>
          </div>

          <p
            v-if="players.length + botCount < 2"
            :id="`waiting-players-warning-${templateSuffix}`"
            class="text-yellow-500/70 text-[10px] text-center font-black uppercase tracking-[0.2em] italic animate-pulse"
          >
            Need at least 2 players to start the match
          </p>
          <button
            :id="`start-game-submit-button-${templateSuffix}`"
            @click="$emit('start', { bots: botCount })"
            :disabled="players.length + botCount < 2"
            class="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black py-5 rounded-2xl focus:outline-none transition-all transform hover:-translate-y-1 active:scale-95 shadow-2xl uppercase tracking-[0.2em] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed text-base"
          >
            Deal First Hand
          </button>
        </div>

        <div
          v-else
          :id="`guest-waiting-view-${templateSuffix}`"
          class="flex flex-col items-center py-4 space-y-4"
        >
          <div
            :id="`waiting-loader-animation-${templateSuffix}`"
            class="flex gap-1.5"
          >
            <div
              class="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.3s]"
            ></div>
            <div
              class="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]"
            ></div>
            <div
              class="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
            ></div>
          </div>
          <p
            :id="`waiting-host-message-${templateSuffix}`"
            class="text-gray-400 text-xs font-black uppercase tracking-[0.2em] italic text-center"
          >
            Waiting for Host to Start...
          </p>
        </div>
      </div>
    </div>

    <!-- Footer Attribution -->
    <p
      :id="`lobby-copyright-footer-${templateSuffix}`"
      class="mt-10 text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]"
    >
      &copy; 2026 <span class="text-yellow-500/50">YayPoker</span> Engineering
    </p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'
import { urlsFactory, copyToClipboard as copyToClipboardUtil } from '../vutils'
import Logo from './Logo.vue'
import qrCode from './qrCode.vue'

const props = defineProps({
  players: { type: Array, required: true },
  hostId: { type: String, default: null },
  myId: { type: String, default: null },
  gameCode: { type: String, required: true },
  templateSuffix: { type: String, default: 'TemplateLarge' },
})

const responsive = useResponsiveStore()
const isHost = computed(() => props.myId === props.hostId)
const copyStatus = ref('')
const botCount = ref(0)

// Check if bots are enabled from environment
const botsEnabled = computed(() => {
  return import.meta.env.VITE_BOTS === 'true'
})

// Max bots logic: total players (humans + bots) cannot exceed 10
const maxSelectableBots = computed(() => {
  const humanCount = props.players.length
  const availableSlots = Math.max(0, 10 - humanCount)
  return availableSlots + 1 // +1 for the 0 option
})

const qrSize = computed(() => {
  const size = responsive.screenSize
  if (size === 'xsmall') return 120
  if (size === 'small') return 160
  return 200
})

const shareUrl = computed(() => {
  const urls = urlsFactory()
  return `${urls.url}/join/${props.gameCode}`
})

const copyToClipboard = async () => {
  const success = await copyToClipboardUtil(shareUrl.value)
  if (success) {
    copyStatus.value = 'Copied!'
    setTimeout(() => {
      copyStatus.value = ''
    }, 2000)
  }
}

defineEmits(['start'])

// Responsive Computeds
const cardClasses = computed(() => {
  const size = responsive.screenSize
  if (size === 'xsmall') return 'max-w-full rounded-[1.5rem]'
  if (size === 'small') return 'max-w-[400px] rounded-[2rem]'
  return 'max-w-lg rounded-[2.5rem]'
})

const headerPadding = computed(() => {
  const size = responsive.screenSize
  if (size === 'xsmall') return 'p-6'
  if (size === 'small') return 'p-8'
  return 'p-10'
})

const playersListPadding = computed(() => {
  const size = responsive.screenSize
  if (size === 'xsmall') return 'p-4'
  if (size === 'small') return 'p-6'
  return 'p-8'
})

const footerPadding = computed(() => {
  const size = responsive.screenSize
  if (size === 'xsmall') return 'p-4'
  if (size === 'small') return 'p-6'
  return 'p-8'
})

const logoScale = computed(() => {
  const size = responsive.screenSize
  if (size === 'xsmall') return 'mb-4 scale-100'
  if (size === 'small') return 'mb-6 scale-125'
  return 'mb-8 scale-150'
})

const subtitleSize = computed(() => {
  const size = responsive.screenSize
  if (size === 'xsmall') return 'text-sm tracking-[0.2em]'
  if (size === 'small') return 'text-base tracking-[0.3em]'
  return 'text-xl tracking-[0.4em]'
})

const scrollHeight = computed(() => {
  const size = responsive.screenSize
  if (size === 'xsmall') return '200px'
  if (size === 'small') return '250px'
  return '300px'
})

const badgePadding = computed(() => {
  const size = responsive.screenSize
  if (size === 'xsmall') return 'px-3 py-1 mb-2'
  if (size === 'small') return 'px-4 py-1.5 mb-3'
  return 'px-6 py-2 mb-4'
})

const badgeLabelSize = computed(() => {
  const size = responsive.screenSize
  if (size === 'xsmall') return 'text-[8px]'
  if (size === 'small') return 'text-[9px]'
  return 'text-[10px]'
})

const badgeValueSize = computed(() => {
  const size = responsive.screenSize
  if (size === 'xsmall') return 'text-sm'
  if (size === 'small') return 'text-base'
  return 'text-lg'
})
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
