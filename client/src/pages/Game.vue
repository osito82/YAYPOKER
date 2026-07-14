<template>
  <LeaveGameModal
    :visible="showLeaveModal"
    :title="
      $t(isPublic ? 'game.leave_title_public' : 'game.leave_title_private')
    "
    :message="
      $t(isPublic ? 'game.leave_msg_public' : 'game.leave_msg_private', {
        code: secretCode,
      })
    "
    @confirm="confirmLeave"
    @cancel="showLeaveModal = false"
  />
  <LobbyView
    v-if="!pokerStore.getIsGameStarted"
    :players="allPlayers"
    :hostId="pokerStore.getHostId"
    :myId="pokerStore.myInfo.id"
    :gameCode="gameCode"
    :lastError="pokerStore.getLastError"
    templateSuffix="Game"
    @start="startGame"
    @goBack="handleGoBack"
  />
  <component
    v-else
    :is="activeTemplate"
    :gameCode="gameCode"
    :playerName="playerName"
    :serverTime="serverTime"
    :isConnected="isConnected"
    :allPlayers="allPlayers"
    :myPlayer="myPlayer"
    :isMyTurn="isMyTurn"
    :canBlind="canBlind"
    :blindInfo="blindInfo"
    :options="options"
    :betAmount="betAmount"
    :minBet="minBet"
    :maxBet="maxBet"
    :sliderMin="callLevel"
    :pot="pokerStore.getPot"
    :communityCards="pokerStore.getCommunityCards"
    :activePlayerId="pokerStore.getActivePlayerId"
    :myPlayerId="pokerStore.myInfo.id"
    :isGuest="props.isGuest"
    :logs="[...pokerStore.getDealerLog].reverse()"
    :winnerInfo="pokerStore.getWinnerInfo"
    @action="sendAction"
    @setQuickBet="setQuickBet"
    @update:betAmount="(val) => (betAmount = val)"
    @sendMessage="sendMessage"
    @goHome="handleLogoClick"
  />
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  defineAsyncComponent,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePokerStore } from '../store/pokerStore'
import { useResponsiveStore } from '../store/responsiveStore'
import useWebSocket from '../use/useSockets'
import { useVoice } from '../use/useVoice'
import { urlsFactory } from '../vutils'
import LobbyView from '../components/LobbyView.vue'
import LeaveGameModal from '../components/LeaveGameModal.vue'
import { provide } from 'vue' // Add provide

// Async loading of templates for performance
const TemplateXSmall = defineAsyncComponent(
  () => import('./templates/TemplateXSmall.vue'),
)
const TemplateSmall = defineAsyncComponent(
  () => import('./templates/TemplateSmall.vue'),
)
const TemplateMedium = defineAsyncComponent(
  () => import('./templates/TemplateMedium.vue'),
)
const TemplateLarge = defineAsyncComponent(
  () => import('./templates/TemplateLarge.vue'),
)

const props = defineProps({
  isGuest: { type: Boolean, default: false },
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const pokerStore = usePokerStore()
const responsive = useResponsiveStore()
const gameCode = route.params.gameCode || 'default_Torneo'
const secretCode = route.params.secretCode

const isPublic = computed(() => {
  return (
    gameCode &&
    (gameCode.startsWith('P_') ||
      gameCode === 'PUBLIC' ||
      pokerStore.torneoId?.startsWith('P_'))
  )
})

const serverTime = ref(new Date().toLocaleTimeString())
let timeInterval = null

const showLeaveModal = ref(false)

const handleLogoClick = () => {
  showLeaveModal.value = true
}

const confirmLeave = () => {
  showLeaveModal.value = false
  disconnectSocket()
  router.push('/')
}

// Select template based on screen size
const activeTemplate = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall':
      return TemplateXSmall
    case 'small':
      return TemplateSmall
    case 'medium':
      return TemplateMedium
    default:
      return TemplateLarge
  }
})

// Logic for name/uuid generation
const playerName = ref(
  route.query.playerName ||
    (isPublic.value
      ? pokerStore.publicCredentials.playerName
      : pokerStore.privateCredentials.playerName) ||
    'Guest',
)

if (props.isGuest) {
  playerName.value = `Spectator_${Math.floor(Math.random() * 1000)}`
}

// Update playerName when players list arrives if we don't have it
watch(
  () => pokerStore.players,
  (newPlayers) => {
    if (!props.isGuest && secretCode) {
      const me = newPlayers.find((p) => p.secretCode === secretCode)
      if (me && me.name !== playerName.value) {
        playerName.value = me.name
      }
    }
  },
  { immediate: true, deep: true },
)

// Update URL if torneoId changes (e.g., from 'PUBLIC' to 'P_XXXXX')
watch(
  () => pokerStore.torneoId,
  (newTorneoId) => {
    const currentCode = route.params.gameCode
    if (newTorneoId && newTorneoId !== currentCode) {
      console.log(`Game - URL Sync: Changing ${currentCode} -> ${newTorneoId}`)
      router.replace({
        name: 'game.play',
        params: {
          ...route.params,
          gameCode: newTorneoId,
        },
        query: route.query,
      })
    }
  },
  { immediate: true },
)

const connectionOptions = {
  gameCode,
  playerName: playerName.value,
  secretCode: props.isGuest ? 'spectator' : secretCode,
  role: props.isGuest ? 'guest' : 'player',
}

const urls = urlsFactory()
const { connectSocket, disconnectSocket, sendMessage } = useWebSocket(
  urls.server,
  connectionOptions,
)

// VOICE INTEGRATION
const { isRecording, startRecording, stopRecording, addToQueue } =
  useVoice(sendMessage)

provide('voice', { isRecording, startRecording, stopRecording })

