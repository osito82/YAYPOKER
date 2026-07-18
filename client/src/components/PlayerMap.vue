<template>
  <!-- Map Graphic Background (Rounded Rectangle) -->
  <div
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 rounded-[28px] border border-dashed border-white/10 transition-all duration-300"
    :style="{
      width: semiAxes.a * 1.96 + '%',
      height: semiAxes.b * 1.96 + '%',
    }"
  ></div>

  <!-- Players Map Nodes -->
  <div
    v-for="seat in positionedSeats"
    :key="'node-' + seat.player.id"
    class="absolute z-30 flex flex-col items-center transition-all duration-500"
    :style="{
      top: seat.top + '%',
      left: seat.left + '%',
      transform: 'translate(-50%, -50%)',
    }"
    :class="isFolded(seat.player) ? 'opacity-40' : 'opacity-100'"
  >
    <!-- Player Card -->
    <div
      class="flex items-center gap-2 rounded-2xl border transition-all duration-300 backdrop-blur-md"
      :class="[
        isMobile
          ? 'p-1.5 px-2.5 gap-1.5 min-w-[120px]'
          : 'p-2 px-3 min-w-[155px]',
        seat.player.id === activePlayerId
          ? 'border-yellow-500/60 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.3)] scale-105'
          : seat.player.id === myPlayerId
            ? 'border-blue-400/50 bg-blue-500/5 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
            : 'border-white/10 bg-black/60 shadow-lg',
      ]"
    >
      <!-- Left: Avatar + Dealer Badge -->
      <div class="relative shrink-0">
        <div
          class="rounded-full flex items-center justify-center font-black border-2 transition-all duration-300"
          :class="[
            isMobile ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg',
            seat.player.id === activePlayerId
              ? 'border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.5)]'
              : seat.player.id === myPlayerId
                ? 'border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                : 'border-white/20',
          ]"
          :style="{ backgroundColor: getAvatarColor(seat.player) }"
        >
          <span
            :class="
              seat.player.id === activePlayerId
                ? 'text-yellow-100'
                : 'text-white'
            "
          >
            {{ getInitial(seat.player) }}
          </span>
        </div>
        <!-- Dealer chip -->
        <div
          v-if="seat.player.isDealer"
          class="absolute -top-1 -right-2 w-5 h-5 bg-white text-black text-[9px] font-black rounded-full flex items-center justify-center shadow-md border-2 border-yellow-500 z-20"
        >
          D
        </div>
        <!-- Folded marker overlay on avatar -->
        <div
          v-if="isFolded(seat.player)"
          class="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center"
        >
          <span class="text-[9px] font-black text-red-400 uppercase">FOLD</span>
        </div>
      </div>

      <!-- Right: Info Column -->
      <div class="flex flex-col min-w-0 flex-1">
        <!-- Name row -->
        <div class="flex items-center gap-1 min-w-0">
          <span
            class="font-black uppercase tracking-wider truncate"
            :class="[
              isMobile ? 'text-[11px]' : 'text-[13px]',
              isFolded(seat.player)
                ? 'text-white/30 line-through'
                : 'text-white/90',
            ]"
          >
            {{ cleanPlayerName(seat.player.name) }}
          </span>
          <span
            v-if="seat.player.id === myPlayerId"
            class="text-[9px] text-blue-400 font-bold shrink-0"
            >tú</span
          >
        </div>

        <!-- Stack bar -->
        <div class="w-full h-1 rounded-full bg-white/10 overflow-hidden my-1">
          <div
            class="h-full rounded-full transition-all duration-700"
            :style="{ width: getStackPercent(seat.player) + '%' }"
            :class="[
              getStackPercent(seat.player) > 60
                ? 'bg-emerald-400'
                : getStackPercent(seat.player) > 30
                  ? 'bg-orange-400'
                  : 'bg-red-500',
            ]"
          ></div>
        </div>

        <!-- Chips + Action row -->
        <div
          class="flex items-center gap-1 text-[11px] font-mono font-bold"
          :class="[isFolded(seat.player) ? 'text-white/20' : 'text-white/60']"
        >
          <template v-if="isFolded(seat.player)">
            <span class="uppercase tracking-wider text-[9px] text-red-400/60"
              >FOLDED</span
            >
          </template>
          <template v-else-if="seat.player.isAllIn">
            <span class="text-amber-400 font-black text-[10px]">ALL-IN</span>
            <span class="opacity-40">${{ seat.player.chips }}</span>
          </template>
          <template v-else-if="seat.player.currentBet > 0">
            <span class="text-yellow-400">${{ seat.player.currentBet }}</span>
            <span class="opacity-30">/</span>
            <span>${{ seat.player.chips }}</span>
          </template>
          <template v-else-if="seat.player.lastAction">
            <span
              class="uppercase tracking-wider"
              :class="getActionTextColor(seat.player.lastAction)"
              >{{ seat.player.lastAction }}</span
            >
            <span class="opacity-30">/</span>
            <span>${{ seat.player.chips }}</span>
          </template>
          <template v-else>
            <span>${{ seat.player.chips }}</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { cleanPlayerName } from '../vutils'
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()

