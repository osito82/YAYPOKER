<template>
  <!-- Map Graphic Background (Rounded Rectangle) -->
  <div
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 rounded-[28px] border border-dashed border-white/10 transition-all duration-300"
    :style="{ width: (semiAxes.a * 1.96) + '%', height: (semiAxes.b * 1.96) + '%' }"
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
    :class="isFolded(seat.player) ? 'opacity-35' : 'opacity-100'"
  >
    <!-- Contenedor Rectángulo Amarillo -->
    <div 
      class="flex flex-col items-center p-1.5 px-3 rounded-[12px] border transition-all duration-300 relative min-w-[70px]"
      :class="[
        seat.player.id === activePlayerId 
          ? 'bg-yellow-500 text-black border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.6)] scale-110' 
          : seat.player.id === myPlayerId
            ? 'bg-yellow-500 text-black border-yellow-200 shadow-[0_0_12px_rgba(234,179,8,0.4)] ring-2 ring-blue-400'
            : isFolded(seat.player)
              ? 'bg-neutral-800/80 border-white/10 text-white/50'
              : 'bg-yellow-500/90 text-black border-yellow-400 shadow-md'
      ]"
    >
      <!-- Dealer chip (moved to top-right corner) -->
      <div
        v-if="seat.player.isDealer"
        class="absolute -top-2 -right-2 w-4 h-4 bg-white text-black text-[9px] font-black rounded-full flex items-center justify-center shadow-md border-2 border-yellow-600 z-20"
      >D</div>

      <!-- Name -->
      <span
        class="text-[11px] font-black uppercase tracking-wider drop-shadow-sm whitespace-nowrap"
      >
        <span v-if="isFolded(seat.player)" class="text-[10px] opacity-60 mr-1">✕</span>
        {{ cleanPlayerName(seat.player.name) }}
        <span v-if="seat.player.id === myPlayerId" class="opacity-70 normal-case font-bold ml-0.5">(tú)</span>
      </span>

      <!-- Stack bar -->
      <div class="w-full h-1 rounded-full bg-black/20 overflow-hidden mt-1 mb-1" v-if="!isFolded(seat.player)">
        <div
          class="h-full rounded-full transition-all duration-700"
          :style="{ width: getStackPercent(seat.player) + '%' }"
          :class="[
            getStackPercent(seat.player) > 60 ? 'bg-emerald-400' :
            getStackPercent(seat.player) > 30 ? 'bg-orange-400' : 'bg-red-500'
          ]"
        ></div>
      </div>

      <!-- Bet / Chips / Action -->
      <span
        class="text-[10px] font-bold whitespace-nowrap flex items-center gap-0.5"
      >
        <!-- Action icon -->
        <span v-if="seat.player.currentBet > 0">{{ getActionIcon('bet') }}</span>
        <span v-else-if="seat.player.lastAction && !isFolded(seat.player)">{{ getActionIcon(seat.player.lastAction) }}</span>

        <template v-if="seat.player.currentBet > 0">
          <span>${{ seat.player.currentBet }}</span>
          <span class="opacity-40">/</span>
          <span>${{ seat.player.chips }}</span>
        </template>
        <template v-else-if="isFolded(seat.player)">
          <span class="uppercase tracking-wider">fold</span>
        </template>
        <template v-else-if="seat.player.lastAction">
          <span class="uppercase text-[9px]">{{ seat.player.lastAction }}</span>
          <span class="opacity-40">/</span>
          <span>${{ seat.player.chips }}</span>
        </template>
        <template v-else>
          <span>${{ seat.player.chips }}</span>
        </template>
      </span>
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

// ── Helpers ─────────────────────────────────────────────────────────────────

const isFolded = (player) =>
  player.lastAction && player.lastAction.toLowerCase().includes('fold')

const getActionColor = (action) => {
  if (!action) return 'text-yellow-500 border-white/10 bg-black/40'
  const a = action.toLowerCase()
  if (a.includes('fold')) return 'text-red-400/60 border-red-500/10 bg-transparent'
  if (a.includes('raise') || a.includes('all-in'))
    return 'text-amber-300 border-amber-500/25 bg-amber-500/10'
  if (a.includes('bet'))
    return 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10'
  if (a.includes('call'))
    return 'text-sky-300 border-sky-500/20 bg-sky-600/10'
  if (a.includes('check')) return 'text-slate-300 border-white/10 bg-white/5'
  return 'text-white/50 bg-white/5 border-white/10'
}

const getActionIcon = (action) => {
  if (!action) return ''
  const a = action.toLowerCase()
  if (a === 'bet') return '💵'
  if (a.includes('raise')) return '🔥'
  if (a.includes('all-in')) return '🚀'
  if (a.includes('call')) return '🤝'
  if (a.includes('check')) return '✓'
  return ''
}

// ── Stack bar ────────────────────────────────────────────────────────────────

// Referencia: el máximo de chips entre TODOS los jugadores (incluyendo foleados)
const maxChips = computed(() => {
  const all = props.players.filter((p) => p && p.chips != null)
  if (!all.length) return 1
  return Math.max(...all.map((p) => p.chips || 0), 1)
})

const getStackPercent = (player) => {
  const stack = player.chips || 0
  return Math.max(3, Math.round((stack / maxChips.value) * 100))
}

// ── Seat positioning ─────────────────────────────────────────────────────────

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
  return isMobile.value ? { a: 47, b: 28 } : { a: 45, b: 32 }
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
    const top = 50 + axes.b * absSin * Math.sign(Math.sin(adjustedAngle))
    return { player, left, top }
  })
})
</script>

<style scoped>
@keyframes ping-slow {
  0%   { transform: scale(1.4); opacity: 0.6; }
  70%  { transform: scale(2);   opacity: 0; }
  100% { transform: scale(2);   opacity: 0; }
}
.animate-ping-slow {
  animation: ping-slow 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
