<template>
  <div
    v-if="isMyTurn && progress > 0"
    :id="'hud-turn-timer-progress-bar-wrapper-' + templateSuffix"
    class="w-full h-1 bg-gray-900/40 backdrop-blur-sm"
  >
    <div
      :id="'hud-turn-timer-progress-bar-fill-' + templateSuffix"
      class="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(234,179,8,0.3)]"
      :style="{ width: `${progress}%` }"
    ></div>
  </div>
</template>

<script setup>
defineProps({
  isMyTurn: Boolean,
  progress: Number,
  templateSuffix: String,
})
</script>
