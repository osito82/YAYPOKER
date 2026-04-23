<template>
  <div
    :id="`home-page-viewport-${templateSuffix}`"
    class="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-4 select-none transition-colors duration-300"
  >
    <div
      :id="`lobby-main-card-${templateSuffix}`"
      class="w-full bg-gray-50 dark:bg-gray-900 shadow-xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border border-gray-200 dark:border-white/5 transition-all duration-300"
      :class="cardClasses"
    >
      <!-- Header -->
      <div
        :id="`lobby-card-header-${templateSuffix}`"
        class="bg-gray-100 dark:bg-black/40 flex flex-col items-center border-b border-gray-200 dark:border-white/5"
        :class="headerPadding"
      >
        <Logo
          :id="`lobby-brand-logo-${templateSuffix}`"
          :class="logoScale"
          class="dark:invert-0 grayscale-0"
        />
        <h2
          :id="`lobby-game-subtitle-${templateSuffix}`"
          class="text-gray-600 dark:text-gray-200 font-black uppercase tracking-[0.3em] italic"
          :class="subtitleSize"
          v-html="
            $t('pages.lobby_home.subtitle', {
              span:
                '<span class=\'text-yellow-600 dark:text-yellow-500\'>' +
                $t('pages.lobby_home.subtitle_span') +
                '</span>',
            })
          "
        ></h2>
      </div>

      <!-- Form -->
      <div
        :id="`lobby-form-container-${templateSuffix}`"
        class="space-y-10"
        :class="formPadding"
      >
        <!-- Global Error Display -->
        <div
          v-if="pokerStore.getLastError"
          :id="`global-error-display-${templateSuffix}`"
          class="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 animate-shake"
        >
          <div class="bg-red-500 rounded-full p-1 mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="flex-1">
            <p
              class="text-red-600 dark:text-red-500 text-[10px] font-black uppercase tracking-widest mb-1"
            >
              {{ pokerStore.getLastError.type || 'Error' }}
            </p>
            <p
              class="text-gray-700 dark:text-gray-300 text-xs font-medium leading-relaxed"
            >
              {{ pokerStore.getLastError.message }}
            </p>
          </div>
          <button
            @click="pokerStore.clearError()"
            class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- MODE: Public Game (/public) -->
        <form v-if="isPublic" @submit.prevent="joinPublicGame" class="space-y-6">
          <div class="text-center">
            <h1
              class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-[0.4em] italic"
            >
              {{
                $t('pages.lobby_home.public_tables_title') || 'Public Tables'
              }}
            </h1>
            <p
              class="text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest mt-2"
            >
              {{
                $t('pages.lobby_home.public_tables_desc') ||
                'Join a table instantly and practice with others'
              }}
            </p>
          </div>

          <div class="space-y-4">
            <label
              class="block text-gray-500 dark:text-gray-300 text-xs font-black uppercase tracking-[0.2em] ml-2"
            >
              {{ $t('pages.lobby_home.setup_label') }}
            </label>
            <input
              v-model="playerName"
              v-focus
              class="shadow-inner appearance-none border border-gray-300 dark:border-white/10 rounded-xl w-full py-4 px-6 text-gray-900 dark:text-white bg-white dark:bg-black/40 leading-tight focus:outline-none focus:border-blue-500 transition-colors text-lg font-medium placeholder:text-gray-400 dark:placeholder:text-gray-600"
              type="text"
              :placeholder="$t('pages.lobby_home.setup_name_placeholder')"
            />

            <p
              class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center italic mt-2"
            >
              A secure PIN will be generated automatically for your session.
            </p>
          </div>

          <button
            type="submit"
            :disabled="!playerName || !playerName.trim()"
            class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 px-4 rounded-xl shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-widest text-base"
          >
            {{ $t('pages.lobby_home.play_now_btn') || 'Play Now' }}
          </button>

          <button
            type="button"
            @click="router.push('/lobby')"
            class="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-[12px] font-black uppercase tracking-[0.2em] transition-colors"
          >
            {{ $t('lobby.back_to_selection') }}
          </button>
        </form>

        <!-- MODE: Selection (Home /lobby) -->
        <template v-else-if="!isCreating">
          <form
            :id="`join-game-form-section-${templateSuffix}`"
            @submit.prevent="joinGame"
            class="space-y-6"
          >
            <div
              :id="`join-game-title-wrapper-${templateSuffix}`"
              class="text-center"
            >
              <h1
                :id="`new-game-main-title-${templateSuffix}`"
                class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-[0.4em] italic"
              >
                <span
                  v-if="joinCode"
                  v-html="
                    $t('pages.lobby_home.join_table', {
                      span:
                        '<span class=\'text-yellow-600 dark:text-yellow-500\'>' +
                        $t('pages.lobby_home.join_table_span') +
                        '</span>',
                    })
                  "
                ></span>
                <span
                  v-else
                  v-html="
                    $t('pages.lobby_home.join_existing', {
                      span:
                        '<span class=\'text-yellow-600 dark:text-yellow-500\'>' +
                        $t('pages.lobby_home.join_existing_span') +
                        '</span>',
                    })
                  "
                ></span>
              </h1>
            </div>

            <div
              :id="`join-game-inputs-wrapper-${templateSuffix}`"
              class="space-y-4"
            >
              <label
                :id="`join-game-input-label-${templateSuffix}`"
                class="block text-gray-500 dark:text-gray-300 text-sm font-black uppercase tracking-[0.2em] mb-2"
              >
                {{ $t('pages.lobby_home.setup_label') }}
              </label>
              <input
                :id="`player-name-input-field-${templateSuffix}`"
                v-model="playerName"
                v-focus
                class="shadow-inner appearance-none border border-gray-300 dark:border-white/10 rounded-xl w-full py-4 px-6 text-gray-900 dark:text-white bg-white dark:bg-black/40 leading-tight focus:outline-none focus:border-yellow-500 transition-colors text-lg font-medium placeholder:text-gray-400 dark:placeholder:text-gray-600"
                type="text"
                :placeholder="$t('pages.lobby_home.name_placeholder')"
              />

              <label
                :id="`join-game-input-label-pin-${templateSuffix}`"
                class="block text-gray-500 dark:text-gray-300 text-sm font-black uppercase tracking-[0.2em] mb-2"
              >
                {{ $t('pages.lobby_home.setup_label_pin') }}
              </label>
              <input
                :id="`player-secret-pin-input-${templateSuffix}`"
                v-model="secretCode"
                class="shadow-inner appearance-none border border-gray-300 dark:border-white/10 rounded-xl w-full py-4 px-6 text-gray-900 dark:text-white bg-white dark:bg-black/40 leading-tight focus:outline-none focus:border-yellow-500 transition-colors text-lg font-mono placeholder:text-gray-400 dark:placeholder:text-gray-600"
                maxlength="4"
                :placeholder="$t('pages.lobby_home.pin_placeholder')"
                @input="secretCode = secretCode.replace(/\D/g, '')"
              />

              <label
                :id="`join-game-input-label-table-code-${templateSuffix}`"
                class="block text-gray-500 dark:text-gray-300 text-sm font-black uppercase tracking-[0.2em] mb-2"
              >
                {{ $t('pages.lobby_home.setup_table_code') }}
              </label>

              <div
                :id="`game-join-code-input-wrapper-${templateSuffix}`"
                class="space-y-2 relative group"
              >
                <div
                  v-if="joinCode && !isGameCodeValid"
                  :id="`join-code-error-tooltip-${templateSuffix}`"
                  class="absolute bottom-full left-0 mb-4 px-4 py-2 bg-red-600 text-white text-[12px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest z-20 whitespace-nowrap shadow-2xl border border-red-500"
                >
                  {{ $t('pages.lobby_home.format_tooltip') }}
                  <div
                    :id="`error-tooltip-pointer-${templateSuffix}`"
                    class="absolute top-full left-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-red-600"
                  ></div>
                </div>

                <div
                  :id="`join-controls-action-layout-${templateSuffix}`"
                  class="flex space-x-3"
                >
                  <input
                    :id="`game-table-join-code-input-${templateSuffix}`"
                    v-model="joinCode"
                    class="shadow-inner appearance-none border rounded-xl w-full py-4 px-6 text-gray-900 dark:text-white bg-white dark:bg-black/40 leading-tight focus:outline-none transition-colors font-mono uppercase text-lg tracking-widest placeholder:text-gray-400 dark:placeholder:text-gray-600"
                    :class="
                      joinCode && !isGameCodeValid
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-gray-300 dark:border-white/10 focus:border-blue-500'
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
                    {{ $t('pages.lobby_home.join_btn') }}
                  </button>
                </div>
                <p
                  v-if="joinCode && !isGameCodeValid"
                  :id="`join-code-format-error-message-${templateSuffix}`"
                  class="text-red-600 dark:text-red-500 text-[12px] uppercase tracking-widest font-black ml-2 mt-2"
                >
                  {{ $t('pages.lobby_home.format_error') }}
                </p>
              </div>
            </div>

            <button
              type="button"
              @click="router.push('/')"
              class="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-[12px] font-black uppercase tracking-[0.2em] transition-colors"
            >
              {{ $t('tournament.back_to_home') }}
            </button>
          </form>
        </template>

        <!-- MODE: New Game Created (/new) -->
        <div
          v-else
          :id="`create-game-success-view-${templateSuffix}`"
          class="space-y-8 animate-fade-in"
        >
          <div
            :id="`new-game-title-wrapper-${templateSuffix}`"
            class="text-center"
          >
            <h1
              :id="`new-game-main-title-${templateSuffix}`"
              class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-[0.4em] italic"
              v-html="
                $t('pages.lobby_home.new_game', {
                  span:
                    '<span class=\'text-yellow-600 dark:text-yellow-500\'>' +
                    $t('pages.lobby_home.new_game_span') +
                    '</span>',
                })
              "
            ></h1>
          </div>

          <div
            :id="`generated-table-code-display-box-${templateSuffix}`"
            class="bg-gray-100 dark:bg-black/40 rounded-2xl border border-yellow-500/20 dark:border-yellow-500/20 text-center relative overflow-hidden shadow-inner"
            :class="generatedBoxPadding"
          >
            <p
              :id="`table-code-display-label-${templateSuffix}`"
              class="text-gray-500 dark:text-gray-300 text-xs uppercase tracking-[0.3em] mb-3 font-black"
            >
              {{ $t('pages.lobby_home.table_code_label') }}
            </p>
            <p
              :id="`table-code-text-display-${templateSuffix}`"
              class="text-3xl font-mono font-black text-yellow-600 dark:text-yellow-500 tracking-[0.2em]"
            >
              {{ generatedCode }}
            </p>
          </div>

          <form
            :id="`creator-info-setup-section-${templateSuffix}`"
            @submit.prevent="startGame"
            class="space-y-3"
          >
            <div
              :id="`creator-info-inputs-wrapper-${templateSuffix}`"
              class="space-y-4"
            >
              <label
                :id="`creator-name-setup-label-${templateSuffix}`"
                class="block text-gray-500 dark:text-gray-300 text-xs font-black uppercase tracking-[0.2em] ml-2"
              >
                {{ $t('pages.lobby_home.setup_label') }}
              </label>
              <input
                :id="`creator-name-input-field-${templateSuffix}`"
                v-model="playerName"
                v-focus
                class="shadow-inner appearance-none border border-gray-300 dark:border-white/10 rounded-xl w-full py-4 px-6 text-gray-900 dark:text-white bg-white dark:bg-black/40 leading-tight focus:outline-none focus:border-green-500 transition-colors text-lg font-medium placeholder:text-gray-400 dark:placeholder:text-gray-600"
                type="text"
                :placeholder="$t('pages.lobby_home.setup_name_placeholder')"
              />
              <label
                :id="`creator-pin-setup-label-${templateSuffix}`"
                class="block text-gray-500 dark:text-gray-300 text-xs font-black uppercase tracking-[0.2em] ml-2"
              >
                {{ $t('pages.lobby_home.setup_label_pin') }}
              </label>
              <input
                :id="`creator-secret-pin-input-${templateSuffix}`"
                v-model="secretCode"
                class="shadow-inner appearance-none border border-gray-300 dark:border-white/10 rounded-xl w-full py-4 px-6 text-gray-900 dark:text-white bg-white dark:bg-black/40 leading-tight focus:outline-none focus:border-green-500 transition-colors text-lg font-mono placeholder:text-gray-400 dark:placeholder:text-gray-600"
                maxlength="4"
                :placeholder="$t('pages.lobby_home.pin_placeholder')"
                @input="secretCode = secretCode.replace(/\D/g, '')"
              />
            </div>

            <div
              :id="`creator-actions-button-grid-${templateSuffix}`"
              class="mt-8"
            >
              <button
                :id="`start-game-submit-button-${templateSuffix}`"
                type="submit"
                :disabled="
                  !playerName.trim() ||
                  (secretCode.length > 0 && secretCode.length !== 4)
                "
                class="w-full bg-green-600 hover:bg-green-500 text-white font-black py-5 px-4 rounded-xl shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-widest text-base"
              >
                {{ $t('pages.lobby_home.start_btn') }}
              </button>
            </div>
          </form>

          <button
            :id="`cancel-creation-back-button-${templateSuffix}`"
            @click="cancelCreate"
            class="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-[12px] font-black uppercase tracking-[0.2em] transition-colors"
          >
            {{ $t('lobby.back_to_selection') }}
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div
        :id="`lobby-page-footer-${templateSuffix}`"
        class="bg-gray-100 dark:bg-black/60 text-center text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] border-t border-gray-200 dark:border-white/5 transition-colors duration-300"
        :class="footerPadding"
        v-html="
          $t('pages.lobby_home.footer', {
            span:
              '<span class=\'text-yellow-600 dark:text-yellow-500\'>' +
              $t('pages.lobby_home.brand') +
              '</span>',
          })
        "
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'
import { useResponsiveStore } from '../store/responsiveStore'
import { usePokerStore } from '../store/pokerStore'
import QRCodeVue3 from 'qrcode-vue3'
import Logo from '../components/Logo.vue'
import {
  generateUniqueId,
  generatePublicId,
  generateSecretCode,
  urlsFactory,
  copyToClipboard as copyToClipboardUtil,
} from '../vutils'

