<template>
  <div
    :id="`home-page-viewport-${templateSuffix}`"
    class="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 select-none"
  >
    <div
      :id="`lobby-main-card-${templateSuffix}`"
      class="w-full bg-gray-900 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/5"
      :class="cardClasses"
    >
      <!-- Header -->
      <div
        :id="`lobby-card-header-${templateSuffix}`"
        class="bg-black/40 flex flex-col items-center border-b border-white/5"
        :class="headerPadding"
      >
        <Logo :id="`lobby-brand-logo-${templateSuffix}`" :class="logoScale" />
        <h2
          :id="`lobby-game-subtitle-${templateSuffix}`"
          class="text-gray-200 font-black uppercase tracking-[0.3em] italic"
          :class="subtitleSize"
        >
          Texas Hold'em <span class="text-yellow-500">Lobby</span>
        </h2>
      </div>

      <!-- Form -->
      <div :id="`lobby-form-container-${templateSuffix}`" class="space-y-10" :class="formPadding">
        <!-- MODE: Selection (Home /) -->
        <template v-if="!isCreating">
          <!-- Join Game Section -->
          <form
            :id="`join-game-form-section-${templateSuffix}`"
            @submit.prevent="joinGame"
            class="space-y-6"
          >

                    <div :id="`join-game-title-wrapper-${templateSuffix}`" class="text-center">
            <h1 :id="`new-game-main-title-${templateSuffix}`" class="text-3xl font-black text-white uppercase tracking-[0.4em] italic">
          
          
                <span v-if="joinCode">
  Join <span class="text-yellow-500">Table</span>
</span>
<span v-else>
  Join Existing <span class="text-yellow-500">Table</span>
