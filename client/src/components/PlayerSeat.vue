<template>
  <div
    :id="'seat-wrapper-' + playerName + '-' + responsive.templateSuffix"
    class="relative group flex items-center p-3 rounded-xl border transition-all duration-300 w-full overflow-hidden seat-base"
    :class="
      isActive
        ? 'seat-active'
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
          class="scale-90 origin-left"
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
        <span
          :id="'seat-name-' + playerName + '-' + responsive.templateSuffix"
          class="text-lg font-black text-white truncate leading-tight"
          >{{ playerName }}</span
        >
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
              class="text-[12px] font-black text-gray-400 uppercase tracking-widest leading-none italic"
            >
              ...
            </div>
          </Transition>
        </div>

        <div
          v-if="playerBet > 0"
          :id="
            'seat-bet-container-' + playerName + '-' + responsive.templateSuffix
          "
          class="flex flex-col items-end shrink-0 ml-2"
        >
          <span
            :id="'label-bet-' + playerName + '-' + responsive.templateSuffix"
            class="text-[10px] font-black text-emerald-400 uppercase leading-none mb-1"
            >Bet</span
          >
          <span
            :id="'display-bet-' + playerName + '-' + responsive.templateSuffix"
            class="text-sm font-mono font-black text-emerald-400 leading-none"
          >
            ${{ playerBet }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Card from './Card.vue'
import CardBack from './CardBack.vue'
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()

defineProps({
  playerName: { type: String, default: 'Guest' },
  playerChips: { type: Number, default: 0 },
  playerBet: { type: Number, default: 0 },
  playerAction: { type: String, default: '' },
  playerCards: { type: Array, default: () => [] },
  showCards: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
})
</script>

<style scoped>
.seat-base {
  background: rgba(0,0,0,0.4);
}

.seat-idle {
  border-color: rgba(255,255,255,0.08);
}
.seat-idle:hover {
  background: rgba(0,0,0,0.55);
}

.seat-active {
  background: rgba(212,160,23,0.1);
  border-color: rgba(212,160,23,0.5);
  box-shadow: 0 0 20px rgba(212,160,23,0.15), inset 0 0 20px rgba(212,160,23,0.04);
  transform: scale(1.02);
}
</style>