const responsive = useResponsiveStore()
const pokerStore = usePokerStore()
const router = useRouter()
const route = useRoute()

// Focus directive
const vFocus = {
  mounted: (el) => el.focus(),
}

// State
const playerName = ref('')
const secretCode = ref('')
const defaultSecret = ref('')
const joinCode = ref('')
const generatedCode = ref('')
const isCreating = ref(false)
const isPublic = ref(false)
const copyStatus = ref('Copy Code')

// Watch for mode changes to load appropriate credentials
watch(
  () => isPublic.value,
  (newIsPublic) => {
    // Only auto-fill if the user hasn't typed anything yet or if it matches the current stored values
    if (newIsPublic) {
      playerName.value = pokerStore.publicCredentials.playerName || ''
      secretCode.value = ''
    } else {
      playerName.value = pokerStore.privateCredentials.playerName || ''
      secretCode.value = pokerStore.privateCredentials.secretCode || ''
    }
  },
  { immediate: true },
)

const templateSuffix = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall':
      return 'TemplateXSmall'
    case 'small':
      return 'TemplateSmall'
    case 'medium':
      return 'TemplateMedium'
    default:
      return 'TemplateLarge'
  }
})

// Responsive UI Computeds
const cardClasses = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall':
      return 'max-w-full rounded-[1.5rem]'
    case 'small':
      return 'max-w-[400px] rounded-[2rem]'
    default:
      return 'max-w-lg rounded-[2rem]'
  }
})

