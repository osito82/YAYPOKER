<template>
  <div
    :id="'seat-wrapper-' + playerName + '-' + responsive.templateSuffix"
    class="relative group flex items-center p-3 rounded-xl border transition-all duration-1000 w-full overflow-hidden seat-base"
    :class="
      isWinner
        ? 'seat-winner'
        : isActive
          ? 'seat-active'
          : playerAction && playerAction.toLowerCase().includes('fold')
            ? 'seat-folded hover:border-white/10'
            : 'seat-idle hover:border-white/15'
    "
  >
    <!-- Active Turn Pulse -->
    <div
      :id="'active-pulse-' + playerName + '-' + responsive.templateSuffix"
      v-if="isActive"
      class="absolute inset-0 bg-yellow-500/5 animate-pulse pointer-events-none"
    ></div>

    <!-- Cards Section (Left) -->
    <div
      :id="'seat-cards-section-' + playerName + '-' + responsive.templateSuffix"
      class="flex mr-4 shrink-0"
    >
      <template v-if="showCards && playerCards?.length > 0">
        <Card
          v-for="(c, i) in playerCards"
          :id="
            'seat-card-' +
            playerName +
            '-' +
            i +
            '-' +
            responsive.templateSuffix
          "
          :key="i"
          :size="responsive.cardSize"
          :percentage="responsive.cardPercentage"
          :numSymbol="c"
          :highlight="isCardWinning(c)"
          class="scale-90 origin-left transition-all duration-500"
          :class="i > 0 ? '-ml-6' : ''"
        />
      </template>
      <template v-else>
        <CardBack
          v-for="i in 2"
          :id="
            'seat-card-back-' +
            playerName +
            '-' +
            i +
            '-' +
            responsive.templateSuffix
          "
          :key="i"
          :size="responsive.cardSize"
          :percentage="responsive.cardPercentage"
          class="scale-90 origin-left"
          :class="i > 1 ? '-ml-6' : ''"
        />
      </template>
    </div>

    <!-- Info Section (Right) -->
    <div
      :id="'seat-info-section-' + playerName + '-' + responsive.templateSuffix"
      class="flex-grow flex flex-col justify-center min-w-0"
    >
      <div
        :id="'seat-header-' + playerName + '-' + responsive.templateSuffix"
        class="flex justify-between items-start mb-1"
      >
        <div class="flex items-center gap-2 min-w-0">
          <!-- Player Number Badge with Dealer Button -->
          <div
            class="relative w-5 h-5 flex items-center justify-center rounded bg-white/10 border border-white/5 text-[9px] font-black text-white/50 shrink-0"
          >
            {{ playerNumber }}
            <div
              v-if="isDealer"
              class="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white text-black text-[7px] font-black rounded-full flex items-center justify-center border border-gray-300 shadow-sm z-10"
            >
              D
            </div>
          </div>
          <!-- Connectivity Dot -->
          <div
            class="w-1.5 h-1.5 rounded-full shrink-0"
            :class="isConnected ? 'bg-green-500' : 'bg-gray-500'"
          ></div>
          <div class="flex flex-col min-w-0">
            <span
              :id="'seat-name-' + playerName + '-' + responsive.templateSuffix"
              class="text-lg font-black truncate leading-tight transition-colors"
              :class="
                isWinner
                  ? 'text-emerald-400'
                  : playerAction && playerAction.toLowerCase().includes('fold')
                    ? 'text-gray-500'
                    : 'text-white'
              "
              >{{ cleanName }}</span
            >
            <span
              v-if="isWinner && handName"
              class="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none mt-0.5 truncate"
            >
              {{ formatHandName(handName) }}
            </span>
          </div>
        </div>
        <div
          :id="
            'seat-stack-container-' +
            playerName +
            '-' +
            responsive.templateSuffix
          "
          class="flex flex-col items-end shrink-0 ml-2"
        >
          <span
            :id="'label-stack-' + playerName + '-' + responsive.templateSuffix"
            class="text-[11px] font-black text-gray-300 uppercase tracking-tighter leading-none mb-0.5"
            >Stack</span
          >
          <span
            :id="
              'display-stack-' + playerName + '-' + responsive.templateSuffix
            "
            class="text-sm font-mono font-black text-yellow-500 leading-none"
            >${{ playerChips }}</span
          >
        </div>
      </div>

      <div
        :id="'seat-footer-' + playerName + '-' + responsive.templateSuffix"
        class="mt-1 flex justify-between items-end h-7"
      >
        <div
          :id="
            'seat-action-container-' +
            playerName +
            '-' +
            responsive.templateSuffix
          "
          class="flex flex-col"
        >
          <span
            :id="'label-action-' + playerName + '-' + responsive.templateSuffix"
            class="text-[10px] font-black text-blue-400 uppercase tracking-wider leading-none mb-1"
            >Last Action</span
          >
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform -translate-y-1 opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
            mode="out-in"
          >
            <div
              v-if="playerAction"
              :id="
                'display-action-' + playerName + '-' + responsive.templateSuffix
              "
              :key="playerAction"
              class="text-[12px] font-black text-blue-300 uppercase tracking-widest leading-none"
            >
              {{ playerAction }}
            </div>
            <div
              v-else
              :id="
                'display-action-none-' +
                playerName +
                '-' +
                responsive.templateSuffix
              "
              class="text-[12px] font-black uppercase tracking-widest leading-none italic"
              :class="
                playerAction && playerAction.toLowerCase().includes('fold')
                  ? 'text-gray-600'
                  : 'text-gray-400'
              "
            >
              ...
            </div>
          </Transition>
        </div>

        <div
          v-if="handContribution > 0"
          :id="
            'seat-bet-container-' + playerName + '-' + responsive.templateSuffix
          "
          class="flex flex-col items-end shrink-0 ml-2 animate-in fade-in zoom-in duration-1000"
        >
          <span
            :id="'label-bet-' + playerName + '-' + responsive.templateSuffix"
            class="text-[10px] font-black text-emerald-400 uppercase leading-none mb-1"
            >In Pot</span
          >
          <span
            :id="'display-bet-' + playerName + '-' + responsive.templateSuffix"
            class="text-sm font-mono font-black text-emerald-400 leading-none"
          >
            ${{ handContribution }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Card from './Card.vue'
import CardBack from './CardBack.vue'
import { useResponsiveStore } from '../store/responsiveStore'
import { cleanPlayerName } from '../vutils'

const responsive = useResponsiveStore()

const props = defineProps({
  playerName: { type: String, default: 'Guest' },
  playerChips: { type: Number, default: 0 },
  playerBet: { type: Number, default: 0 },
  handContribution: { type: Number, default: 0 }, // ✅ AGREGADO
  playerAction: { type: String, default: '' },
  playerCards: { type: Array, default: () => [] },
  showCards: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  playerNumber: { type: Number, default: 0 },
  isConnected: { type: Boolean, default: true },
  isDealer: { type: Boolean, default: false },
  isWinner: { type: Boolean, default: false },
  handName: { type: String, default: '' },
  winningCards: { type: Array, default: () => [] },
})

const cleanName = computed(() => cleanPlayerName(props.playerName))

const isCardWinning = (card) => {
  return props.winningCards && props.winningCards.includes(card)
}

const formatHandName = (name) => {
  if (!name) return ''
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .toUpperCase()
}
</script>

<style scoped>
.seat-base {
  background: rgba(0, 0, 0, 0.4);
}

.seat-idle {
  border-color: rgba(255, 255, 255, 0.08);
}
.seat-idle:hover {
  background: rgba(0, 0, 0, 0.55);
}

.seat-active {
  background: rgba(212, 160, 23, 0.1);
  border-color: rgba(212, 160, 23, 0.5);
  box-shadow:
    0 0 20px rgba(212, 160, 23, 0.15),
    inset 0 0 20px rgba(212, 160, 23, 0.04);
  transform: scale(1.02);
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.seat-folded {
  background: rgba(0, 0, 0, 0.6);
  border-color: rgba(255, 255, 255, 0.03);
  opacity: 0.7;
}

.seat-winner {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.6);
  box-shadow:
    0 0 30px rgba(16, 185, 129, 0.25),
    inset 0 0 20px rgba(16, 185, 129, 0.1);
  transform: scale(1.05);
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
