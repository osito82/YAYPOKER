import { createPinia, defineStore } from "pinia";
const pinia = createPinia();

export const usePokerStore = defineStore({
  id: "pokerStore",
  state: () => ({
    socketMessage: null,
    conected: false,
    gameCredentials: {
      secretCode: "",
      gameCode: "",
      playerName: "",
    },
    players: [],
    communityCards: [],
    pot: 0,
    displayMsg: null,
    dealerLog: [],
    activePlayerId: null,
    bettingOptions: [],
    currentMaxBet: 0,
    myInfo: {
      id: null,
      cards: []
    },
    winnerInfo: null // New state for descriptive announcement
  }),
  getters: {
    getSocketMessage: (state) => state.socketMessage,
    getConnected: (state) => state.conected,
    getPLayers: (state) => state.players || [],
    getCommunityCards: (state) => state.communityCards || [],
    getPot: (state) => state.pot || 0,
    getDisplayMsg: (state) => state.displayMsg,
    getDealerLog: (state) => state.dealerLog,
    getActivePlayerId: (state) => state.activePlayerId,
    getBettingOptions: (state) => state.bettingOptions,
    getWinnerInfo: (state) => state.winnerInfo
  },
  actions: {
    setSocketMessage(message) {
      if (!message) return;
      
      try {
        const msgObj = JSON.parse(message);
        const gameData = msgObj.message;
        if (!gameData) return;

        console.log("POKER_STORE - Received:", gameData.action, gameData);

        // Reset winner info if a new hand/action starts
        if (gameData.action === "askForBlindBets" || gameData.action === "signUp") {
           this.winnerInfo = null;
        }

        // Update ID and private info immediately if available
        if (gameData.myPlayerInfo) {
          if (gameData.myPlayerInfo.playerId) {
            this.myInfo.id = gameData.myPlayerInfo.playerId;
          }
          if (gameData.myPlayerInfo.privateCards) {
            this.myInfo.cards = gameData.myPlayerInfo.privateCards;
          }
        }

        // Update display message
        const newMsg = gameData.data?.displayMsg ?? gameData.data?.msg ?? null;
        if (newMsg !== null) {
          this.displayMsg = newMsg;
          if (newMsg) {
            this.dealerLog.unshift({
              id: Date.now(),
              text: newMsg,
              type: gameData.type || 'public'
            });
            if (this.dealerLog.length > 10) this.dealerLog.pop();
          }
        }

        // Update Players
        if (gameData.players) {
          this.players = gameData.players.map(p => {
            if (p.id === this.myInfo.id) {
               return { ...p, cards: this.myInfo.cards };
            }
            return p;
          });
        }

        // Update Table State
        if (gameData.pot !== undefined) this.pot = gameData.pot;
        if (gameData.dealerCards) this.communityCards = gameData.dealerCards;

        // Handle Actions and Turns
        if (gameData.action === "askForBlindBets") {
          this.activePlayerId = gameData.data.id;
          this.bettingOptions = ["blind"];
        } else if (gameData.action?.startsWith("bettingCore")) {
          this.activePlayerId = gameData.data?.messageForId;
          this.bettingOptions = gameData.data?.action || [];
        } else if (gameData.action === "signUp" && gameData.type === "private") {
          this.myInfo.id = gameData.data?.id;
        } else if (gameData.action === "winner") {
          this.winnerInfo = gameData.data;
          this.activePlayerId = null;
          this.bettingOptions = [];
          // Keep winner info for 7 seconds (or until store reset)
          setTimeout(() => {
             // Optional: only clear if it hasn't changed
             if (this.winnerInfo === gameData.data) this.winnerInfo = null;
          }, 7000);
        }

      } catch (e) {
        console.error("POKER_STORE - Error parsing message", e);
      }
    },

    setConnected(status) {
      this.conected = status;
    },
    setGameCredentials(gameCode, secretCode, playerName) {
      this.gameCredentials.playerName = playerName;
      this.gameCredentials.gameCode = gameCode;
      this.gameCredentials.secretCode = secretCode;
    },
  },
});

export default pinia;
