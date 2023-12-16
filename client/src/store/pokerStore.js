import { createPinia, defineStore } from "pinia";
const pinia = createPinia();

export const usePokerStore = defineStore({
  id: "pokerStore",
  state: () => ({
    conected: false,
    gameCredentials: {
      secretCode: "",
      gameCode: "",
      playerName: "",
    },
  }),
  getters: {
    getGameCredentials(state) {
      return state.gameCredentials;
    },
    getConnected(state) {
      return state.conected;
    },
  },
  actions: {
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
