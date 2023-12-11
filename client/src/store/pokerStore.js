import { createPinia, defineStore } from "pinia";
const pinia = createPinia();

export const usePokerStore = defineStore({id: 'pokerStore',
 // gameCode: "",
  state: () => ({
    gameCode: '',
  }),
  getters: {
    getGameCode(state) {
   //   return state.gameCode;
   return state.gameCode; //
    },
  },
  actions: {
    setGameCode(gameCode) {
      this.gameCode = gameCode;
    },
  },
});

export default pinia;
