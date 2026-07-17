import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSoundStore } from './soundStore'
import router from '../router'

export const usePokerStore = defineStore('pokerStore', () => {
  // State
  const socketMessage = ref(null)
  const connected = ref(false)

  // Separate credentials for public and private tables
  const savedPrivate = JSON.parse(
    localStorage.getItem('poker-private-credentials') ||
      localStorage.getItem('poker-credentials') ||
      '{}',
  )
  const savedPublic = JSON.parse(
    localStorage.getItem('poker-public-credentials') || '{}',
  )

  const privateCredentials = ref({
    playerName: savedPrivate.playerName || '',
    secretCode: savedPrivate.secretCode || '',
  })

  const publicCredentials = ref({
    playerName: savedPublic.playerName || '',
  })

  const gameCredentials = ref({
    secretCode: '',
    gameCode: '',
    playerName: '',
  })
  const players = ref([])
  const communityCards = ref([])
  const pot = ref(0)
  const pots = ref([])
  const displayMsg = ref(null)
  const dealerLog = ref([])
  const activePlayerId = ref(null)
  const bettingOptions = ref([])
  const currentHighestBet = ref(0)
  const lastRaiseAmount = ref(0)
  const myInfo = ref({
    id: null,
    cards: [],
  })
  const winnerInfo = ref(null)
  const odds = ref({ win: 0, tie: 0 })
  const autofoldStartTime = ref(null)
  const autofoldDuration = ref(600)
  const lobbyTimer = ref(null)
  const hostId = ref(null)
  const isGameStarted = ref(false)
  const torneoId = ref(null)
  const isPublic = ref(false)
  const stepChecker = ref({})
  const lastError = ref(null)
  const lastVoiceMessage = ref(null)

  // Blinds state
  const smallBlind = ref(10)
  const bigBlind = ref(20)
  const ante = ref(0)
  const blindLevel = ref(1)
  const blindsIncreasedFlag = ref(false)

  // Getters
  const getSocketMessage = computed(() => socketMessage.value)
  const getConnected = computed(() => connected.value)
  const getPlayers = computed(() => players.value || [])
  const getPLayers = getPlayers // Alias for backward compatibility
  const getCommunityCards = computed(() => communityCards.value || [])
  const getPot = computed(() => pot.value || 0)
  const getPots = computed(() => pots.value || [])
  const getDisplayMsg = computed(() => displayMsg.value)
  const getDealerLog = computed(() => dealerLog.value)
  const getActivePlayerId = computed(() => activePlayerId.value)
  const getBettingOptions = computed(() => bettingOptions.value)
  const getWinnerInfo = computed(() => winnerInfo.value)
  const getOdds = computed(() => odds.value)
  const getCurrentHighestBet = computed(() => currentHighestBet.value)
  const getAutofoldStartTime = computed(() => autofoldStartTime.value)
  const getAutofoldDuration = computed(() => autofoldDuration.value)
  const getLobbyTimer = computed(() => lobbyTimer.value)
  const getHostId = computed(() => hostId.value)
  const getIsGameStarted = computed(() => isGameStarted.value)
  const getTorneoId = computed(() => torneoId.value)
  const getIsPublic = computed(() => isPublic.value)
  const getStepChecker = computed(() => stepChecker.value || {})
  const getLastError = computed(() => lastError.value)

  const getCurrentHand = computed(() => {
    const me = players.value.find((p) => p.id === myInfo.value.id)
    if (!me || !me.currentPrize || !me.currentPrize.pokerHand) return null
    return me.currentPrize
  })

  // Actions
  function setSocketMessage(message) {
    if (!message) return

    try {
      const msgObj = JSON.parse(message)
      const gameData = msgObj.message
      if (!gameData) return

      console.log('POKER_STORE - Received:', gameData.action, gameData)

      // Only clear last error on a SUCCESSFUL signUp
      if (gameData.action === 'signUp' && gameData.data?.id) {
        lastError.value = null
      }

      // Update stepChecker
      if (gameData.stepChecker) {
        stepChecker.value = gameData.stepChecker
      }

      // Update torneoId from any message that carries it
      if (gameData.torneoId) {
        torneoId.value = gameData.torneoId
      } else if (gameData.data?.torneoId) {
        torneoId.value = gameData.data.torneoId
      }

      if (gameData.isPublic !== undefined) {
        isPublic.value = !!gameData.isPublic
      } else if (torneoId.value?.startsWith('P_')) {
        isPublic.value = true
      }

      // Update game started state based on server stepChecker
      if (gameData.stepChecker?.startGame) {
        isGameStarted.value = true
        lobbyTimer.value = null
      }

      // Reset lobby timer if game starts or hand is in progress
      if (
        [
          'askForBlindBets',
          'dealtPrivateCards',
          'gameRestarted',
          'noMorePlayers',
        ].includes(gameData.action) ||
        gameData.action?.startsWith('bettingCore')
      ) {
        lobbyTimer.value = null
        isGameStarted.value = true
      }

      // Update hostId if provided
      if (gameData.data?.hostId) {
        hostId.value = gameData.data.hostId
      } else if (gameData.hostId) {
        hostId.value = gameData.hostId
      }

      // Handle newHost message specifically if needed (though the above might cover it)
      if (gameData.action === 'newHost') {
        hostId.value = gameData.data.hostId
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
          // Play sounds based on message text
          const msgLower = newMsg.toLowerCase()
          if (msgLower.includes(' fold')) {
            useSoundStore().playFold()
          } else if (msgLower.includes(' bet') || msgLower.includes(' call') || msgLower.includes(' raise') || msgLower.includes(' all in')) {
            useSoundStore().playBet()
          } else if (msgLower.includes(' check')) {
            useSoundStore().playCheck()
          } else if (msgLower.includes('dealt') || msgLower.includes('flop') || msgLower.includes('turn') || msgLower.includes('river')) {
            useSoundStore().playDeal()
          }

          dealerLog.value.unshift({
            id: Date.now(),
            text: newMsg,
            type: gameData.type || 'public',
            action: gameData.action || gameData.method,
          })
          if (dealerLog.value.length > 500) dealerLog.value.pop()
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

        // AUTO-RECOVERY: If we refresh/update and there's less than 2 players in a public table,
        // force back to lobby state unless it's explicitly started
        if (isPublic.value && players.value.length < 2) {
          isGameStarted.value = false
        }
      }

      // Update Table State
      if (gameData.pot !== undefined) pot.value = gameData.pot
      if (gameData.pots !== undefined) pots.value = gameData.pots
      if (gameData.dealerCards) communityCards.value = gameData.dealerCards
      if (gameData.currentHighestBet !== undefined) {
        currentHighestBet.value = gameData.currentHighestBet
      }
      if (gameData.lastRaiseAmount !== undefined) {
        lastRaiseAmount.value = gameData.lastRaiseAmount
      }

      // Handle Actions and Turns
      if (gameData.action === 'lobbyTimer') {
        lobbyTimer.value = {
          timeRemaining: gameData.data.timeRemaining,
          totalDuration: gameData.data.totalDuration,
          connectedPlayers: gameData.data.connectedPlayers,
          readyPlayers: gameData.data.readyPlayers,
          timestamp: Date.now(),
        }
      } else if (gameData.action === 'lobbyError') {
        // We can use this to show why game hasn't started
        lastError.value = {
          message: gameData.data.displayMsg,
          type: 'LOBBY_ERROR',
        }
        if (lobbyTimer.value) {
          lobbyTimer.value.error = gameData.data.displayMsg
        }
      } else if (gameData.action === 'askForBlindBets') {
        activePlayerId.value = gameData.data.id
        bettingOptions.value = ['blind']
        displayMsg.value = gameData.data.displayMsg || ''
        if (gameData.data.blindAmount) {
          myInfo.value.requiredBlind = gameData.data.blindAmount
        }
        autofoldStartTime.value = Date.now()
        autofoldDuration.value = gameData.autofoldDuration || 600
      } else if (gameData.action?.startsWith('bettingCore')) {
        if (gameData.data?.messageForId) {
          activePlayerId.value = gameData.data.messageForId
          if (gameData.data.messageForId === myInfo.value.id) {
            useSoundStore().playYourTurn()
          }
        }
        if (gameData.data?.action) {
          bettingOptions.value = gameData.data.action
        }
        autofoldStartTime.value = Date.now()
        autofoldDuration.value = gameData.autofoldDuration || 600
      } else if (gameData.action === 'signUp' && gameData.type === 'private') {
        if (!gameData.data?.id && gameData.data?.displayMsg) {
          lastError.value = {
            message: gameData.data.displayMsg,
            type: gameData.data.errorType || 'SIGNUP_ERROR',
          }
        } else {
          myInfo.value.id = gameData.data?.id
          if (gameData.torneoId) {
            torneoId.value = gameData.torneoId
          }
          lastError.value = null
        }
      } else if (gameData.action === 'oddsUpdate') {
        odds.value = {
          win: Number(gameData.data.odds.win),
          tie: Number(gameData.data.odds.tie),
        }
      } else if (
        ['winner', 'winnerTournament'].includes(gameData.action) ||
        ['winner', 'winnerTournament'].includes(gameData.method)
      ) {
        winnerInfo.value = gameData.data || gameData
        activePlayerId.value = null
        bettingOptions.value = []
        autofoldStartTime.value = null
        
        useSoundStore().playWin()

        const currentWinnerData = winnerInfo.value
        const timeoutDuration =
          gameData.action === 'winnerTournament' ||
          gameData.method === 'winnerTournament' ||
          gameData.isTournamentWinner
            ? 120000
            : 25000

        setTimeout(() => {
          if (winnerInfo.value === currentWinnerData) {
            winnerInfo.value = null
          }
        }, timeoutDuration)
      } else if (gameData.action === 'blindsIncreased') {
        smallBlind.value = gameData.data.smallBlind
        bigBlind.value = gameData.data.bigBlind
        ante.value = gameData.data.ante
        blindLevel.value = gameData.data.level
        blindsIncreasedFlag.value = true

        // Explicitly log the increase if displayMsg is present (it should be handled by the general logger but let's be sure)
        if (gameData.data.displayMsg) {
          displayMsg.value = gameData.data.displayMsg
        }

        setTimeout(() => {
          blindsIncreasedFlag.value = false
        }, 3000) // Reset after 3 seconds
      } else if (
        ['setBet', 'setRise', 'setCall', 'setCheck', 'fold'].includes(
          gameData.action,
        )
      ) {
        if (gameData.data?.totalBet !== undefined) {
          currentHighestBet.value = Math.max(
            currentHighestBet.value,
            gameData.data.totalBet,
          )
        }

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
      } else if (gameData.action === 'voiceMessage') {
        lastVoiceMessage.value = { ...gameData.data, timestamp: Date.now() }
      } else if (gameData.action === 'forceLobby') {
        const isCurrentlyPublic = isPublic.value
        isGameStarted.value = false
        torneoId.value = null
        winnerInfo.value = null
        router.push(isCurrentlyPublic ? '/public' : '/')
      } else if (gameData.action === 'gameRestarted') {
        // Clear board and pot for new hand
        communityCards.value = []
        pot.value = 0
        pots.value = []
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

    const isPublicCode =
      gameCode && (gameCode.startsWith('P_') || gameCode === 'PUBLIC')

    if (isPublicCode) {
      publicCredentials.value = { playerName }
      localStorage.setItem(
        'poker-public-credentials',
        JSON.stringify(publicCredentials.value),
      )
    } else {
      privateCredentials.value = { playerName, secretCode }
      localStorage.setItem(
        'poker-private-credentials',
        JSON.stringify(privateCredentials.value),
      )
      // Cleanup old key if it exists
      localStorage.removeItem('poker-credentials')
    }
  }

  function clearError() {
    lastError.value = null
  }

  function resetState() {
    isGameStarted.value = false
    players.value = []
    communityCards.value = []
    pot.value = 0
    pots.value = []
    displayMsg.value = null
    dealerLog.value = []
    activePlayerId.value = null
    bettingOptions.value = []
    currentHighestBet.value = 0
    lastRaiseAmount.value = 0
    myInfo.value = { id: null, cards: [] }
    winnerInfo.value = null
    odds.value = { win: 0, tie: 0 }
    autofoldStartTime.value = null
    lobbyTimer.value = null
    hostId.value = null
    torneoId.value = null
    stepChecker.value = {}
    lastError.value = null
    lastVoiceMessage.value = null
  }

  return {
    // State (refs)
    socketMessage,
    connected,
    gameCredentials,
    privateCredentials,
    publicCredentials,
    players,
    communityCards,
    pot,
    pots,
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
    lastRaiseAmount,
    lobbyTimer,
    hostId,
    isGameStarted,
    torneoId,
    isPublic,
    smallBlind,
    bigBlind,
    ante,
    blindLevel,
    blindsIncreasedFlag,
    lastVoiceMessage,

    // Getters (computeds)
    getOdds,
    getSocketMessage,
    getConnected,
    getPlayers,
    getPLayers,
    getCommunityCards,
    getPot,
    getPots,
    getDisplayMsg,
    getDealerLog,
    getActivePlayerId,
    getBettingOptions,
    getWinnerInfo,
    getCurrentHighestBet,
    getAutofoldStartTime,
    getAutofoldDuration,
    getCurrentHand,
    getLobbyTimer,
    getHostId,
    getIsGameStarted,
    getTorneoId,
    getIsPublic,
    getStepChecker,
    getLastError,

    // Actions
    setSocketMessage,
    setConnected,
    setGameCredentials,
    clearWinnerInfo,
    clearError,
    resetState,
  }
})
