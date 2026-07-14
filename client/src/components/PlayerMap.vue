<template>
  <!-- Map Graphic Background (Rounded Rectangle) -->
  <div
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 w-[88%] h-[78%] rounded-[28px] border border-dashed border-white/10"
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
    <!-- Avatar circle -->
    <div class="relative">

      <!-- Active player pulse ring -->
      <div
        v-if="seat.player.id === activePlayerId"
        class="absolute inset-0 rounded-full animate-ping-slow"
        style="background: rgba(234,179,8,0.25); transform: scale(1.5);"
      ></div>

      <!-- My player outer ring -->
      <div
        v-if="seat.player.id === myPlayerId"
        class="absolute -inset-[3px] rounded-full"
        style="background: linear-gradient(135deg, #60a5fa, #a78bfa); padding: 2px;"
      >
        <div class="w-full h-full rounded-full" style="background: #181818;"></div>
      </div>

      <!-- Main circle -->
      <div
        class="relative w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-black transition-all duration-500 select-none z-10"
        :class="[
          seat.player.id === activePlayerId
            ? 'bg-yellow-500 text-black shadow-[0_0_14px_rgba(234,179,8,0.5)] scale-110'
            : isFolded(seat.player)
              ? 'bg-neutral-900 text-white/20 border border-white/5'
              : seat.player.id === myPlayerId
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(96,165,250,0.35)]'
                : 'bg-neutral-800 text-white border border-white/15 shadow-lg',
        ]"
      >
        <span v-if="!isFolded(seat.player)">
          {{ seat.player.name.charAt(0).toUpperCase() }}
        </span>
        <span v-else class="text-[12px] opacity-60">✕</span>

        <!-- Dealer chip -->
        <div
          v-if="seat.player.isDealer"
          class="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-gradient-to-br from-white to-gray-300 text-black text-[7px] font-black rounded-full flex items-center justify-center shadow-md border border-white/80 z-20"
        >D</div>
      </div>
    </div>

    <!-- Name -->
    <span
      class="mt-1.5 text-[11px] font-bold uppercase tracking-wider drop-shadow-md whitespace-nowrap"
      :class="[
        seat.player.id === myPlayerId ? 'text-blue-300' :
        seat.player.id === activePlayerId ? 'text-yellow-300' :
        isFolded(seat.player) ? 'text-white/30' : 'text-white/80'
      ]"
    >
      {{ cleanPlayerName(seat.player.name) }}
      <span v-if="seat.player.id === myPlayerId" class="text-blue-400/70 normal-case font-normal ml-0.5">(tú)</span>
    </span>

    <!-- Stack bar + action badge row -->
    <div class="flex flex-col items-center gap-0.5 mt-0.5 w-full">

      <!-- Relative stack bar -->
      <div class="w-14 h-1 rounded-full bg-white/10 overflow-hidden" v-if="!isFolded(seat.player)">
        <div
          class="h-full rounded-full transition-all duration-700"
          :style="{ width: getStackPercent(seat.player) + '%' }"
          :class="[
            getStackPercent(seat.player) > 60 ? 'bg-emerald-400' :
            getStackPercent(seat.player) > 30 ? 'bg-yellow-400' : 'bg-red-400'
          ]"
        ></div>
      </div>

      <!-- Bet / Chips badge -->
      <span
        class="text-[10px] font-bold px-1.5 py-px rounded border whitespace-nowrap backdrop-blur-sm flex items-center gap-0.5"
        :class="
          seat.player.currentBet > 0
            ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
            : seat.player.id === activePlayerId
              ? 'text-yellow-300 border-yellow-500/20 bg-yellow-500/10'
              : isFolded(seat.player)
                ? 'text-white/20 border-white/5 bg-transparent'
                : getActionColor(seat.player.lastAction)
        "
      >
        <!-- Action icon -->
        <span v-if="seat.player.currentBet > 0">{{ getActionIcon('bet') }}</span>
        <span v-else-if="seat.player.lastAction && !isFolded(seat.player)">{{ getActionIcon(seat.player.lastAction) }}</span>

        <template v-if="seat.player.currentBet > 0">
          <span>${{ seat.player.currentBet }}</span>
          <span class="text-white/20">/</span>
          <span class="text-yellow-400">${{ seat.player.chips }}</span>
        </template>
        <template v-else-if="isFolded(seat.player)">
          <span class="uppercase tracking-wider">fold</span>
        </template>
        <template v-else-if="seat.player.lastAction">
          <span class="uppercase text-[9px]">{{ seat.player.lastAction }}</span>
          <span class="text-white/20">/</span>
          <span class="text-yellow-400">${{ seat.player.chips }}</span>
        </template>
        <template v-else>
          <span class="text-yellow-400">${{ seat.player.chips }}</span>
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
