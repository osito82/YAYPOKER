// src/router.js
import { createRouter, createWebHistory } from 'vue-router'
import LobbyHome from './pages/LobbyHome.vue'
import About from './pages/About.vue'
import Game from './pages/Game.vue'

const routes = [
  {
    name: 'home',
    path: '/',
    component: LobbyHome,
  },
  {
    name: 'newgame',
    path: '/newgame',
    component: LobbyHome,
    props: { isNewGame: true },
  },
  {
    name: 'game',
    path: '/game/:gameCode',
    component: Game,
    beforeEnter: (to, from) => {
      const { playerName, secretCode } = to.query
      if (!playerName || !secretCode) {
        // Redirige a Home si falta info, pasando joinCode
        return { name: 'home', query: { joinCode: to.params.gameCode } }
      }
      return true // continuar normalmente
    },
  },
  {
    name: 'guest',
    path: '/game/:gameCode/guest',
    component: Game,
    props: { isGuest: true }
  },
  { name: 'about', path: '/about', component: About },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router