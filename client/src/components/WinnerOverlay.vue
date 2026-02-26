<template>
  <Transition
    enter-active-class="transition duration-500 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-300 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div v-if="winnerInfo" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-yellow-500/50 rounded-[2rem] shadow-[0_0_100px_rgba(234,179,8,0.2)] overflow-hidden">
        
        <!-- Decoration -->
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
        
        <div class="p-8 flex flex-col items-center text-center">
          <!-- Trophy Icon -->
          <div class="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.4)] animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-black" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05l-3.293 3.293a1 1 0 01-1.414 0l-3.293-3.293a1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 3.323V3a1 1 0 011-1zm-1 8.274l-.81 2.519L5.25 13.73l2.257-2.257-.313-3.2 2.056 1.028v1.973zm2 0V9.301l2.056-1.028-.313 3.2 2.257 2.257-2.94-1.028-.81-2.519z" clip-rule="evenodd" />
            </svg>
          </div>

          <h2 class="text-4xl font-black text-white uppercase tracking-tighter mb-2">
            {{ winnerInfo.winner.name }} <span class="text-yellow-500">Wins!</span>
          </h2>
          
          <div class="text-5xl font-mono font-black text-yellow-400 mb-6 drop-shadow-lg">
            +${{ winnerInfo.winner.amount }}
          </div>

          <!-- Winning Hand -->
          <div class="bg-white/5 border border-white/10 rounded-2xl p-6 w-full mb-6">
            <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-3">Winning Hand</span>
            <div class="text-2xl font-bold text-white mb-4">{{ winnerInfo.winner.handName }}</div>
            
            <div class="flex justify-center gap-2">
              <Card v-for="(card, i) in winnerInfo.winner.winningCards" :key="i" size="medium" :numSymbol="card" />
            </div>
          </div>

          <!-- Other Players -->
          <div class="w-full text-left">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 border-b border-white/5 pb-2">Other Players</span>
            <div class="grid grid-cols-2 gap-4">
              <div v-for="player in opponentsHands" :key="player.playerId" class="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                <div>
                  <div class="text-xs font-bold text-gray-300">{{ player.name }}</div>
                  <div class="text-[10px] text-yellow-500/70 font-mono">${{ player.chips }}</div>
                  <div class="text-[7px] text-gray-500 italic uppercase tracking-tighter">{{ player.pokerHand || 'Folded' }}</div>
                </div>
                <div class="flex -space-x-4 opacity-60 scale-75 origin-right">
                   <!-- Mostramos solo 2 cartas si las tenemos, o el dorso -->
                   <template v-if="player.prizeCards && player.prizeCards.length > 0">
                      <Card v-for="(c, idx) in player.prizeCards.slice(0,2)" :key="idx" size="small" :numSymbol="c" />
                   </template>
                   <template v-else>
                      <div class="w-8 h-12 bg-gray-800 rounded border border-white/10"></div>
                      <div class="w-8 h-12 bg-gray-800 rounded border border-white/10"></div>
                   </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Info -->
          <div class="mt-8 flex gap-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              Next Round in few seconds
            </div>
            <div>Pot: $0 (Cleared)</div>
          </div>

        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue';
import Card from './Card.vue';

const props = defineProps({
  winnerInfo: Object
});

const opponentsHands = computed(() => {
  if (!props.winnerInfo?.allHands) return [];
  return props.winnerInfo.allHands.filter(h => h.playerId !== props.winnerInfo.winner.playerId);
});
</script>