watch(
  () => pokerStore.lastVoiceMessage,
  (newVal) => {
    if (newVal && newVal.audioData) {
      if (newVal.playerId !== pokerStore.myInfo.id) {
        addToQueue(newVal.audioData)
      }
    }
  },
)

// COMPUTEDS
const isConnected = computed(() => pokerStore.getConnected)
const currentMaxBetOnTable = computed(
  () => pokerStore.getCurrentHighestBet || 0,
)
const lastRaiseAmount = computed(() => pokerStore.lastRaiseAmount || 20) // Default to BB if no raise
const allPlayers = computed(() => pokerStore.getPlayers || [])
const myPlayer = computed(() =>
  allPlayers.value.find(
    (p) => p.id === pokerStore.myInfo.id || p.name === playerName.value,
  ),
)
const isMyTurn = computed(
  () => !props.isGuest && pokerStore.getActivePlayerId === myPlayer.value?.id,
)
const options = computed(() =>
  props.isGuest ? [] : pokerStore.getBettingOptions || [],
)

const callLevel = computed(() => {
  const tableMax = currentMaxBetOnTable.value || 0
  const myAlreadyBet = myPlayer.value?.currentBet || 0
  const myTotal = maxBet.value || 0
  // The level we start at is the table's highest bet, but we can't exceed our total chips
  return Math.min(tableMax, myTotal)
})

const canBlind = computed(
  () => !props.isGuest && isMyTurn.value && options.value.includes('blind'),
)

const blindInfo = computed(() => {
  if (!canBlind.value) return null
  const amount =
    pokerStore.myInfo.requiredBlind ||
    (pokerStore.getDisplayMsg?.toLowerCase().includes('small')
      ? pokerStore.smallBlind
      : pokerStore.bigBlind)
  const type = pokerStore.getDisplayMsg?.toLowerCase().includes('small')
    ? 'Small'
    : 'Big'
  return { amount, type }
})

const minBet = computed(() => {
  const isRaiseAction =
    options.value.includes('raise') || options.value.includes('bet')
  const bigBlind = pokerStore.bigBlind || 20

  let baseMin = bigBlind
  if (currentMaxBetOnTable.value > 0) {
    baseMin = currentMaxBetOnTable.value + lastRaiseAmount.value
  }

  // If player has fewer chips than the required minimum,
  // their minimum (and maximum) bet is their total stack (All-In).
  return Math.min(baseMin, maxBet.value)
})

const maxBet = computed(() => {
  const stack = myPlayer.value?.chips || 0
  const alreadyBet = myPlayer.value?.currentBet || 0
  return stack + alreadyBet
})

const betAmount = ref(0)

// ACTIONS & WATCHERS
const setQuickBet = (m) => {
  if (m === 'all') betAmount.value = maxBet.value
  else {
    const callAmount = Math.max(
      0,
      currentMaxBetOnTable.value - (myPlayer.value?.currentBet || 0),
    )
    let a = currentMaxBetOnTable.value + (pokerStore.getPot + callAmount) * m
    betAmount.value = Math.min(
      Math.max(minBet.value, Math.round(a)),
      maxBet.value,
    )
  }
}

// Redirect back if PIN collision occurs
watch(
  () => pokerStore.getLastError,
  (newError) => {
    if (newError?.type === 'PIN_COLLISION') {
      console.warn('Redirecting due to PIN collision:', newError.message)
      handleGoBack()
    }
  },
  { immediate: true },
)

watch(isMyTurn, (newVal) => {
  if (newVal) {
    // Start exactly at current call level
    betAmount.value = callLevel.value
  }
})

watch([callLevel, maxBet], ([newMin, newMax]) => {
  if (isMyTurn.value) {
    if (betAmount.value < newMin) betAmount.value = newMin
    if (betAmount.value > newMax) betAmount.value = newMax
  }
})

function generateSecretCode() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}

const startGame = (data = {}) => {
  if (isConnected.value) {
    sendMessage({
      action: 'startGame',
      bots: data.bots,
      initialStack: data.initialStack,
    })
  }
}

const handleGoBack = () => {
  disconnectSocket()
  if (isPublic.value) {
    router.push('/public')
  } else {
    // Si hay un PIN_COLLISION o queremos volver atrás en privada,
    // mantenemos el código del torneo para que no tenga que volver a escribirlo.
    router.push({
      name: 'game.join',
      params: { gameCode: gameCode },
      query: { playerName: playerName.value },
    })
  }
}

const sendAction = (action) => {
  if (!isConnected.value) return
  switch (action) {
    case 'check':
      sendMessage({ action: 'setCheck' })
      break
    case 'call':
      sendMessage({ action: 'setCall' })
      break
    case 'fold':
      sendMessage({ action: 'fold' })
      break
    case 'bet':
    case 'raise':
      sendMessage({
        action: action === 'bet' ? 'setBet' : 'setRise',
        [action === 'bet' ? 'chipsToBet' : 'chipsToRiseBet']: betAmount.value,
      })
      break
    case 'blind':
      const blindAmount =
        pokerStore.myInfo.requiredBlind ||
        (pokerStore.getDisplayMsg?.toLowerCase().includes('small')
          ? pokerStore.smallBlind
          : pokerStore.bigBlind)
      sendMessage({ action: 'setBet', chipsToBet: blindAmount })
      break
  }
}

onMounted(() => {
  pokerStore.setGameCredentials(gameCode, secretCode, playerName.value)
  if (!isConnected.value) connectSocket()

  timeInterval = setInterval(() => {
    serverTime.value = new Date().toLocaleTimeString()
  }, 1000)
})

onBeforeUnmount(() => {
  disconnectSocket()
  pokerStore.resetState()
  if (timeInterval) clearInterval(timeInterval)
})
</script>
