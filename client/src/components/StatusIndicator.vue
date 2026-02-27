<template>
  <div class="flex items-center">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-4 opacity-0"
      mode="out-in"
    >
      <div
        v-if="isMyTurn"
        class="flex items-center px-4 py-2 bg-yellow-500/10 rounded-full border border-yellow-500/30"
      >
        <div
          class="w-2 h-2 bg-yellow-500 rounded-full mr-3 animate-pulse shadow-[0_0_10px_rgba(234,179,8,1)]"
        ></div>
        <span
          class="text-xs font-black text-yellow-500 uppercase tracking-widest italic"
          >IT'S YOUR TURN</span
        >
      </div>
      <div
        v-else
        class="flex items-center px-4 py-2 bg-white/5 rounded-full border border-white/10"
      >
        <svg
          class="animate-spin h-3 w-3 text-gray-500 mr-3"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span
          class="text-[10px] text-gray-500 font-bold uppercase tracking-widest"
          >Waiting for others...</span
        >
      </div>
    </Transition>
  </div>
</template>

<script setup>
defineProps({
  isMyTurn: Boolean,
})
</script>
