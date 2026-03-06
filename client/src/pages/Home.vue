<template>
  <div
    id="home-viewport"
    class="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 select-none"
  >
    <div
      id="lobby-card-container"
      class="w-full max-w-lg bg-gray-900 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/5"
    >
      <!-- Header -->
      <div
        id="lobby-header"
        class="bg-black/40 p-8 flex flex-col items-center border-b border-white/5"
      >
        <Logo id="lobby-logo" class="mb-6 transform scale-150" />
        <h2
          id="lobby-subtitle"
          class="text-gray-200 text-xl font-black uppercase tracking-[0.3em] italic"
        >
          Texas Hold'em <span class="text-yellow-500">Lobby</span>
        </h2>
      </div>

      <!-- Form -->
      <div id="lobby-form-content" class="p-10 space-y-10">
        <!-- MODE: Selection (Home /) -->
        <template v-if="!isCreating">
          <!-- Create Game Section -->
          <div id="create-game-section" class="space-y-6">
            <button
              id="btn-create-game"
              @click="goToCreate"
              :disabled="joinCode.length > 0"
              class="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black py-5 px-6 rounded-xl focus:outline-none transition-all transform hover:-translate-y-1 shadow-xl uppercase tracking-[0.2em] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed text-base"
            >
              Create New Table
            </button>
            <p
              v-if="joinCode.length > 0"
              id="create-disabled-msg"
              class="text-gray-400 text-[12px] text-center uppercase tracking-widest italic font-bold"
            >
              Clear join code to create new table
            </p>
          </div>

          <!-- Join Game Section -->
          <div
            id="join-game-section"
            class="space-y-6 pt-8 border-t border-white/5"
          >
            <label
              id="label-join-existing"
              class="block text-gray-300 text-sm font-black uppercase tracking-[0.2em] mb-2"
            >
              Or Join Existing Table
            </label>

            <div id="join-inputs-group" class="space-y-4">
              <input
                id="input-player-name"
                v-model="playerName"
                class="shadow-inner appearance-none border border-white/10 rounded-xl w-full py-4 px-6 text-white bg-black/40 leading-tight focus:outline-none focus:border-yellow-500/50 transition-colors text-lg font-medium placeholder:text-gray-600"
                type="text"
                placeholder="Enter Your Name"
              />

              <input
                id="input-secret-code"
                v-model="secretCode"
                class="shadow-inner appearance-none border border-white/10 rounded-xl w-full py-4 px-6 text-white bg-black/40 leading-tight focus:outline-none focus:border-yellow-500/50 transition-colors text-lg font-mono placeholder:text-gray-600"
                type="password"
                maxlength="4"
                placeholder="Enter 4-Digit Pin (Secret)"
                @input="secretCode = secretCode.replace(/\D/g, '')"
              />

              <div
                id="join-code-input-wrapper"
                class="space-y-2 relative group"
              >
                <!-- Tooltip -->
                <div
                  v-if="joinCode && !isGameCodeValid"
                  id="error-tooltip"
                  class="absolute bottom-full left-0 mb-4 px-4 py-2 bg-red-600 text-white text-[12px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest z-20 whitespace-nowrap shadow-2xl border border-red-500"
                >
                  Format: XXXXX-XXXXX
                  <div
                    id="tooltip-arrow"
                    class="absolute top-full left-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-red-600"
                  ></div>
                </div>

                <div id="join-controls-flex" class="flex space-x-3">
                  <input
                    id="input-join-code"
                    v-model="joinCode"
                    class="shadow-inner appearance-none border rounded-xl w-full py-4 px-6 text-white bg-black/40 leading-tight focus:outline-none transition-colors font-mono uppercase text-lg tracking-widest placeholder:text-gray-600"
                    :class="
                      joinCode && !isGameCodeValid
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-white/10 focus:border-blue-500/50'
                    "
                    type="text"
                    placeholder="ABC12-DEF34"
                  />
                  <button
                    id="btn-join-game"
                    @click="joinGame"
                    :disabled="!isValidJoin"
                    class="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-8 rounded-xl focus:outline-none transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                  >
                    Join
                  </button>
                </div>
                <p
                  v-if="joinCode && !isGameCodeValid"
                  id="error-msg-format"
                  class="text-red-500 text-[12px] uppercase tracking-widest font-black ml-2 mt-2"
                >
                  Format must be XXXXX-XXXXX
                </p>
              </div>
            </div>
          </div>
        </template>

        <!-- MODE: New Game Created (/newgame) -->
        <div
          v-else
          id="create-mode-container"
          class="space-y-8 animate-fade-in"
        >
          <!-- Game Code Display -->
          <div
            id="generated-code-box"
            class="bg-black/40 p-6 rounded-2xl border border-yellow-500/20 text-center relative overflow-hidden shadow-inner"
          >
            <p
              id="label-table-code"
              class="text-gray-300 text-xs uppercase tracking-[0.3em] mb-3 font-black"
            >
              Your Table Code
            </p>
            <p
              id="display-generated-code"
              class="text-3xl font-mono font-black text-yellow-500 tracking-[0.2em] mb-6"
            >
              {{ generatedCode }}
            </p>

            <!-- QR Code Section -->
            <div
              id="qr-code-wrapper"
              class="mt-4 flex flex-col items-center bg-white p-4 rounded-2xl mx-auto w-fit shadow-2xl animate-fade-in"
            >
              <QRCodeVue3
                id="qr-component"
                :key="shareUrl"
                :width="180"
                :height="180"
                :value="shareUrl"
                :qrOptions="{
                  typeNumber: 0,
                  mode: 'Byte',
                  errorCorrectionLevel: 'H',
                }"
                :dotsOptions="{ type: 'rounded', color: '#000000' }"
                :backgroundOptions="{ color: '#ffffff' }"
                :cornersSquareOptions="{
                  type: 'extra-rounded',
                  color: '#000000',
                }"
                :download="false"
              />
              <p
                id="qr-helper-text"
                class="text-[11px] font-black text-gray-400 mt-4 uppercase tracking-tighter"
              >
                Share to invite players
              </p>
            </div>
          </div>

          <!-- Name Input for Creator -->
          <div id="creator-name-section" class="space-y-3">
            <label
              id="label-creator-name"
              class="block text-gray-300 text-xs font-black uppercase tracking-[0.2em] ml-2"
            >
              Set Your Display Name & Pin
            </label>
            <div id="creator-inputs-group" class="space-y-4">
              <input
                id="input-creator-name"
                v-model="playerName"
                class="shadow-inner appearance-none border border-white/10 rounded-xl w-full py-4 px-6 text-white bg-black/40 leading-tight focus:outline-none focus:border-green-500/50 transition-colors text-lg font-medium placeholder:text-gray-600"
                type="text"
                placeholder="Ex: Doyle Brunson"
              />
              <input
                id="input-creator-secret"
                v-model="secretCode"
                class="shadow-inner appearance-none border border-white/10 rounded-xl w-full py-4 px-6 text-white bg-black/40 leading-tight focus:outline-none focus:border-green-500/50 transition-colors text-lg font-mono placeholder:text-gray-600"
                type="password"
                maxlength="4"
                placeholder="4-Digit Pin (Secret)"
                @input="secretCode = secretCode.replace(/\D/g, '')"
              />
            </div>
          </div>

          <div id="creator-actions-grid" class="grid grid-cols-2 gap-4">
            <button
              id="btn-copy-code"
              @click="copyToClipboard"
              class="flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-4 px-4 rounded-xl transition-all uppercase tracking-widest text-xs"
            >
              <span id="copy-status-text">{{ copyStatus }}</span>
            </button>
            <button
              id="btn-start-playing"
              @click="startGame"
              :disabled="
                !playerName.trim() ||
                (secretCode.length > 0 && secretCode.length !== 4)
              "
              class="bg-green-600 hover:bg-green-500 text-white font-black py-4 px-4 rounded-xl shadow-xl transition-all transform hover:scale-105 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-widest text-xs"
            >
              Start Playing
            </button>
          </div>

          <button
            id="btn-cancel-create"
            @click="cancelCreate"
            class="w-full text-gray-400 hover:text-white text-[12px] font-black uppercase tracking-[0.2em] transition-colors"
          >
            ← Back to Lobby
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div
        id="lobby-footer"
        class="bg-black/60 p-6 text-center text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] border-t border-white/5"
      >
        &copy; 2026 <span class="text-yellow-500">OsoPoker</span>. All chips are
        virtual.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import QRCodeVue3 from 'qrcode-vue3'
