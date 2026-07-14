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

        <!-- Map Graphic Background (Rounded Rectangle) -->
        <div
          v-if="!isMobile"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white/10 rounded-[20%] pointer-events-none z-10"
          :class="isMobile ? 'w-[94%] h-[72%]' : 'w-[90%] h-[80%]'"
        ></div>

        <!-- Players Map Nodes -->
        <div
          v-for="seat in positionedSeats"
          v-show="!isMobile"
          :key="'node-' + seat.player.id"
          class="absolute z-30 flex flex-col items-center gap-1 transition-all duration-500"
          :style="{
            top: seat.top + '%',
            left: seat.left + '%',
            transform: 'translate(-50%, -50%)',
          }"
        >
          <!-- Initial Circle -->
          <div
            class="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base font-black transition-all duration-500"
            :class="[
              seat.player.id === activePlayerId
                ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-110'
                : seat.player.lastAction &&
                    seat.player.lastAction.toLowerCase().includes('fold')
                  ? 'bg-neutral-900 text-white/30 border border-white/5 opacity-50'
                  : 'bg-neutral-800 text-white border border-white/10 shadow-lg',
            ]"
          >
            {{ seat.player.name.charAt(0).toUpperCase() }}

            <!-- Dealer Dot -->
            <div
              v-if="seat.player.isDealer"
              class="absolute -top-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-white text-black text-[7px] sm:text-[8px] font-black rounded-full flex items-center justify-center shadow-md border border-gray-300"
            >
              D
            </div>
          </div>

          <!-- Info Tags -->
          <div class="flex flex-col items-center mt-1">
            <span
              class="text-[10px] sm:text-xs text-white/90 font-bold uppercase tracking-wider drop-shadow-md mb-0.5"
            >
              {{ cleanPlayerName(seat.player.name) }}
            </span>

            <!-- Bet/Action & Chips Badge -->
            <div class="flex items-center mt-0.5">
              <span
                class="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap backdrop-blur-sm flex items-center gap-1"
                :class="
                  seat.player.currentBet > 0
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : seat.player.lastAction
                      ? getActionColor(seat.player.lastAction)
                      : 'text-yellow-500 border-white/10 bg-black/40'
                "
              >
                <template v-if="seat.player.currentBet > 0">
                  <span>${{ seat.player.currentBet }}</span>
                  <span class="text-white/30">/</span>
                  <span class="text-yellow-500">${{ seat.player.chips }}</span>
                </template>
                <template v-else-if="seat.player.lastAction">
                  <span class="uppercase">{{ seat.player.lastAction }}</span>
                  <span class="text-white/30">/</span>
                  <span class="text-yellow-500">${{ seat.player.chips }}</span>
                </template>
                <template v-else>
                  <span class="text-yellow-500">${{ seat.player.chips }}</span>
                </template>
              </span>
            </div>
          </div>
        </div>

        <!-- POT DISPLAY - TOP NOTCH -->
        <div
          :id="'pot-display-absolute-container-' + templateSuffix"
          class="absolute top-0 left-1/2 -translate-x-1/2 z-20 transform transition-all duration-300 origin-top"
          :class="{
            'scale-[0.6]': ['small', 'xsmall'].includes(responsive.screenSize),
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
import { cleanPlayerName } from '../vutils'
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

const props = defineProps({
  pot: { type: [Number, String], default: 0 },
  communityCards: { type: Array, default: () => [] },
  players: { type: Array, default: () => [] },
  activePlayerId: String,
  myPlayerId: String,
  isGuest: Boolean,
})

const getActionColor = (action) => {
  const a = action.toLowerCase()
  if (a.includes('fold')) return 'text-red-400 border-red-500/20 bg-red-500/10'
  if (a.includes('raise') || a.includes('bet') || a.includes('all-in'))
    return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
  if (a.includes('call'))
    return 'text-blue-400 border-blue-500/20 bg-blue-600/10'
  if (a.includes('check')) return 'text-gray-400 border-white/10 bg-white/5'
  return 'text-white/60 bg-white/5 border-white/10'
}

function getEllipseSeatPositions(playerCount) {
  if (playerCount < 2) return []
  const positions = []
  const startAngle = -Math.PI / 2
  for (let i = 0; i < playerCount; i++) {
    const angle = startAngle + (i * 2 * Math.PI) / playerCount
    positions.push({ angle, index: i })
  }
  return positions
}

const positionedSeats = computed(() => {
  const playerList = [...props.players]
    .filter((p) => p && p.playerNumber != null)
    .sort((a, b) => a.playerNumber - b.playerNumber)

  if (playerList.length < 2) return []

  const myIndex = playerList.findIndex((p) => p.id === props.myPlayerId)
  let rotatedList = playerList
  if (myIndex > 0) {
    rotatedList = [
      ...playerList.slice(myIndex),
      ...playerList.slice(0, myIndex),
    ]
  }

  const ellipsePositions = getEllipseSeatPositions(rotatedList.length)

  const semiAxes = isMobile.value ? { a: 47, b: 36 } : { a: 45, b: 40 }

  const myAngleOffset = Math.PI

  return rotatedList.map((player, idx) => {
    const { angle } = ellipsePositions[idx]
    const adjustedAngle = angle + myAngleOffset

    const n = 3.5
    const absCos = Math.pow(Math.abs(Math.cos(adjustedAngle)), 2 / n)
    const absSin = Math.pow(Math.abs(Math.sin(adjustedAngle)), 2 / n)
    const left = 50 + semiAxes.a * absCos * Math.sign(Math.cos(adjustedAngle))
    const top = 50 + semiAxes.b * absSin * Math.sign(Math.sin(adjustedAngle))

    return {
      player,
      left,
      top,
    }
  })
})
</script>

<style scoped></style>
