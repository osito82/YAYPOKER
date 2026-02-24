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
  },
  actions: {
    setSocketMessage(message) {
      if (!message) return;
      
      try {
        const msgObj = JSON.parse(message);
        this.socketMessage = msgObj;

        // Extract display message
        if (msgObj.message?.data?.displayMsg) {
          this.displayMsg = msgObj.message.data.displayMsg;
        }

        // Extract players
        if (msgObj.message?.players) {
          this.players = msgObj.message.players;
        }

        // Extract community cards (assuming they might be in message or data)
        if (msgObj.message?.communityCards) {
          this.communityCards = msgObj.message.communityCards;
        } else if (msgObj.message?.data?.communityCards) {
          this.communityCards = msgObj.message.data.communityCards;
        }

        // Extract pot
        if (msgObj.message?.pot !== undefined) {
          this.pot = msgObj.message.pot;
        } else if (msgObj.message?.data?.pot !== undefined) {
          this.pot = msgObj.message.data.pot;
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
