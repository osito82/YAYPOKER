// src/router.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import LobbyHome from './pages/LobbyHome.vue'
import About from './pages/About.vue'
import Game from './pages/Game.vue'
import NotFound from './pages/NotFound.vue'

const routes = [
  {
    name: 'landing',
    path: '/',
    component: Home,
  },
  {
    name: 'lobby.home',
    path: '/lobby',
    component: LobbyHome,
  },
  {
    name: 'lobby.new',
    path: '/new',
    component: LobbyHome,
    props: { isNewGame: true },
  },
  {
    name: 'game.join',
    path: '/join/:gameCode',
    component: LobbyHome,
    props: true,
  },
  {
    name: 'game.play',
    path: '/play/:gameCode',
    component: Game,
    beforeEnter: (to) => {
      // Intenta recuperar sesión del storage antes de entrar
      const saved = JSON.parse(sessionStorage.getItem(`poker_session_${to.params.gameCode}`))
      
      // Si no hay datos guardados y tampoco vienen en el query (primer login), 
      // redirigir al formulario de Join
      if (!saved && (!to.query.playerName || !to.query.secretCode)) {
        return { name: 'game.join', params: { gameCode: to.params.gameCode } }
      }
      return true
    }
  },
  {
    name: 'game.spectate',
    path: '/watch/:gameCode',
    component: Game,
    props: { isGuest: true }
  },
  { name: 'about', path: '/about', component: About },
  // Catch-all 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
