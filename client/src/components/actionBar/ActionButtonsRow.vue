<template>
  <div class="flex gap-1.5 w-full h-10 lg:h-12">
    <template v-if="canBlind">
      <button
        @click="$emit('action', 'blind')"
        class="flex-1 bg-yellow-500 text-black font-black uppercase rounded-lg shadow-lg active:scale-95 text-[10px] lg:text-sm px-2"
      >
        <template v-if="blindInfo">
          Post {{ blindInfo.type }} Blind ${{ blindInfo.amount }}
        </template>
        <template v-else>
          Post Blind
        </template>
      </button>
    </template>

    <template v-else>
      <button
        @click="$emit('action', 'fold')"
        :disabled="!isMyTurn || !options.includes('fold')"
        class="flex-1 bg-white/5 border border-white/10 text-gray-400 font-black uppercase rounded-lg hover:bg-red-600/20 disabled:opacity-20 text-[10px] lg:text-sm"
      >
        Fold
      </button>

      <button
        @click="$emit('action', 'check')"
        :disabled="!isMyTurn || !options.includes('check')"
        class="flex-1 bg-white/5 border border-white/10 text-gray-200 font-black uppercase rounded-lg hover:bg-white/10 disabled:opacity-20 text-[10px] lg:text-sm"
      >
        Check
      </button>

      <button
        @click="$emit('action', 'call')"
        :disabled="!isMyTurn || !options.includes('call')"
        class="flex-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black uppercase rounded-lg hover:bg-blue-600/40 disabled:opacity-20 text-[10px] lg:text-sm"
      >
        Call
      </button>

      <button
        @click="$emit('action', options.includes('bet') ? 'bet' : 'raise')"
        :disabled="isRaiseActionDisabled"
        class="flex-[1.5] font-black uppercase rounded-lg shadow-lg disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed text-[10px] lg:text-sm active:scale-95 transition-all"
        :class="[
          pokerStore.blindsIncreasedFlag
            ? 'bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-pulse scale-105 z-10'
            : 'bg-yellow-500 text-black'
        ]"
      >
        {{ options.includes('bet') ? 'Bet' : 'Raise' }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { usePokerStore } from '../../store/pokerStore'

defineProps({
  isMyTurn: Boolean,
  canBlind: Boolean,
  blindInfo: Object,
  options: Array,
  isRaiseActionDisabled: Boolean,
})

const pokerStore = usePokerStore()

defineEmits(['action'])
</script>
