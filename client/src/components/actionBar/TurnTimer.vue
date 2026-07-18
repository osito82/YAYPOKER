<template>
  <div
    v-if="isMyTurn && progress > 0"
    :id="'hud-turn-timer-progress-bar-wrapper-' + templateSuffix"
    class="w-full h-[3px] bg-black/50 relative overflow-hidden"
  >
    <div
      :id="'hud-turn-timer-progress-bar-fill-' + templateSuffix"
      class="h-full transition-all duration-100 ease-linear timer-bar"
      :class="{
        'timer-bar--urgent': progress < 30,
        'timer-bar--warn': progress >= 30 && progress < 60,
        'timer-bar--ok': progress >= 60,
      }"
      :style="{ width: `${progress}%` }"
    >
      <div
        :id="`hud-turn-timer-glow-effect-${templateSuffix}`"
        class="absolute right-0 top-0 h-full w-4 timer-glow"
      ></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isMyTurn: Boolean,
  progress: Number,
  templateSuffix: String,
})
</script>

<style scoped>
.timer-bar {
  position: relative;
}

.timer-bar--ok {
  background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
}
.timer-bar--warn {
  background: linear-gradient(90deg, #ca8a04 0%, #eab308 100%);
}
.timer-bar--urgent {
  background: linear-gradient(90deg, #991b1b 0%, #ef4444 100%);
  animation: pulse-red 0.6s ease-in-out infinite;
}

.timer-glow {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4));
  pointer-events: none;
}

@keyframes pulse-red {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
