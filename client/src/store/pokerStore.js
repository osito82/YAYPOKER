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
    dealerLog: [], // Historial de mensajes
    activePlayerId: null,
    bettingOptions: [],
    currentMaxBet: 0,
    myInfo: {
      id: null,
      cards: []
    }
  }),
  getters: {
    getSocketMessage(state) {
      return state.socketMessage;
    },
    getGameCredentials(state) {
      return state.gameCredentials;
    },
    getConnected(state) {
      return state.conected;
    },
    getPLayers(state) {
      return state.players || [];
    },
    getCommunityCards(state) {
      return state.communityCards || [];
    },
    getPot(state) {
      return state.pot || 0;
    },
    getDisplayMsg(state) {
      return state.displayMsg;
    },
    getDealerLog(state) {
      return state.dealerLog;
    },
    getActivePlayerId(state) {
      return state.activePlayerId;
    },
    getBettingOptions(state) {
      return state.bettingOptions;
    }
  },
  actions: {
    setSocketMessage(message) {
      if (!message) return;
      
      try {
        const msgObj = JSON.parse(message);
        this.socketMessage = msgObj;

        const gameData = msgObj.message;
        if (!gameData) return;

        // Extract display message
        let newMsg = null;
        if (gameData.data?.displayMsg) {
          newMsg = gameData.data.displayMsg;
        } else if (gameData.data?.msg) {
          newMsg = gameData.data.msg;
        }

        if (newMsg) {
          this.displayMsg = newMsg;
          // Añadir al log y mantener solo los últimos 5
          this.dealerLog.unshift({
            id: Date.now(),
            text: newMsg,
            type: gameData.type || 'public'
          });
          if (this.dealerLog.length > 5) this.dealerLog.pop();
        }

        // Extract players and their actions
        if (gameData.players) {
          this.players = gameData.players;
        }

        // Extract community cards
        if (gameData.dealerCards) {
          this.communityCards = gameData.dealerCards;
        } else if (gameData.data?.communityCards) {
          this.communityCards = gameData.data.communityCards;
        }

        // Extract pot
        if (gameData.pot !== undefined) {
          this.pot = gameData.pot;
        } else if (gameData.data?.pot !== undefined) {
          this.pot = gameData.data.pot;
        }

        // Handle Turn and Betting Options
        if (gameData.action?.startsWith("askForBets") || gameData.action?.startsWith("bettingCore")) {
           if (gameData.data?.action) {
             this.bettingOptions = gameData.data.action;
           }
           if (gameData.data?.messageForId) {
             this.activePlayerId = gameData.data.messageForId;
           } else if (gameData.myPlayerInfo?.playerId) {
              this.activePlayerId = gameData.myPlayerInfo.playerId;
           }
        }

        if (gameData.action === "askForBlindBets") {
           this.activePlayerId = gameData.data.id;
           this.bettingOptions = ["blind"];
        }

        // Handle private info and ID confirmation
        if (gameData.myPlayerInfo) {
          if (gameData.myPlayerInfo.playerId) {
            this.myInfo.id = gameData.myPlayerInfo.playerId;
          }
          if (gameData.myPlayerInfo.privateCards) {
            this.myInfo.cards = gameData.myPlayerInfo.privateCards;
            
            // Sync with players array
            const playerIdx = this.players.findIndex(p => p.id === this.myInfo.id);
            if (playerIdx !== -1) {
              this.players[playerIdx].cards = this.myInfo.cards;
            }
          }
        }

        // If it's a private signUp message, it confirms our ID
        if (gameData.action === "signUp" && gameData.type === "private" && gameData.data?.id) {
           this.myInfo.id = gameData.data.id;
        }

      } catch (e) {
        console.error("Error parsing socket message", e);
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