const headerPadding = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall':
      return 'p-4'
    case 'small':
      return 'p-6'
    default:
      return 'p-8'
  }
})

const logoScale = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall':
      return 'mb-3 scale-100'
    case 'small':
      return 'mb-4 scale-125'
    default:
      return 'mb-6 scale-150'
  }
})

const subtitleSize = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall':
      return 'text-sm'
    case 'small':
      return 'text-lg'
    default:
      return 'text-xl'
  }
})

const formPadding = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall':
      return 'p-6 space-y-6'
    case 'small':
      return 'p-8 space-y-8'
    default:
      return 'p-10 space-y-10'
  }
})

const footerPadding = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall':
      return 'p-4'
    default:
      return 'p-6'
  }
})

const qrSize = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall':
      return 120
    case 'small':
      return 150
    default:
      return 180
  }
})

const generatedBoxPadding = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall':
      return 'p-4'
    default:
      return 'p-6'
  }
})

const checkRouteState = () => {
  if (route.name === 'lobby.new' || route.path === '/new') {
    isCreating.value = true
    isPublic.value = false
    if (!generatedCode.value) {
      generatedCode.value = generateUniqueId()
    }
    if (!defaultSecret.value) {
      defaultSecret.value = generateSecretCode()
    }
  } else if (route.name === 'lobby.public' || route.path === '/public') {
    isCreating.value = false
    isPublic.value = true
    generatedCode.value = ''
    defaultSecret.value = ''
  } else if (
    route.name === 'game.join' ||
    route.query.joinCode ||
    route.params.gameCode
  ) {
    isCreating.value = false
    isPublic.value = false
    joinCode.value = (
      route.params.gameCode ||
      route.query.joinCode ||
      ''
    ).toUpperCase()
    if (route.query.playerName) playerName.value = route.query.playerName
    if (route.params.secretCode) secretCode.value = route.params.secretCode
    defaultSecret.value = ''
  } else {
    isCreating.value = false
    isPublic.value = false
    generatedCode.value = ''
    defaultSecret.value = ''
  }
}

