import { createPinia, defineStore } from "pinia";
const pinia = createPinia();

export const usePokerStore = defineStore({
  id: "pokerStore",
  // gameCode: "",
  state: () => ({
    gameCredentials: {
      secretCode:"",
      gameCode: "",
      playerName: "",
    },
  }),
  getters: {
    getGameCredentials(state) {
      //   return state.gameCode;
      return state.gameCredentials; //
    },
  },
  actions: {
    setGameCredentials(gameCode, secretCode, playerName) {
      this.gameCredentials.playerName = playerName;
      this.gameCredentials.gameCode = gameCode;
      this.gameCredentials.secretCode = secretCode;

    },
  },
});

export default pinia;
