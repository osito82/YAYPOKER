<script setup>
/**
 * "Tico heart": a heart filled with the Costa Rica flag stripes.
 * Decorative but accessible (role="img" + label); honors reduced motion.
 * Ported from sociablesquad (components/shared/TicoHeart.vue).
 */
defineProps({
  id: { type: String, default: 'tico-heart' },
  size: { type: Number, default: 16 },
  label: { type: String, default: 'Pura vida' },
  animated: { type: Boolean, default: true },
})
</script>

<template>
  <svg
    :id="id"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    role="img"
    :aria-label="label"
    class="tico-heart"
    :class="{ 'tico-heart--animated': animated }"
    focusable="false"
  >
    <title>{{ label }}</title>
    <defs>
      <clipPath :id="`${id}-clip`">
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </clipPath>
    </defs>
    <!-- Costa Rica flag: blue, white, red (double), white, blue -->
    <g :clip-path="`url(#${id}-clip)`">
      <rect x="0" y="0" width="24" height="4" fill="#002B7F" />
      <rect x="0" y="4" width="24" height="4" fill="#FFFFFF" />
      <rect x="0" y="8" width="24" height="8" fill="#CE1126" />
      <rect x="0" y="16" width="24" height="4" fill="#FFFFFF" />
      <rect x="0" y="20" width="24" height="4" fill="#002B7F" />
    </g>
  </svg>
</template>

<style scoped>
.tico-heart {
  display: inline-block;
  vertical-align: middle;
  filter: drop-shadow(0 0 2px rgba(0, 43, 127, 0.5));
}
.tico-heart--animated {
  animation: tico-heartbeat 1.8s ease-in-out infinite;
  transform-origin: center;
}
@keyframes tico-heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  15% {
    transform: scale(1.18);
  }
  30% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.12);
  }
  60% {
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .tico-heart--animated {
    animation: none;
  }
}
</style>