import Logo from '../components/Logo.vue'
import { generateUniqueId, generateSecretCode, urlsFactory } from '../vutils'

const router = useRouter()
const route = useRoute()

// State
const playerName = ref('')
const secretCode = ref('')
const defaultSecret = ref('')
const joinCode = ref('')
const generatedCode = ref('')
const isCreating = ref(false)
const copyStatus = ref('Copy Code')

// Invitation URL for others (redirects to Lobby with joinCode parameter)
const shareUrl = computed(() => {
  if (!generatedCode.value) return ''

  const urls = urlsFactory()
  const url = urls.url
  url.searchParams.append('joinCode', generatedCode.value)
  return url.toString()
})

const checkRouteState = () => {
  if (route.name === 'newgame') {
    isCreating.value = true
    if (!generatedCode.value) {
      generatedCode.value = generateUniqueId()
    }
    if (!defaultSecret.value) {
      defaultSecret.value = generateSecretCode()
    }
    secretCode.value = ''
  } else {
    isCreating.value = false
    generatedCode.value = ''
    playerName.value = ''
    secretCode.value = ''
    defaultSecret.value = ''
  }
}

onMounted(() => {
  checkRouteState()
  if (route.query.joinCode) {
    joinCode.value = route.query.joinCode.toUpperCase()
  }
})

watch(
  () => route.query.joinCode,
  (newCode) => {
    if (newCode) {
      joinCode.value = newCode.toUpperCase()
    }
  },
)

watch(() => route.name, checkRouteState)

// Join Logic
const isGameCodeValid = computed(() => {
  const gameCodeRegex = /^[A-Z0-9]{5}-[A-Z0-9]{5}$/
  return gameCodeRegex.test(joinCode.value.toUpperCase())
})

const isValidJoin = computed(() => {
  return (
    playerName.value.trim().length > 0 &&
    isGameCodeValid.value &&
    secretCode.value.length === 4
  )
})

const joinGame = () => {
  if (isValidJoin.value) {
    router.push({
      name: 'game',
      params: { gameCode: joinCode.value.toUpperCase() },
      query: { playerName: playerName.value, secretCode: secretCode.value },
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
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl.value)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = shareUrl.value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    copyStatus.value = 'Copied!'
    setTimeout(() => {
      copyStatus.value = 'Copy Code'
    }, 2000)
  } catch (err) {
    copyStatus.value = 'Error'
  }
}

const startGame = () => {
  const finalSecret =
    secretCode.value.length === 4 ? secretCode.value : defaultSecret.value
  if (playerName.value.trim() && finalSecret) {
    router.push({
      name: 'game',
      params: { gameCode: generatedCode.value },
      query: { playerName: playerName.value, secretCode: finalSecret },
    })
  }
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
