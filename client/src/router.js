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
    path: '/join/:gameCode/:secretCode?',
    component: LobbyHome,
    props: true,
  },
{
  name: 'game.play',
  path: '/play/:gameCode([A-Za-z0-9]{5}-[A-Za-z0-9]{5})/:secretCode(\\d{4})',
  component: Game,
  props: route => ({
    gameCode: route.params.gameCode,
    secretCode: route.params.secretCode,
  }),
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