</span>
         
            </h1>
          </div>


            <label
              :id="`join-game-input-label-${templateSuffix}`"
              class="block text-gray-300 text-sm font-black uppercase tracking-[0.2em] mb-2"
            >
               Your info
            </label>










            <div :id="`join-game-inputs-wrapper-${templateSuffix}`" class="space-y-4">
              <input
                :id="`player-name-input-field-${templateSuffix}`"
                v-model="playerName"
                v-focus
                class="shadow-inner appearance-none border border-white/10 rounded-xl w-full py-4 px-6 text-white bg-black/40 leading-tight focus:outline-none focus:border-yellow-500/50 transition-colors text-lg font-medium placeholder:text-gray-600"
                type="text"
                placeholder="Enter Your Name"
              />

              <input
                :id="`player-secret-pin-input-${templateSuffix}`"
                v-model="secretCode"
                class="shadow-inner appearance-none border border-white/10 rounded-xl w-full py-4 px-6 text-white bg-black/40 leading-tight focus:outline-none focus:border-yellow-500/50 transition-colors text-lg font-mono placeholder:text-gray-600"
                type="password"
                maxlength="4"
                placeholder="Invent 4-Digit Pin"
                @input="secretCode = secretCode.replace(/\D/g, '')"
              />

              <div
                :id="`game-join-code-input-wrapper-${templateSuffix}`"
                class="space-y-2 relative group"
              >
                <!-- Tooltip -->
                <div
                  v-if="joinCode && !isGameCodeValid"
                  :id="`join-code-error-tooltip-${templateSuffix}`"
                  class="absolute bottom-full left-0 mb-4 px-4 py-2 bg-red-600 text-white text-[12px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest z-20 whitespace-nowrap shadow-2xl border border-red-500"
                >
                  Format: XXXXX-XXXXX
                  <div
                    :id="`error-tooltip-pointer-${templateSuffix}`"
                    class="absolute top-full left-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-red-600"
                  ></div>
                </div>

                <div :id="`join-controls-action-layout-${templateSuffix}`" class="flex space-x-3">
                  <input
                    :id="`game-table-join-code-input-${templateSuffix}`"
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
                    :id="`join-game-submit-button-${templateSuffix}`"
                    type="submit"
                    :disabled="!isValidJoin"
                    class="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-8 rounded-xl focus:outline-none transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                  >
                    Join
                  </button>
                </div>
                <p
                  v-if="joinCode && !isGameCodeValid"
                  :id="`join-code-format-error-message-${templateSuffix}`"
                  class="text-red-500 text-[12px] uppercase tracking-widest font-black ml-2 mt-2"
                >
                  Format must be XXXXX-XXXXX
                </p>
              </div>
            </div>
          </form>
        </template>

        <!-- MODE: New Game Created (/newgame) -->
        <div
          v-else
          :id="`create-game-success-view-${templateSuffix}`"
          class="space-y-8 animate-fade-in"
        >
          <div :id="`new-game-title-wrapper-${templateSuffix}`" class="text-center">
            <h1 :id="`new-game-main-title-${templateSuffix}`" class="text-3xl font-black text-white uppercase tracking-[0.4em] italic">
              New <span class="text-yellow-500">Game</span>
            </h1>
          </div>

          <!-- Game Code Display -->
          <div
            :id="`generated-table-code-display-box-${templateSuffix}`"
            class="bg-black/40 rounded-2xl border border-yellow-500/20 text-center relative overflow-hidden shadow-inner"
            :class="generatedBoxPadding"
          >
            <p
              :id="`table-code-display-label-${templateSuffix}`"
              class="text-gray-300 text-xs uppercase tracking-[0.3em] mb-3 font-black"
            >
              Your Table Code
            </p>
            <p
              :id="`table-code-text-display-${templateSuffix}`"
              class="text-3xl font-mono font-black text-yellow-500 tracking-[0.2em]"
            >
              {{ generatedCode }}
            </p>
          </div>

          <!-- Name Input for Creator -->
          <form :id="`creator-info-setup-section-${templateSuffix}`" @submit.prevent="startGame" class="space-y-3">
            <label
              :id="`creator-name-setup-label-${templateSuffix}`"
              class="block text-gray-300 text-xs font-black uppercase tracking-[0.2em] ml-2"
            >
              Set Your Display Name & Pin
            </label>
            <div :id="`creator-info-inputs-wrapper-${templateSuffix}`" class="space-y-4">
              <input
                :id="`creator-name-input-field-${templateSuffix}`"
                v-model="playerName"
                v-focus
                class="shadow-inner appearance-none border border-white/10 rounded-xl w-full py-4 px-6 text-white bg-black/40 leading-tight focus:outline-none focus:border-green-500/50 transition-colors text-lg font-medium placeholder:text-gray-600"
                type="text"
                placeholder="Ex: Osito Malafama"
              />
              <input
                :id="`creator-secret-pin-input-${templateSuffix}`"
                v-model="secretCode"
                class="shadow-inner appearance-none border border-white/10 rounded-xl w-full py-4 px-6 text-white bg-black/40 leading-tight focus:outline-none focus:border-green-500/50 transition-colors text-lg font-mono placeholder:text-gray-600"
                type="password"
                maxlength="4"
                placeholder="Invent 4-Digit Pin"
                @input="secretCode = secretCode.replace(/\D/g, '')"
              />
            </div>

            <div :id="`creator-actions-button-grid-${templateSuffix}`" class="mt-8">
              <button
                :id="`start-game-submit-button-${templateSuffix}`"
                type="submit"
                :disabled="
                  !playerName.trim() ||
                  (secretCode.length > 0 && secretCode.length !== 4)
                "
                class="w-full bg-green-600 hover:bg-green-500 text-white font-black py-5 px-4 rounded-xl shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-widest text-base"
              >
                Start Playing
              </button>
            </div>
          </form>

          <button
            :id="`cancel-creation-back-button-${templateSuffix}`"
            @click="cancelCreate"
            class="w-full text-gray-400 hover:text-white text-[12px] font-black uppercase tracking-[0.2em] transition-colors"
          >
            ← Back to Lobby
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div
        :id="`lobby-page-footer-${templateSuffix}`"
        class="bg-black/60 text-center text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] border-t border-white/5"
        :class="footerPadding"
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
import { useResponsiveStore } from '../store/responsiveStore'
import QRCodeVue3 from 'qrcode-vue3'
import Logo from '../components/Logo.vue'
import { generateUniqueId, generateSecretCode, urlsFactory, copyToClipboard as copyToClipboardUtil } from '../vutils'

