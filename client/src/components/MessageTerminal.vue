<template>
  <div id="message-terminal" class="w-full h-full">
    <div
      id="terminal-container"
      class="terminal-bg w-full h-full flex flex-col overflow-hidden"
    >
      <!-- Terminal header bar -->
      <div class="terminal-header flex items-center gap-2 px-4 py-2 shrink-0">
        <div class="flex gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
        </div>
        <span
          class="text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest ml-2"
          >Game Log</span
        >
        <div class="ml-auto flex items-center gap-1">
          <div
            class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"
          ></div>
          <span class="text-[8px] font-mono text-green-500/60 uppercase"
            >Live</span
          >
        </div>
      </div>

      <!-- Terminal body -->
      <div
        ref="logContainer"
        class="flex-grow overflow-y-auto p-4 lg:p-6 font-mono text-xs lg:text-sm space-y-1.5 scrollbar-thin scrollbar-thumb-white/20 scroll-smooth"
      >
        <TransitionGroup
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-x-4"
          enter-to-class="opacity-100 translate-x-0"
        >
          <div
            v-for="log in logs"
            :key="log.id"
            class="flex gap-2 items-start leading-tight py-0.5 border-b border-white/[0.02] last:border-0"
          >
            <span
              class="text-yellow-500/50 font-bold shrink-0 text-[10px] mt-0.5"
              >[{{ formatTime(log.id) }}]</span
            >
            <span class="text-yellow-400 font-black shrink-0">»</span>
            <div class="flex flex-wrap gap-1 items-center">
              <span class="text-lg leading-none shrink-0">{{
                getEmoji(log)
              }}</span>
              <span
                class="font-bold tracking-tight break-words"
                :class="[
                  log.type === 'private' ? 'text-cyan-400' : 'text-gray-100',
                ]"
              >
                {{ log.text }}
              </span>
            </div>
          </div>
        </TransitionGroup>

        <!-- Empty State -->
        <div
          v-if="logs.length === 0"
          class="text-gray-600 font-bold italic animate-pulse flex items-center gap-2"
        >
          <span class="text-yellow-400">»</span> SYSTEM_READY: Waiting for game
          events... 📡
        </div>

        <!-- Bottom anchor for auto-scroll -->
        <div ref="bottomAnchor" class="h-px w-full"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'

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
.terminal-bg {
  background: rgba(2, 4, 2, 0.85);
  backdrop-filter: blur(12px);
}

.terminal-header {
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
