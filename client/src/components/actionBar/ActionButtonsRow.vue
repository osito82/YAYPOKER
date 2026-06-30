<template>
  <div
    :id="`hud-action-buttons-row-${templateSuffix}`"
    class="flex gap-2 w-full h-11 lg:h-13"
  >
    <template v-if="canBlind">
      <button
        :id="`hud-post-blind-button-${templateSuffix}`"
        @click="handleAction('blind')"
        :title="$t('game.blind_tooltip')"
        class="btn-blind flex-1 font-black uppercase rounded-xl text-[11px] lg:text-sm px-3 active:scale-95 transition-all duration-150"
        :class="{ 'opacity-60 scale-[0.97]': pressedAction === 'blind' }"
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
        @click="handleAction('fold')"
        :disabled="!isMyTurn || !options.includes('fold')"
        :title="$t('game.fold_tooltip')"
        class="btn-fold flex-1 font-black uppercase rounded-xl text-[11px] lg:text-sm transition-all duration-150 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
        :class="{ 'opacity-60 scale-[0.97]': pressedAction === 'fold' }"
      >
        {{ $t('game.fold') }}
      </button>

      <button
        :id="`hud-check-button-${templateSuffix}`"
        @click="handleAction('check')"
        :disabled="!isMyTurn || !options.includes('check')"
        :title="$t('game.check_tooltip')"
        class="btn-check flex-1 font-black uppercase rounded-xl text-[11px] lg:text-sm transition-all duration-150 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
        :class="{ 'opacity-60 scale-[0.97]': pressedAction === 'check' }"
      >
        {{ $t('game.check') }}
      </button>

      <button
        :id="`hud-call-button-${templateSuffix}`"
        @click="handleAction('call')"
        :disabled="!isMyTurn || !options.includes('call')"
        :title="$t('game.call_tooltip')"
        class="btn-call flex-1 font-black uppercase rounded-xl text-[11px] lg:text-sm transition-all duration-150 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
        :class="{ 'opacity-60 scale-[0.97]': pressedAction === 'call' }"
      >
        {{ $t('game.call') }}
      </button>

      <button
        :id="`hud-raise-bet-button-${templateSuffix}`"
        @click="handleAction(options.includes('bet') ? 'bet' : 'raise')"
        :disabled="isRaiseActionDisabled"
        :title="isRaiseActionDisabled ? $t('game.raise_disabled_tooltip') : (options.includes('bet') ? $t('game.bet_tooltip') : $t('game.raise_tooltip'))"
        class="btn-raise flex-[1.5] font-black uppercase rounded-xl text-[11px] lg:text-sm transition-all duration-150 active:scale-95 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed"
        :class="[
          { 'opacity-60 scale-[0.97]': pressedAction === 'bet' || pressedAction === 'raise' },
          pokerStore.blindsIncreasedFlag ? 'animate-pulse scale-105 z-10' : '',
        ]"
      >
        {{ options.includes('bet') ? $t('game.bet') : $t('game.raise') }}
      </button>
    </template>

    <!-- VOICE BUTTON (ALWAYS PRESENT) -->
    <button
      :id="`hud-voice-button-${templateSuffix}`"
      @mousedown="voice?.startRecording"
      @mouseup="voice?.stopRecording"
      @mouseleave="voice?.stopRecording"
      @touchstart.prevent="voice?.startRecording"
      @touchend.prevent="voice?.stopRecording"
      class="btn-voice w-11 lg:w-13 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90"
      :class="{
        'animate-pulse bg-red-500/20 border-red-500/50':
          voice?.isRecording.value,
      }"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        :class="voice?.isRecording.value ? 'text-red-500' : 'text-amber-500'"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { usePokerStore } from '../../store/pokerStore'
import { useResponsiveStore } from '../../store/responsiveStore'

const props = defineProps({
  isMyTurn: Boolean,
  canBlind: Boolean,
  blindInfo: Object,
  options: Array,
  isRaiseActionDisabled: Boolean,
})

const pokerStore = usePokerStore()
const responsive = useResponsiveStore()
const templateSuffix = computed(() => responsive.templateSuffix)
const pressedAction = ref(null)

const voice = inject('voice', null)

const emit = defineEmits(['action'])

const handleAction = (action) => {
  pressedAction.value = action
  emit('action', action)
  setTimeout(() => { pressedAction.value = null }, 400)
}
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

.btn-voice {
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.2);
}
.btn-voice:hover {
  background: rgba(251, 191, 36, 0.15);
  border-color: rgba(251, 191, 36, 0.4);
}
</style>
