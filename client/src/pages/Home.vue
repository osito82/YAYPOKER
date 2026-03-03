<template>
  <div
    class="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4"
  >
    <div
      class="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700"
    >
      <!-- Header -->
      <div
        class="bg-gray-700 p-6 flex flex-col items-center border-b border-gray-600"
      >
        <Logo class="mb-4 transform scale-125" />
        <h2 class="text-gray-300 text-lg font-light tracking-wide">
          Texas Hold'em Lobby
        </h2>
      </div>

      <!-- Form -->
      <div class="p-8 space-y-8">
        <!-- MODE: Selection (Home /) -->
        <template v-if="!isCreating">
          <!-- Create Game Section -->
          <div class="space-y-4">
            <button
              @click="goToCreate"
              class="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-900 font-bold py-4 px-4 rounded focus:outline-none focus:shadow-outline transition-all transform hover:-translate-y-0.5 shadow-lg uppercase tracking-wider"
            >
              Create new Poker Game
            </button>
          </div>

          <!-- Join Game Section -->
          <div class="space-y-4 pt-4 border-t border-gray-700">
            <label
              class="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-1"
            >
              Or Join Existing Table
            </label>
            
            <div class="space-y-3">
              <input
                v-model="playerName"
                class="shadow appearance-none border border-gray-600 rounded w-full py-3 px-4 text-gray-200 bg-gray-900 leading-tight focus:outline-none focus:border-yellow-500 transition-colors"
                type="text"
                placeholder="Your Name"
              />
              
              <div class="flex space-x-2">
                <input
                  v-model="joinCode"
                  class="shadow appearance-none border border-gray-600 rounded w-full py-3 px-4 text-gray-200 bg-gray-900 leading-tight focus:outline-none focus:border-blue-500 transition-colors font-mono uppercase"
                  type="text"
                  placeholder="Ex: ABC12-DEF34"
                />
                <button
                  @click="joinGame"
                  :disabled="!isValidJoin"
                  class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- MODE: New Game Created (/newgame) -->
        <div v-else class="space-y-6 animate-fade-in">
          <!-- Game Code Display -->
          <div class="bg-gray-900 p-4 rounded-lg border border-yellow-500/30 text-center relative overflow-hidden">
            <p class="text-gray-400 text-xs uppercase tracking-widest mb-2">Your Table Code</p>
            <p class="text-2xl font-mono font-black text-yellow-500 tracking-wider">{{ generatedCode }}</p>
            
            <!-- QR Code Section -->
            <div class="mt-4 flex justify-center bg-white p-2 rounded-lg mx-auto w-fit shadow-inner">
              <QRCodeVue3
                :width="160"
                :height="160"
                :value="gameUrl"
                :qrOptions="{ typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'H' }"
                :dotsOptions="{ type: 'rounded', color: '#000000' }"
                :backgroundOptions="{ color: '#ffffff' }"
                :cornersSquareOptions="{ type: 'extra-rounded', color: '#000000' }"
                :download="false"
              />
            </div>
            <p class="text-[10px] text-gray-500 mt-2 uppercase">Scan to play on mobile</p>
          </div>
          
          <!-- Name Input for Creator -->
          <div class="space-y-2">
            <label class="block text-gray-400 text-xs font-bold uppercase tracking-widest">
              Set Your Display Name
            </label>
            <input
              v-model="playerName"
              class="shadow appearance-none border border-gray-600 rounded w-full py-3 px-4 text-gray-200 bg-gray-900 leading-tight focus:outline-none focus:border-green-500 transition-colors"
              type="text"
              placeholder="Ex: Doyle Brunson"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="copyToClipboard"
              class="flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              <span>{{ copyStatus }}</span>
            </button>
            <button
              @click="startGame"
              :disabled="!playerName.trim()"
              class="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              Start Playing
            </button>
          </div>
          
          <button 
            @click="cancelCreate" 
            class="w-full text-gray-500 hover:text-gray-400 text-sm"
          >
            ← Cancel and go back
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="bg-gray-900 p-4 text-center text-gray-500 text-xs">
        &copy; 2026 OsoPoker. All chips are virtual.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import QRCodeVue3 from 'qrcode-vue3'
import Logo from '../components/Logo.vue'
import { generateUniqueId } from '../vutils'

const router = useRouter()
const route = useRoute()

// State
const playerName = ref('')
const joinCode = ref('')
const generatedCode = ref('')
const isCreating = ref(false)
const copyStatus = ref('Copy Code')

const gameUrl = computed(() => {
  if (!generatedCode.value) return ''
  const base = window.location.origin
  return `${base}/game/${generatedCode.value}`
})

const checkRouteState = () => {
  if (route.name === 'newgame') {
    isCreating.value = true
    if (!generatedCode.value) {
      generatedCode.value = generateUniqueId()
    }
  } else {
    isCreating.value = false
    generatedCode.value = ''
    playerName.value = '' // Reset name when going back
  }
}

onMounted(checkRouteState)
watch(() => route.name, checkRouteState)

// Join Logic
const isValidJoin = computed(() => {
  const gameCodeRegex = /^[A-Z0-9]{5}-[A-Z0-9]{5}$/
  return (
    playerName.value.trim().length > 0 &&
    gameCodeRegex.test(joinCode.value.toUpperCase())
  )
})

const joinGame = () => {
  if (isValidJoin.value) {
    router.push({
      name: 'game',
      params: { gameCode: joinCode.value.toUpperCase() },
      query: { playerName: playerName.value }
    })
  }
}

// Create Logic
const goToCreate = () => {
  router.push({ name: 'newgame' })
}

const cancelCreate = () => {
  router.push({ name: 'home' })
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    copyStatus.value = 'Copied!'
    setTimeout(() => {
      copyStatus.value = 'Copy Code'
    }, 2000)
  } catch (err) {
    copyStatus.value = 'Error'
  }
}

const startGame = () => {
  if (playerName.value.trim()) {
    router.push({
      name: 'game',
      params: { gameCode: generatedCode.value },
      query: { playerName: playerName.value }
    })
  }
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
