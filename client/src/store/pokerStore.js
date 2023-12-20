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
    players: null,
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
      return state.players;
    },
    getDisplayMsg(state) {
      return state.displayMsg;
    },


  },
  actions: {
    setSocketMessage(message) {
      if (!message) this.socketMessage = {};
      const msgObj = JSON.parse(message);

      //     this.socketMessage = msgObj;

      const {
        message: {
          data: { displayMsg },
        },
      } = msgObj;
      this.displayMsg = displayMsg;


      const {
        message: { players },
      } = msgObj;
      this.players = players;
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
