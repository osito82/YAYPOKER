<template>
  <LobbyView
    v-if="!pokerStore.getIsGameStarted"
    :players="allPlayers"
    :hostId="pokerStore.getHostId"
    :myId="pokerStore.myInfo.id"
    :gameCode="gameCode"
    templateSuffix="Game"
    @start="startGame"
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
    :pot="pokerStore.getPot"
    :communityCards="pokerStore.getCommunityCards"
    :activePlayerId="pokerStore.getActivePlayerId"
    :myPlayerId="pokerStore.myInfo.id"
    :logs="[...pokerStore.getDealerLog].reverse()"
    :winnerInfo="pokerStore.getWinnerInfo"
    @action="sendAction"
    @setQuickBet="setQuickBet"
    @update:betAmount="(val) => (betAmount = val)"
    @sendMessage="sendMessage"
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
import { usePokerStore } from '../store/pokerStore'
import { useResponsiveStore } from '../store/responsiveStore'
import useWebSocket from '../use/useSockets'
import { urlsFactory } from '../vutils'
import LobbyView from '../components/LobbyView.vue'

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

const route = useRoute()
const pokerStore = usePokerStore()
const responsive = useResponsiveStore()
const gameCode = route.params.gameCode || 'default_Torneo'
const secretCode = route.params.secretCode

const serverTime = ref(new Date().toLocaleTimeString())
let timeInterval = null

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
const playerName = ref(route.query.playerName || 'Guest')

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
const canBlind = computed(
  () => !props.isGuest && isMyTurn.value && options.value.includes('blind'),
)

const blindInfo = computed(() => {
  if (!canBlind.value) return null
  const amount =
    pokerStore.myInfo.requiredBlind ||
    (pokerStore.getDisplayMsg?.toLowerCase().includes('small') ? 10 : 20)
  const type = pokerStore.getDisplayMsg?.toLowerCase().includes('small')
    ? 'Small'
    : 'Big'
  return { amount, type }
})

const minBet = computed(() => {
  const isRaiseAction = options.value.includes('raise')
  const baseMin = isRaiseAction
    ? currentMaxBetOnTable.value + lastRaiseAmount.value
    : currentMaxBetOnTable.value > 0
      ? currentMaxBetOnTable.value + 20
      : 20

  return Math.min(baseMin, maxBet.value)
})

const maxBet = computed(() => {
  const stack = myPlayer.value?.chips || 0
  const alreadyBet = myPlayer.value?.currentBet || 0
  return stack + alreadyBet
})

const betAmount = ref(minBet.value)

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

watch(isMyTurn, (newVal) => {
  if (newVal) {
    betAmount.value = minBet.value
  }
})

watch([minBet, maxBet], ([newMin, newMax]) => {
  if (isMyTurn.value) {
    if (betAmount.value < newMin) betAmount.value = newMin
    if (betAmount.value > newMax) betAmount.value = newMax
  }
})

function generateSecretCode() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}

const startGame = () => {
  if (isConnected.value) {
    sendMessage({ action: 'startGame' })
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
        (pokerStore.getDisplayMsg?.toLowerCase().includes('small') ? 10 : 20)
      sendMessage({ action: 'setBet', chipsToBet: blindAmount })
      break
  }
}

const router = useRouter()

onMounted(() => {
  pokerStore.setGameCredentials(gameCode, secretCode, playerName.value)
  if (!isConnected.value) connectSocket()

  timeInterval = setInterval(() => {
    serverTime.value = new Date().toLocaleTimeString()
  }, 1000)
})

onBeforeUnmount(() => {
  disconnectSocket()
  if (timeInterval) clearInterval(timeInterval)
})
</script>
