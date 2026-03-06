<template>
  <div
    id="message-terminal"
    class="w-full h-full"
  >
    <div
      id="terminal-container"
      class="bg-black/60 backdrop-blur-md w-full h-full flex flex-col shadow-inner"
    >
      <!-- Terminal Body (No Header, Full Width) -->
      <div
        ref="logContainer"
        class="flex-grow overflow-y-auto p-4 lg:p-6 font-mono text-sm lg:text-base space-y-2 scrollbar-thin scrollbar-thumb-white/20"
      >
        <TransitionGroup
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-x-4"
          enter-to-class="opacity-100 translate-x-0"
        >
          <div
            v-for="log in logs"
            :key="log.id"
            class="flex gap-3 items-start leading-tight"
          >
            <span class="text-yellow-400 font-bold shrink-0">>></span>
            <span 
              class="font-bold tracking-tight"
              :class="[log.type === 'private' ? 'text-blue-300' : 'text-white']"
            >
              {{ log.text }}
            </span>
          </div>
        </TransitionGroup>

        <!-- Empty State -->
        <div v-if="logs.length === 0" class="text-gray-500 font-bold italic animate-pulse">
          >> SYSTEM_READY: Waiting for game events...
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
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}
</style>
