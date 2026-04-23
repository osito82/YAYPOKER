<template>
  <div
    :id="'message-terminal-' + templateSuffix"
    class="w-full h-full transition-colors duration-300"
  >
    <div
      :id="'terminal-container-' + templateSuffix"
      class="w-full h-full flex flex-col overflow-hidden bg-white/90 dark:bg-[#020402]/85 backdrop-blur-xl"
    >
      <!-- Terminal header bar -->
      <div
        :id="'terminal-header-' + templateSuffix"
        class="flex items-center gap-2 px-4 py-2 shrink-0 bg-gray-100/50 dark:bg-black/40 border-b border-gray-200 dark:border-white/5"
      >
        <div :id="'terminal-window-controls-' + templateSuffix" class="flex gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
        </div>
        <span
          :id="'terminal-title-' + templateSuffix"
          class="text-[9px] font-mono font-bold text-gray-400 dark:text-white/20 uppercase tracking-widest ml-2"
          >Game Log</span
        >
        <div :id="'terminal-live-badge-' + templateSuffix" class="ml-auto flex items-center gap-1">
          <div
            class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"
          ></div>
          <span
            class="text-[8px] font-mono text-green-600 dark:text-green-500/60 uppercase"
            >Live</span
          >
        </div>
      </div>

      <!-- Terminal body -->
      <div
        ref="logContainer"
        :id="'terminal-body-scroller-' + templateSuffix"
        class="flex-grow overflow-y-auto p-4 lg:p-6 font-mono text-xs lg:text-sm space-y-1.5 scrollbar-thin dark:scrollbar-thumb-white/20 scrollbar-thumb-gray-300 scroll-smooth"
      >
        <TransitionGroup
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-x-4"
          enter-to-class="opacity-100 translate-x-0"
        >
          <div
            v-for="log in logs"
            :key="log.id"
            :id="'terminal-log-item-' + log.id + '-' + templateSuffix"
            class="flex gap-2 items-start leading-tight py-0.5 border-b border-gray-100 dark:border-white/[0.02] last:border-0"
          >
            <span
              :id="'terminal-log-time-' + log.id + '-' + templateSuffix"
              class="text-yellow-600 dark:text-yellow-500/50 font-bold shrink-0 text-[10px] mt-0.5"
              >[{{ formatTime(log.id) }}]</span
            >
            <span
              :id="'terminal-log-arrow-' + log.id + '-' + templateSuffix"
              class="text-yellow-600 dark:text-yellow-400 font-black shrink-0"
              >»</span
            >
            <div :id="'terminal-log-content-' + log.id + '-' + templateSuffix" class="flex flex-wrap gap-1 items-center">
              <span
                :id="'terminal-log-emoji-' + log.id + '-' + templateSuffix"
                class="text-lg leading-none shrink-0">{{
                getEmoji(log)
              }}</span>
              <span
                :id="'terminal-log-text-' + log.id + '-' + templateSuffix"
                class="font-bold tracking-tight break-words transition-colors"
                :class="[
                  log.type === 'private'
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-gray-800 dark:text-gray-100',
                ]"
              >
                {{ cleanText(log.text) }}
              </span>
            </div>
          </div>
        </TransitionGroup>

        <!-- Empty State -->
        <div
          v-if="logs.length === 0"
          :id="'terminal-empty-state-' + templateSuffix"
          class="text-gray-400 dark:text-gray-600 font-bold italic animate-pulse flex items-center gap-2"
        >
          <span class="text-yellow-600 dark:text-yellow-400">»</span>
          {{ $t('game.system_ready') }}
        </div>

        <!-- Bottom anchor for auto-scroll -->
        <div ref="bottomAnchor" :id="'terminal-scroll-anchor-' + templateSuffix" class="h-px w-full"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, computed } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'
import { cleanPlayerName } from '../vutils'

const responsive = useResponsiveStore()
const templateSuffix = computed(() => {
  const size = responsive.screenSize
  return 'Template' + size.charAt(0).toUpperCase() + size.slice(1)
})

const props = defineProps({
  logs: {
    type: Array,
    default: () => [],
  },
})

const logContainer = ref(null)
const bottomAnchor = ref(null)

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

const cleanText = (text) => {
  if (!text) return ''
  // Strip _Bot or _ia (case insensitive) and replace underscores with spaces
  return text.replace(/(_Bot|_ia)/gi, '').replace(/_+/g, ' ').trim()
}

const getEmoji = (log) => {
  const text = log.text.toLowerCase()
  const action = (log.action || '').toLowerCase()

  if (action === 'winnertournament' || text.includes('wins the tournament'))
    return '🏆'
  if (action === 'winner' || text.includes('wins $')) return '💰'
  if (action === 'fold' || text.includes('folded')) return '🏳️'
  if (action === 'setbet' || text.includes('bets')) return '💵'
  if (action === 'setrise' || text.includes('raises')) return '🔥'
  if (action === 'setcall' || text.includes('calls')) return '🤝'
  if (action === 'setcheck' || text.includes('checks')) return '👀'
  if (text.includes('welcome')) return '👋'
  if (text.includes('cards dealt')) return '🃏'
  if (text.includes('dealer deals')) return '⚙️'
  if (text.includes('disconnected')) return '🔌'
  if (text.includes('reconnected')) return '♻️'
  if (text.includes('all-in')) return '🚀'

  return '💬'
}

const scrollToBottom = async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
}

// Auto-scroll to bottom when new logs arrive
watch(() => props.logs.length, scrollToBottom)

onMounted(scrollToBottom)
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  border-radius: 10px;
}
</style>