const responsive = useResponsiveStore()
const router = useRouter()
const route = useRoute()

// Focus directive
const vFocus = {
  mounted: (el) => el.focus()
}

// State
const playerName = ref('')
const secretCode = ref('')
const defaultSecret = ref('')
const joinCode = ref('')
const generatedCode = ref('')
const isCreating = ref(false)
const copyStatus = ref('Copy Code')

const templateSuffix = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall': return 'TemplateXSmall'
    case 'small': return 'TemplateSmall'
    case 'medium': return 'TemplateMedium'
    default: return 'TemplateLarge'
  }
})

// Responsive UI Computeds
const cardClasses = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall': return 'max-w-full rounded-[1.5rem]'
    case 'small': return 'max-w-[400px] rounded-[2rem]'
    default: return 'max-w-lg rounded-[2rem]'
  }
})

const headerPadding = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall': return 'p-4'
    case 'small': return 'p-6'
    default: return 'p-8'
  }
})

const logoScale = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall': return 'mb-3 scale-100'
    case 'small': return 'mb-4 scale-125'
    default: return 'mb-6 scale-150'
  }
})

const subtitleSize = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall': return 'text-sm'
    case 'small': return 'text-lg'
    default: return 'text-xl'
  }
})

const formPadding = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall': return 'p-6 space-y-6'
    case 'small': return 'p-8 space-y-8'
    default: return 'p-10 space-y-10'
  }
})

const footerPadding = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall': return 'p-4'
    default: return 'p-6'
  }
})

const qrSize = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall': return 120
    case 'small': return 150
    default: return 180
  }
})

const generatedBoxPadding = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall': return 'p-4'
    default: return 'p-6'
  }
})

// Invitation URL for others (redirects to Lobby with joinCode parameter)

const checkRouteState = () => {
  if (route.name === 'lobby.new' || route.path === '/newgame') {
    isCreating.value = true
    if (!generatedCode.value) {
      generatedCode.value = generateUniqueId()
    }
    if (!defaultSecret.value) {
      defaultSecret.value = generateSecretCode()
    }
    secretCode.value = ''
  } else if (route.name === 'game.join' || route.query.joinCode) {
    isCreating.value = false
    joinCode.value = (route.params.gameCode || route.query.joinCode || '').toUpperCase()
    playerName.value = ''
    // Pre-fill secret if provided in path
    secretCode.value = route.params.secretCode || ''
    defaultSecret.value = ''
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
})

watch(
  () => [route.name, route.params.gameCode, route.params.secretCode, route.query.joinCode],
  () => {
    checkRouteState()
  }
)

// Invitation URL for others (redirects to /join/:gameCode)
const shareUrl = computed(() => {
  const urls = urlsFactory()
  const code = isCreating.value ? generatedCode.value : joinCode.value
  if (!code) return ''

  return `${urls.url}/join/${code}`
})

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
      name: 'game.play',
      params: { 
        gameCode: joinCode.value.toUpperCase(),
        secretCode: secretCode.value
      },
      query: { playerName: playerName.value }
    })
  }
}

// Create Logic
const goToCreate = () => {
  router.push({ name: 'lobby.new' })
}

const cancelCreate = () => {
  router.push({ name: 'lobby.home' })
}

const copyToClipboard = async () => {
  const success = await copyToClipboardUtil(shareUrl.value)
  if (success) {
    copyStatus.value = 'Copied!'
    setTimeout(() => {
      copyStatus.value = 'Copy Code'
    }, 2000)
  } else {
    copyStatus.value = 'Error'
  }
}

const startGame = () => {
  const finalSecret =
    secretCode.value.length === 4 ? secretCode.value : defaultSecret.value
  if (playerName.value.trim() && finalSecret) {
    router.push({
      name: 'game.play',
      params: { 
        gameCode: generatedCode.value,
        secretCode: finalSecret
      },
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
