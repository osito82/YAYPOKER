<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-4 opacity-0 scale-95"
    enter-to-class="translate-y-0 opacity-100 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100 scale-100"
    leave-to-class="translate-y-4 opacity-0 scale-95"
  >
    <div
      v-if="message"
      id="game-toast-container"
      class="flex justify-center w-full pointer-events-none"
    >
      <div
        id="game-toast-content"
        class="bg-black/60 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-3"
      >
        <div
          id="toast-pulse"
          class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.6)]"
        ></div>
        <span
          id="toast-message"
          class="text-xs lg:text-sm font-black text-gray-100 uppercase tracking-[0.15em] italic"
        >
          {{ message }}
        </span>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: '',
  },
})
</script>
