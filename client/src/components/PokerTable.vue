<template>
  <div
    id="poker-viewport"
    class="w-full h-full relative overflow-hidden bg-neutral-950 flex items-center justify-center"
  >
    <!-- Table Surface Area -->
    <div
      id="table-container"
      class="w-full h-full relative flex items-center justify-center"
    >
      <div
        id="main-table-surface"
        class="w-full h-full bg-gradient-to-br from-green-900 via-emerald-950 to-green-950 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center border-b-[6px] border-neutral-900/60 transition-all duration-500 pt-16"
        :class="[
          responsive.screenSize === 'large' ? 'justify-center pb-12' : 'justify-end pb-0'
        ]"
      >
        <!-- Modern Grid Pattern -->
        <div
          id="table-grid-pattern"
          class="absolute inset-0 opacity-[0.04] pointer-events-none"
          style="
            background-image:
              linear-gradient(#fff 1px, transparent 1px),
              linear-gradient(90deg, #fff 1px, transparent 1px);
            background-size: 50px 50px;
          "
        ></div>

        <!-- Enhanced Inner Glow & Felt Texture -->
        <div
          id="table-inner-glow"
          class="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.8)] pointer-events-none"
        ></div>
        <div
          id="table-felt-texture"
          class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-20 pointer-events-none"
        ></div>

        <!-- TOP-CENTERED NOTCH (POT) -->
        <div
          id="table-pot-display-container"
          class="absolute top-0 left-1/2 -translate-x-1/2 z-20 transform transition-all duration-300"
        >
          <PotDisplay
            :id="'pot-display-main'"
            :amount="pot"
          />
        </div>

        <!-- CONTENT ZONE -->
        <div
          id="table-elements-stack"
          class="relative z-10 flex flex-col items-center w-full transition-all duration-500"
          :class="[
            responsive.screenSize === 'large' ? 'gap-10' : 'gap-4'
          ]"
        >
          <!-- Community Cards -->
          <div
            id="community-cards-row"
            class="flex items-end justify-center px-4 w-full overflow-hidden transition-all duration-300"
            :class="[
              responsive.screenSize === 'small' ? 'gap-0' : 'gap-2 sm:gap-3 md:gap-4',
            ]"
          >
            <template v-for="i in 5" :key="i">
              <div
                :id="'card-wrapper-' + i"
                class="shrink-0 flex items-end justify-center transition-all duration-300"
                :class="{
                  '-ml-5 first:ml-0': responsive.screenSize === 'small',
                }"
              >
                <template v-if="communityCards[i - 1]">
                  <Card
                    :id="'community-card-item-' + (i - 1)"
                    :numSymbol="communityCards[i - 1]"
                    :percentage="responsive.cardPercentage"
                    :size="responsive.cardSize"
                    class="shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-300 origin-bottom"
                  />
                </template>
                <template v-else>
                  <CardSpace
                    :id="'community-card-space-empty-' + (i - 1)"
                    :size="responsive.cardSize"
                    :percentage="responsive.cardPercentage"
                    class="opacity-30 border-white/10 transition-all duration-300"
                  />
                </template>
              </div>
            </template>
          </div>
        </div>

        <!-- Subtle Decorative Inner Line -->
        <div
          class="absolute inset-3 rounded-lg lg:rounded-xl border border-white/[0.03] pointer-events-none"
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
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()

const props = defineProps({
  pot: { type: [Number, String], default: 0 },
  communityCards: { type: Array, default: () => [] },
  players: { type: Array, default: () => [] },
  activePlayerId: String,
})
</script>
