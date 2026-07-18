<template>
  <div
    :id="'poker-table-viewport-' + templateSuffix"
    class="w-full h-full relative overflow-hidden flex items-center justify-center"
    style="background: #050505"
  >
    <!-- Ambient room glow -->
    <div
      :id="'ambient-room-glow-' + templateSuffix"
      class="absolute inset-0 pointer-events-none"
      :style="{
        background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${currentStyle.ambientGlow} 0%, transparent 70%)`,
      }"
    ></div>

    <!-- TABLE SURFACE -->
    <div
      :id="'poker-table-surface-wrapper-' + templateSuffix"
      class="w-full h-full relative flex items-center justify-center"
    >
      <div
        :id="'poker-table-main-felt-' + templateSuffix"
        class="w-full h-full relative overflow-hidden flex flex-col items-center transition-all duration-500 border-b-[6px] border-black/60"
        :style="{ background: currentStyle.feltBackground }"
        :class="[
          responsive.screenSize === 'large'
            ? 'pt-16 justify-center pb-12'
            : ['small', 'xsmall'].includes(responsive.screenSize)
              ? 'pt-12 justify-end pb-0'
              : 'pt-12 justify-center pb-4',
        ]"
      >
        <!-- Felt texture overlay -->
        <div
          v-if="currentStyle.feltTexture !== 'none'"
          :id="'felt-texture-overlay-' + templateSuffix"
          class="absolute inset-0 pointer-events-none"
          :style="{
            backgroundImage: currentStyle.feltTexture,
            opacity: currentStyle.textureOpacity,
          }"
        ></div>

        <!-- Oval table rail shadow (inner edge shadow for depth) -->
        <div
          :id="'table-inner-shadow-' + templateSuffix"
          class="absolute inset-0 pointer-events-none"
          style="
            box-shadow:
              inset 0 0 120px rgba(0, 0, 0, 0.75),
              inset 0 0 40px rgba(0, 0, 0, 0.5);
          "
        ></div>

        <!-- Subtle diamond grid -->
        <div
          :id="'table-diamond-grid-' + templateSuffix"
          class="absolute inset-0 pointer-events-none"
          :style="{
            opacity: currentStyle.diamondOpacity,
            backgroundImage: `repeating-linear-gradient(
                45deg,
                rgba(255, 255, 255, 1) 0px,
                rgba(255, 255, 255, 1) 1px,
                transparent 1px,
                transparent 40px
              ),
              repeating-linear-gradient(
                -45deg,
                rgba(255, 255, 255, 1) 0px,
                rgba(255, 255, 255, 1) 1px,
                transparent 1px,
                transparent 40px
              )`,
          }"
        ></div>

        <!-- Center logo watermark -->
        <div
          :id="'table-logo-watermark-wrapper-' + templateSuffix"
          class="absolute inset-0 flex items-center justify-center pointer-events-none"
          :style="{ opacity: currentStyle.logoOpacity }"
        >
          <span
            :id="'table-logo-watermark-text-' + templateSuffix"
            style="
              font-size: 180px;
              color: white;
              font-weight: 900;
              letter-spacing: -0.05em;
              user-select: none;
            "
            >Y</span
          >
        </div>

        <!-- Player Map -->
        <PlayerMap
          v-if="!isMobile"
          :players="players"
          :activePlayerId="activePlayerId"
          :myPlayerId="myPlayerId"
        />

        <!-- POT DISPLAY - TOP NOTCH -->
        <div
          :id="'pot-display-absolute-container-' + templateSuffix"
          class="absolute top-0 left-1/2 -translate-x-1/2 z-20 transform scale-[0.75] transition-all duration-300 origin-top"
          :class="{
            'scale-[0.45]': ['small', 'xsmall'].includes(responsive.screenSize),
          }"
        >
          <PotDisplay
            :id="'pot-display-main-component-' + templateSuffix"
            :amount="pot"
          />
        </div>

        <!-- COMMUNITY CARDS AREA -->
        <div
          :id="'community-elements-layout-stack-' + templateSuffix"
          class="relative z-10 flex flex-col items-center w-full transition-all duration-500"
          :class="[responsive.screenSize === 'large' ? 'gap-10' : 'gap-4']"
        >
          <!-- Community Cards Row -->
          <div
            :id="'community-cards-horizontal-row-' + templateSuffix"
            class="flex items-end justify-center px-4 w-full overflow-hidden transition-all duration-300"
            :class="[
              ['xsmall', 'small'].includes(responsive.screenSize)
                ? 'gap-0 mb-[-1px]'
                : 'gap-2 sm:gap-3 md:gap-4',
            ]"
          >
            <template v-for="i in 5" :key="i">
              <div
                :id="'community-card-wrapper-' + i + '-' + templateSuffix"
                class="shrink-0 flex items-end justify-center transition-all duration-300"
                :class="{
                  '-ml-5 first:ml-0': ['xsmall', 'small'].includes(
                    responsive.screenSize,
                  ),
                }"
              >
                <template v-if="communityCards[i - 1]">
                  <Card
                    :id="
                      'community-card-item-' + (i - 1) + '-' + templateSuffix
                    "
                    :numSymbol="communityCards[i - 1]"
                    :percentage="
                      responsive.screenSize === 'medium'
                        ? 100
                        : responsive.cardPercentage
                    "
                    :size="responsive.cardSize"
                    class="hover:-translate-y-2 transition-transform duration-200 origin-bottom"
                  />
                </template>
                <template v-else>
                  <CardSpace
                    :id="
                      'community-card-space-empty-' +
                      (i - 1) +
                      '-' +
                      templateSuffix
                    "
                    :size="responsive.cardSize"
                    :percentage="
                      responsive.screenSize === 'medium'
                        ? 100
                        : responsive.cardPercentage
                    "
                    class="opacity-20 transition-all duration-300"
                  />
                </template>
              </div>
            </template>
          </div>
        </div>

        <!-- Subtle decorative inner rail line -->
        <div
          :id="'table-inner-rail-line-' + templateSuffix"
          class="absolute inset-4 rounded-2xl pointer-events-none"
          :style="{ border: currentStyle.railShadow }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Card from './Card.vue'
import CardSpace from './CardSpace.vue'
import PotDisplay from './PotDisplay.vue'
import PlayerMap from './PlayerMap.vue'
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()

const currentStyle = {
  feltBackground:
    'radial-gradient(ellipse 90% 80% at 50% 50%, #1a5c2a 0%, #14461f 40%, #0d3016 70%, #081e0e 100%)',
  railColor: 'rgba(255, 255, 255, 0.04)',
  railShadow: '1px solid rgba(255, 255, 255, 0.04)',
  ambientGlow: 'rgba(15, 40, 15, 0.6)',
  logoOpacity: 0.04,
  diamondOpacity: 0.03,
  feltTexture: "url('https://www.transparenttextures.com/patterns/felt.png')",
  textureOpacity: 0.25,
}

const templateSuffix = computed(() => {
  const size = responsive.screenSize
  return 'Template' + size.charAt(0).toUpperCase() + size.slice(1)
})

const isMobile = computed(() =>
  ['xsmall', 'small'].includes(responsive.screenSize),
)

defineProps({
  pot: { type: [Number, String], default: 0 },
  communityCards: { type: Array, default: () => [] },
  players: { type: Array, default: () => [] },
  activePlayerId: String,
  myPlayerId: String,
  isGuest: Boolean,
})
</script>

<style scoped></style>
