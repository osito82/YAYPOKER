<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        @click.self="$emit('cancel')"
      >
        <div
          class="bg-[#0e0e0e] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl"
        >
          <div class="text-center mb-6">
            <div
              class="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 class="text-lg font-black text-white mb-2">
              {{ title }}
            </h3>
            <p class="text-sm text-gray-400 leading-relaxed">
              {{ message }}
            </p>
          </div>
          <div class="flex gap-3">
            <button
              @click="$emit('cancel')"
              class="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold text-sm uppercase tracking-wider hover:bg-white/10 active:scale-95 transition-all"
            >
              {{ $t('game.leave_cancel') }}
            </button>
            <button
              @click="$emit('confirm')"
              class="flex-1 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm uppercase tracking-wider hover:bg-red-500/20 active:scale-95 transition-all"
            >
              {{ $t('game.leave_confirm_btn') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: Boolean,
  title: String,
  message: String,
})

defineEmits(['confirm', 'cancel'])
</script>
