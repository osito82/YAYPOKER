<template>
  <div
    id="message-terminal"
    class="w-full max-w-4xl mx-auto px-4"
  >
    <div
      id="terminal-container"
      class="bg-black/40 backdrop-blur-md border border-white/5 rounded-lg overflow-hidden flex flex-col h-24 lg:h-32 shadow-inner"
    >
      <!-- Terminal Header -->
      <div class="flex items-center justify-between px-3 py-1 bg-white/5 border-b border-white/5">
        <div class="flex gap-1.5">
          <div class="w-2 h-2 rounded-full bg-red-500/50"></div>
          <div class="w-2 h-2 rounded-full bg-yellow-500/50"></div>
          <div class="w-2 h-2 rounded-full bg-green-500/50"></div>
        </div>
        <span class="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Live Event Log</span>
      </div>

      <!-- Terminal Body -->
      <div
        ref="logContainer"
        class="flex-grow overflow-y-auto p-3 font-mono text-[11px] lg:text-xs space-y-1 scrollbar-thin scrollbar-thumb-white/10"
      >
        <TransitionGroup
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 -translate-x-2"
          enter-to-class="opacity-100 translate-x-0"
        >
          <div
            v-for="log in logs"
            :key="log.id"
            class="flex gap-2 items-start"
          >
            <span class="text-yellow-500/50 shrink-0">>></span>
            <span :class="[log.type === 'private' ? 'text-blue-400' : 'text-gray-300']">
              {{ log.text }}
            </span>
          </div>
        </TransitionGroup>

        <!-- Empty State -->
        <div v-if="logs.length === 0" class="text-gray-600 italic">
          Initializing secure connection...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  }
})

const logContainer = ref(null)

// Auto-scroll to bottom when new logs arrive
watch(() => props.logs.length, async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
})
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
</style>
