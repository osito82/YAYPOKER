<template>
  <div class="heart-container" @click="latir">
    <svg viewBox="0 0 680 580" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="heartClip">
          <path
            d="M340 490 Q110 365 75 210 Q50 95 135 55 Q210 15 275 85 Q308 115 340 148 Q372 115 405 85 Q470 15 545 55 Q630 95 605 210 Q570 365 340 490 Z"
          />
        </clipPath>
      </defs>

      <g clip-path="url(#heartClip)">
        <!-- stripes -->
        <rect x="0" y="0" width="680" height="580" fill="#B31942" />
        <rect x="0" y="44" width="680" height="44" fill="#fff" />
        <rect x="0" y="132" width="680" height="44" fill="#fff" />
        <rect x="0" y="220" width="680" height="44" fill="#fff" />
        <rect x="0" y="308" width="680" height="44" fill="#fff" />
        <rect x="0" y="396" width="680" height="44" fill="#fff" />
        <rect x="0" y="484" width="680" height="44" fill="#fff" />

        <!-- blue -->
        <rect x="0" y="0" width="280" height="330" fill="#0A3161" />

        <!-- stars -->
        <g fill="#fff" font-size="34" text-anchor="middle">
          <text x="26" y="48">★</text>
          <text x="82" y="48">★</text>
          <text x="138" y="48">★</text>
          <text x="194" y="48">★</text>
          <text x="250" y="48">★</text>
          <text x="54" y="90">★</text>
          <text x="110" y="90">★</text>
          <text x="166" y="90">★</text>
          <text x="222" y="90">★</text>
          <text x="26" y="132">★</text>
          <text x="82" y="132">★</text>
          <text x="138" y="132">★</text>
          <text x="194" y="132">★</text>
          <text x="250" y="132">★</text>
          <text x="54" y="174">★</text>
          <text x="110" y="174">★</text>
          <text x="166" y="174">★</text>
          <text x="222" y="174">★</text>
          <text x="26" y="216">★</text>
          <text x="82" y="216">★</text>
          <text x="138" y="216">★</text>
          <text x="194" y="216">★</text>
          <text x="250" y="216">★</text>
          <text x="54" y="258">★</text>
          <text x="110" y="258">★</text>
          <text x="166" y="258">★</text>
          <text x="222" y="258">★</text>
          <text x="26" y="300">★</text>
          <text x="82" y="300">★</text>
          <text x="138" y="300">★</text>
          <text x="194" y="300">★</text>
          <text x="250" y="300">★</text>
          <text x="54" y="330">★</text>
          <text x="110" y="330">★</text>
          <text x="166" y="330">★</text>
          <text x="222" y="330">★</text>
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup>
const latir = (e) => {
  const el = e.currentTarget
  el.style.animation = 'none'
  void el.offsetWidth
  el.style.animation = 'latir 0.55s ease-in-out'
}
</script>

<style scoped>
.heart-container {
  width: 220px;
  cursor: pointer;
  animation: latir 1.3s infinite ease-in-out;
  transition: transform 0.2s;
}

.heart-container:hover {
  transform: scale(1.08);
}

@keyframes latir {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

svg {
  width: 100%;
  height: auto;
  display: block;
}
</style>
