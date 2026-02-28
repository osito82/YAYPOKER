import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePokerStore = defineStore('pokerStore', () => {
  // State
  const socketMessage = ref(null)
  const connected = ref(false)
  const gameCredentials = ref({
    secretCode: '',
    gameCode: '',
    playerName: '',
  })
  const players = ref([])
  const communityCards = ref([])
  const pot = ref(0)
  const displayMsg = ref(null)
  const dealerLog = ref([])
  const activePlayerId = ref(null)
  const bettingOptions = ref([])
  const currentHighestBet = ref(0)
  const myInfo = ref({
    id: null,
    cards: [],
  })
  const winnerInfo = ref(null)
  const autofoldStartTime = ref(null)
  const autofoldDuration = ref(600)

  // Getters
  const getSocketMessage = computed(() => socketMessage.value)
  const getConnected = computed(() => connected.value)
  const getPlayers = computed(() => players.value || [])
  const getPLayers = getPlayers // Alias for backward compatibility
  const getCommunityCards = computed(() => communityCards.value || [])
  const getPot = computed(() => pot.value || 0)
  const getDisplayMsg = computed(() => displayMsg.value)
  const getDealerLog = computed(() => dealerLog.value)
  const getActivePlayerId = computed(() => activePlayerId.value)
  const getBettingOptions = computed(() => bettingOptions.value)
  const getWinnerInfo = computed(() => winnerInfo.value)
  const getCurrentHighestBet = computed(() => currentHighestBet.value)
  const getAutofoldStartTime = computed(() => autofoldStartTime.value)
  const getAutofoldDuration = computed(() => autofoldDuration.value)

  // Actions
  function setSocketMessage(message) {
    if (!message) return

    try {
      const msgObj = JSON.parse(message)
      const gameData = msgObj.message
      if (!gameData) return

      console.log('POKER_STORE - Received:', gameData.action, gameData)

      // Reset winner info if a new hand/action starts
      if (
        gameData.action === 'askForBlindBets' ||
        gameData.action === 'signUp'
      ) {
        winnerInfo.value = null
      }

      // Update ID and private info immediately if available
      if (gameData.myPlayerInfo) {
        if (gameData.myPlayerInfo.playerId) {
          myInfo.value.id = gameData.myPlayerInfo.playerId
        }
        if (gameData.myPlayerInfo.privateCards) {
          myInfo.value.cards = gameData.myPlayerInfo.privateCards
        }
      }

      // Update display message
      const newMsg = gameData.data?.displayMsg ?? gameData.data?.msg ?? null
      if (newMsg !== null) {
        displayMsg.value = newMsg
        if (newMsg) {
          dealerLog.value.unshift({
            id: Date.now(),
            text: newMsg,
            type: gameData.type || 'public',
          })
          if (dealerLog.value.length > 10) dealerLog.value.pop()
        }
      }

      // Update Players
      if (gameData.players) {
        players.value = gameData.players.map((p) => {
          if (p.id === myInfo.value.id) {
            return { ...p, cards: myInfo.value.cards }
          }
          return p
        })
      }

      // Update Table State
      if (gameData.pot !== undefined) pot.value = gameData.pot
      if (gameData.dealerCards) communityCards.value = gameData.dealerCards
      if (gameData.currentHighestBet !== undefined) {
        currentHighestBet.value = gameData.currentHighestBet
      }

      // Handle Actions and Turns
      if (gameData.action === 'askForBlindBets') {
        activePlayerId.value = gameData.data.id
        bettingOptions.value = ['blind']
        autofoldStartTime.value = Date.now()
        autofoldDuration.value = gameData.autofoldDuration || 600 //10 minutes autoFold
      } else if (gameData.action?.startsWith('bettingCore')) {
        activePlayerId.value = gameData.data?.messageForId
        bettingOptions.value = gameData.data?.action || []
        autofoldStartTime.value = Date.now()
        autofoldDuration.value = gameData.autofoldDuration || 600 //10 minutes autoFold
      } else if (gameData.action === 'signUp' && gameData.type === 'private') {
        myInfo.value.id = gameData.data?.id
      } else if (gameData.action === 'winner' || gameData.method === 'winner') {
        winnerInfo.value = gameData.data || gameData
        activePlayerId.value = null
        bettingOptions.value = []
        autofoldStartTime.value = null
        // Keep winner info for 15 seconds
        const currentWinnerData = gameData.data || gameData
        setTimeout(() => {
          if (winnerInfo.value === currentWinnerData) winnerInfo.value = null
        }, 15000)
      } else if (['setBet', 'setRise', 'setCall', 'setCheck', 'fold'].includes(gameData.action)) {
        activePlayerId.value = null
        bettingOptions.value = []
        autofoldStartTime.value = null
      }
    } catch (e) {
      console.error('POKER_STORE - Error parsing message', e)
    }
  }

  function clearWinnerInfo() {
    winnerInfo.value = null
  }

  function setConnected(status) {
    connected.value = status
  }

  function setGameCredentials(gameCode, secretCode, playerName) {
    gameCredentials.value.playerName = playerName
    gameCredentials.value.gameCode = gameCode
    gameCredentials.value.secretCode = secretCode
  }

  return {
    // State (refs)
    socketMessage,
    connected,
    gameCredentials,
    players,
    communityCards,
    pot,
    displayMsg,
    dealerLog,
    activePlayerId,
    bettingOptions,
    currentHighestBet,
    myInfo,
    winnerInfo,
    autofoldStartTime,
    autofoldDuration,

    // Getters (computeds)
    getSocketMessage,
    getConnected,
    getPlayers,
    getPLayers,
    getCommunityCards,
    getPot,
    getDisplayMsg,
    getDealerLog,
    getActivePlayerId,
    getBettingOptions,
    getWinnerInfo,
    getCurrentHighestBet,
    getAutofoldStartTime,
    getAutofoldDuration,

    // Actions
    setSocketMessage,
    setConnected,
    setGameCredentials,
    clearWinnerInfo,
  }
})
