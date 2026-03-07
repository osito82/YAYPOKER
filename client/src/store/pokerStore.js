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
  const odds = ref({ win: 0, tie: 0 })
  const autofoldStartTime = ref(null)
  const autofoldDuration = ref(600)

  const lobbyCountdown = ref(null)
  const lobbyStartTime = ref(null)
  let lobbyInterval = null
  
  const stepChecker = ref(null)

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
  const getOdds = computed(() => odds.value)
  const getCurrentHighestBet = computed(() => currentHighestBet.value)
  const getAutofoldStartTime = computed(() => autofoldStartTime.value)
  const getAutofoldDuration = computed(() => autofoldDuration.value)
  const getLobbyCountdown = computed(() => lobbyCountdown.value)
  const getIsLobby = computed(() => {
    // Si no tenemos stepChecker, asumimos que estamos en lobby por defecto
    if (!stepChecker.value) return true
    return !stepChecker.value.blindsBetting
  })

  const getCurrentHand = computed(() => {
    const me = players.value.find((p) => p.id === myInfo.value.id)
    if (!me || !me.currentPrize || !me.currentPrize.pokerHand) return null
    return me.currentPrize
  })

  const stopLobbyTimer = () => {
    if (lobbyInterval) {
      clearInterval(lobbyInterval)
      lobbyInterval = null
    }
  }

  const startLocalLobbyTimer = (seconds) => {
    stopLobbyTimer()
    lobbyCountdown.value = seconds
    lobbyInterval = setInterval(() => {
      if (lobbyCountdown.value !== null && lobbyCountdown.value > 0) {
        lobbyCountdown.value--
      } else {
        stopLobbyTimer()
        lobbyCountdown.value = null
      }
    }, 1000)
  }

  // Actions
  function setSocketMessage(message) {
    if (!message) return

    try {
      const msgObj = JSON.parse(message)
      const gameData = msgObj.message
      if (!gameData) return

      console.log('POKER_STORE - Received:', gameData.action, gameData)
      
      if (gameData.stepChecker) {
        stepChecker.value = gameData.stepChecker
      }

      // Reset winner info ONLY if a new hand/action starts and we don't want the old one
      if (
        [
          // 'askForBlindBets',
          // 'gameRestarted',
          // 'dealtPrivateCards',
        ].includes(gameData.action)
      ) {
        winnerInfo.value = null
        odds.value = { win: 0, tie: 0 }
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
      if (gameData.action === 'lobbyTimer') {
        startLocalLobbyTimer(gameData.data.timeRemaining)
      } else if (gameData.action === 'askForBlindBets') {
        stopLobbyTimer()
        lobbyCountdown.value = null
        activePlayerId.value = gameData.data.id
        bettingOptions.value = ['blind']
        autofoldStartTime.value = Date.now()
        autofoldDuration.value = gameData.autofoldDuration || 600
      } else if (gameData.action?.startsWith('bettingCore')) {
        stopLobbyTimer()
        lobbyCountdown.value = null
        if (gameData.data?.messageForId) {
          activePlayerId.value = gameData.data.messageForId
        }
        if (gameData.data?.action) {
          bettingOptions.value = gameData.data.action
        }
        autofoldStartTime.value = Date.now()
        autofoldDuration.value = gameData.autofoldDuration || 600
      } else if (gameData.action === 'signUp' && gameData.type === 'private') {
        myInfo.value.id = gameData.data?.id
      } else if (gameData.action === 'oddsUpdate') {
        odds.value = {
          win: Number(gameData.data.odds.win),
          tie: Number(gameData.data.odds.tie),
        }
      } else if (gameData.action === 'winner' || gameData.method === 'winner') {
        winnerInfo.value = gameData.data || gameData
        activePlayerId.value = null
        bettingOptions.value = []
        autofoldStartTime.value = null
        const currentWinnerData = gameData.data || gameData
        setTimeout(() => {
          if (winnerInfo.value === currentWinnerData) {
            winnerInfo.value = null
          }
        }, 15000)
      } else if (
        ['setBet', 'setRise', 'setCall', 'setCheck', 'fold'].includes(
          gameData.action,
        )
      ) {
        // Only clear if this message doesn't have new turn info
        // (Action confirmations usually don't, but let's be safe)
        if (!gameData.data?.messageForId && !gameData.data?.id) {
          activePlayerId.value = null
          bettingOptions.value = []
          autofoldStartTime.value = null
        } else {
          // If it HAS turn info, use it
          activePlayerId.value = gameData.data.messageForId || gameData.data.id
          if (gameData.data.action) bettingOptions.value = gameData.data.action
        }
      } else if (gameData.action === 'gameRestarted') {
        // Clear board and pot for new hand
        communityCards.value = []
        pot.value = 0
        currentHighestBet.value = 0
        // winnerInfo.value = null // Removed to prevent premature closing for all players
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
    odds,
    autofoldStartTime,
    autofoldDuration,
    lobbyCountdown,
    lobbyStartTime,
    stepChecker,

    // Getters (computeds)
    getOdds,
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
    getCurrentHand,
    getLobbyCountdown,
    getIsLobby,

    // Actions
    setSocketMessage,
    setConnected,
    setGameCredentials,
    clearWinnerInfo,
  }
})