onMounted(() => {
  checkRouteState()
})

watch(
  () => [
    route.name,
    route.params.gameCode,
    route.params.secretCode,
    route.query.joinCode,
    route.path,
  ],
  () => {
    checkRouteState()
  },
)

const shareUrl = computed(() => {
  const urls = urlsFactory()
  const code = isCreating.value ? generatedCode.value : joinCode.value
  if (!code) return ''

  return `${urls.url}/join/${code}`
})

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
    pokerStore.clearError()
    router.push({
      name: 'game.play',
      params: {
        gameCode: joinCode.value.toUpperCase(),
        secretCode: secretCode.value,
      },
      query: { playerName: playerName.value },
    })
  }
}

const joinPublicGame = async () => {
  if (!playerName.value || !playerName.value.trim()) {
    const el = document.getElementById(
      `player-name-input-field-${templateSuffix.value}`,
    )
    if (el) el.focus()
    return
  }

  // Generamos un PIN único UUID v4 para evitar colisiones en mesas públicas
  const finalSecret = uuidv4()

  pokerStore.clearError()

  try {
    const urls = urlsFactory()
    // Consultamos al servidor cuál es la mejor mesa pública disponible
    const response = await fetch(`${urls.serverHttp}/api/public-table`)
    const data = await response.json()
    const targetCode = data.torneoId || generatePublicId()

    router.push({
      name: 'game.play',
      params: {
        gameCode: targetCode,
        secretCode: finalSecret,
      },
      query: { playerName: playerName.value.trim() },
    })
  } catch (error) {
    console.error('LobbyHome - Error fetching public table:', error)
    // Fallback en caso de error de red
    router.push({
      name: 'game.play',
      params: {
        gameCode: generatePublicId(),
        secretCode: finalSecret,
      },
      query: { playerName: playerName.value.trim() },
    })
  }
}

const goToCreate = () => {
  router.push({ name: 'lobby.new' })
}

const cancelCreate = () => {
  router.push('/lobby')
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
    pokerStore.clearError()
    router.push({
      name: 'game.play',
      params: {
        gameCode: generatedCode.value,
        secretCode: finalSecret,
      },
      query: { playerName: playerName.value },
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

.animate-shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