const props = defineProps({
  players: { type: Array, default: () => [] },
  activePlayerId: { type: String, default: null },
  myPlayerId: { type: String, default: null },
})

const isMobile = computed(() =>
  ['xsmall', 'small'].includes(responsive.screenSize),
)

const AVATAR_COLORS = [
  '#4f46e5', // indigo
  '#16a34a', // green
  '#dc2626', // red
  '#9333ea', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
  '#db2777', // pink
  '#2563eb', // blue
  '#65a30d', // lime
  '#7c3aed', // violet
]

const getAvatarColor = (player) => {
  const idx = (player.playerNumber - 1) % AVATAR_COLORS.length
  return AVATAR_COLORS[Math.max(0, idx)]
}

const getInitial = (player) => {
  const name = cleanPlayerName(player.name)
  return name.charAt(0).toUpperCase()
}

const isFolded = (player) =>
  !!player.folded ||
  (player.lastAction && player.lastAction.toLowerCase().includes('fold'))

const getActionTextColor = (action) => {
  if (!action) return 'text-white/50'
  const a = action.toLowerCase()
  if (a.includes('fold')) return 'text-red-400/60'
  if (a.includes('raise') || a.includes('all-in')) return 'text-amber-300'
  if (a.includes('bet')) return 'text-emerald-300'
  if (a.includes('call')) return 'text-sky-300'
  if (a.includes('check')) return 'text-slate-300'
  return 'text-white/50'
}

const maxChips = computed(() => {
  const all = props.players.filter((p) => p && p.chips != null)
  if (!all.length) return 1
  return Math.max(...all.map((p) => p.chips || 0), 1)
})

const getStackPercent = (player) => {
  const stack = player.chips || 0
  return Math.max(3, Math.round((stack / maxChips.value) * 100))
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

const semiAxes = computed(() => {
  return isMobile.value ? { a: 47, b: 32 } : { a: 45, b: 36 }
})

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
  const axes = semiAxes.value
  const myAngleOffset = Math.PI

  return rotatedList.map((player, idx) => {
    const { angle } = ellipsePositions[idx]
    const adjustedAngle = angle + myAngleOffset
    const n = 3.5
    const absCos = Math.pow(Math.abs(Math.cos(adjustedAngle)), 2 / n)
    const absSin = Math.pow(Math.abs(Math.sin(adjustedAngle)), 2 / n)

    const left = 50 + axes.a * absCos * Math.sign(Math.cos(adjustedAngle))
    const top = 53 + axes.b * absSin * Math.sign(Math.sin(adjustedAngle))
    return { player, left, top }
  })
})
</script>

<style scoped></style>
