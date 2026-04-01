<template>
  <div
    :id="`hud-action-buttons-row-${templateSuffix}`"
    class="flex gap-2 w-full h-11 lg:h-13"
  >
    <template v-if="canBlind">
      <button
        :id="`hud-post-blind-button-${templateSuffix}`"
        @click="$emit('action', 'blind')"
        class="btn-blind flex-1 font-black uppercase rounded-xl text-[11px] lg:text-sm px-3 active:scale-95 transition-all duration-150"
      >
        <template v-if="blindInfo">
          {{
            $t('game.post_blind', {
              type: $t('game.' + blindInfo.type.toLowerCase()),
              amount: blindInfo.amount,
            })
          }}
        </template>
        <template v-else>{{ $t('game.post_blind_generic') }}</template>
      </button>
    </template>

    <template v-else>
      <button
        :id="`hud-fold-button-${templateSuffix}`"
        @click="$emit('action', 'fold')"
        :disabled="!isMyTurn || !options.includes('fold')"
        class="btn-fold flex-1 font-black uppercase rounded-xl text-[11px] lg:text-sm transition-all duration-150 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
      >
        {{ $t('game.fold') }}
      </button>

      <button
        :id="`hud-check-button-${templateSuffix}`"
        @click="$emit('action', 'check')"
        :disabled="!isMyTurn || !options.includes('check')"
        class="btn-check flex-1 font-black uppercase rounded-xl text-[11px] lg:text-sm transition-all duration-150 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
      >
        {{ $t('game.check') }}
      </button>

      <button
        :id="`hud-call-button-${templateSuffix}`"
        @click="$emit('action', 'call')"
        :disabled="!isMyTurn || !options.includes('call')"
        class="btn-call flex-1 font-black uppercase rounded-xl text-[11px] lg:text-sm transition-all duration-150 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
      >
        {{ $t('game.call') }}
      </button>

      <button
        :id="`hud-raise-bet-button-${templateSuffix}`"
        @click="$emit('action', options.includes('bet') ? 'bet' : 'raise')"
        :disabled="isRaiseActionDisabled"
        class="btn-raise flex-[1.5] font-black uppercase rounded-xl text-[11px] lg:text-sm transition-all duration-150 active:scale-95 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed"
        :class="[
          pokerStore.blindsIncreasedFlag ? 'animate-pulse scale-105 z-10' : '',
        ]"
      >
        {{ options.includes('bet') ? $t('game.bet') : $t('game.raise') }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePokerStore } from '../../store/pokerStore'
import { useResponsiveStore } from '../../store/responsiveStore'

defineProps({
  isMyTurn: Boolean,
  canBlind: Boolean,
  blindInfo: Object,
  options: Array,
  isRaiseActionDisabled: Boolean,
})

const pokerStore = usePokerStore()
const responsive = useResponsiveStore()
const templateSuffix = computed(() => responsive.templateSuffix)

defineEmits(['action'])
</script>

<style scoped>
.btn-fold {
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.2);
  color: rgba(252, 165, 165, 0.9);
}
.btn-fold:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.18);
  border-color: rgba(220, 38, 38, 0.4);
  color: #fca5a5;
}

.btn-check {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.75);
}
.btn-check:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.btn-call {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #93c5fd;
}
.btn-call:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.22);
  border-color: rgba(59, 130, 246, 0.5);
  color: #bfdbfe;
}

.btn-raise {
  background: linear-gradient(135deg, #eab308 0%, #ca8a04 60%, #a16207 100%);
  border: 1px solid rgba(234, 179, 8, 0.6);
  color: #1a0f00;
  box-shadow:
    0 2px 12px rgba(234, 179, 8, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);
}
.btn-raise:hover:not(:disabled) {
  background: linear-gradient(135deg, #facc15 0%, #ca8a04 60%, #a16207 100%);
  box-shadow:
    0 4px 20px rgba(234, 179, 8, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.btn-blind {
  background: linear-gradient(135deg, #eab308 0%, #ca8a04 60%, #a16207 100%);
  border: 1px solid rgba(234, 179, 8, 0.6);
  color: #1a0f00;
  box-shadow:
    0 2px 12px rgba(234, 179, 8, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
.btn-blind:hover {
  background: linear-gradient(135deg, #facc15 0%, #ca8a04 60%, #a16207 100%);
}
</style>
