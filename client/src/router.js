// src/router.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import About from './pages/About.vue'
import Game from './pages/Game.vue'

const routes = [
  {
    name: 'home',
    path: '/',
    component: Home,
  },
  {
    name: 'newgame',
    path: '/newgame',
    component: Home,
    props: { isNewGame: true },
  },
  {
    name: 'game',
    path: '/game/:gameCode',
    component: Game,
    beforeEnter: (to, from, next) => {
      const { playerName, secretCode } = to.query
      if (!playerName || !secretCode) {
        // Redirigir a Home si falta info, pasando el código para pre-poblar
        next({ name: 'home', query: { joinCode: to.params.gameCode } })
      } else {
        next()
      }
    },
  },
  { name: 'about', path: '/about', component: About },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
