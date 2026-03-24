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
  const stepChecker = ref({})

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
  const getStepChecker = computed(() => stepChecker.value || {})

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

      // Update stepChecker
      if (gameData.stepChecker) {
        stepChecker.value = gameData.stepChecker
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
      } else if (
        ['winner', 'winnerTournament'].includes(gameData.action) ||
        ['winner', 'winnerTournament'].includes(gameData.method)
      ) {
        winnerInfo.value = gameData.data || gameData
        activePlayerId.value = null
        bettingOptions.value = []
        autofoldStartTime.value = null

        const currentWinnerData = gameData.data || gameData
        const timeoutDuration =
          gameData.action === 'winnerTournament' ||
          gameData.method === 'winnerTournament' ||
          gameData.isTournamentWinner
            ? 60000
            : 15000

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
  }

  return {
    // State (refs)
    socketMessage,
    connected,
    gameCredentials,
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
    smallBlind,
    bigBlind,
    ante,
    blindLevel,
    blindsIncreasedFlag,

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
    getStepChecker,

    // Actions
    setSocketMessage,
    setConnected,
    setGameCredentials,
    clearWinnerInfo,
  }
})
