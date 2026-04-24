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
    meta: { title: 'YayPoker - Play Texas Hold\'em Poker with Friends Online' },
  },
  {
    name: 'lobby.home',
    path: '/lobby',
    component: LobbyHome,
    meta: { title: 'Lobby - Join a Poker Game | YayPoker' },
  },
  {
    name: 'lobby.public',
    path: '/public',
    component: LobbyHome,
    meta: { title: 'Public Tables - Play Poker Now | YayPoker' },
  },
  {
    name: 'lobby.new',
    path: '/new',
    component: LobbyHome,
    props: { isNewGame: true },
    meta: { title: 'Create Private Table - Play with Friends | YayPoker' },
  },
  {
    name: 'game.join',
    path: '/join/:gameCode/:secretCode?',
    component: LobbyHome,
    props: true,
    meta: { title: 'Join Poker Game | YayPoker' },
  },
  {
    name: 'game.play',
    path: '/play/:gameCode/:secretCode',
    component: Game,
    props: (route) => ({
      gameCode: route.params.gameCode,
      secretCode: route.params.secretCode,
    }),
    meta: { title: 'Playing Poker | YayPoker' },
  },
  {
    name: 'game.spectate',
    path: '/watch/:gameCode',
    component: Game,
    props: { isGuest: true },
    meta: { title: 'Spectating Poker Game | YayPoker' },
  },
  {
    path: '/verify/:torneoId?/:code?',
    name: 'verify',
    component: () => import('./pages/VerifyCertificate.vue'),
    meta: { title: 'Verify Winner Certificate | YayPoker' },
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('./pages/Privacy.vue'),
    meta: { title: 'Privacy Policy | YayPoker' },
  },
  {
    path: '/terms',
    name: 'terms',
    component: () => import('./pages/Terms.vue'),
    meta: { title: 'Terms of Service | YayPoker' },
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('./pages/Contact.vue'),
    meta: { title: 'Contact Us | YayPoker' },
  },
  {
    name: 'about',
    path: '/about',
    component: About,
    meta: { title: 'About YayPoker - Our Philosophy' },
  },
  // Catch-all 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
    meta: { title: 'Page Not Found | YayPoker' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const title = to.meta.title || 'YayPoker'
  document.title = title
  next()
})

export default router
