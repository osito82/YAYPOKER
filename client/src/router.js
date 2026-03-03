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
    props: { isNewGame: true }
  },
  {
    name: 'game',
    path: '/game/:gameCode',
    component: Game,
    beforeEnter: (to, from, next) => {
      if (!to.query.playerName) {
        // Redirigir a Home si no hay nombre, pasando el código para pre-poblar
        next({ path: '/', query: { joinCode: to.params.gameCode } })
      } else {
        next()
      }
    }
  },
  { name: 'about', path: '/about', component: About },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
