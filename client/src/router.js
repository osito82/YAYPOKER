import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import i18n from './i18n'
import { SEO_PAGES, localizedPath } from './seo/pages'
import Home from './pages/Home.vue'
import LobbyHome from './pages/LobbyHome.vue'
import About from './pages/About.vue'
import Game from './pages/Game.vue'
import NotFound from './pages/NotFound.vue'

// SEO pages (OPS-003): one route per language; the URL decides the language.
const SEO_COMPONENTS = {
  landing: Home,
  about: About,
  rules: () => import('./pages/Rules.vue'),
  'hand-rankings': () => import('./pages/HandRankings.vue'),
  privacy: () => import('./pages/Privacy.vue'),
  terms: () => import('./pages/Terms.vue'),
  contact: () => import('./pages/Contact.vue'),
}

const seoRoutes = SEO_PAGES.flatMap((page) =>
  ['en', 'es'].map((locale) => ({
    name: locale === 'en' ? page.name : `${page.name}.es`,
    path: localizedPath(page.path, locale),
    component: SEO_COMPONENTS[page.name],
    meta: { seo: page, locale },
  })),
)

export const routes = [
  ...seoRoutes,
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
    props: { isGuest: false },
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
  // Catch-all 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
    meta: { title: 'Page Not Found | YayPoker' },
  },
]

// Saved choice first, then the browser language (same rule as i18n.js).
function preferredLocale() {
  try {
    const saved = localStorage.getItem('user-locale')
    if (saved) return saved
  } catch {
    // storage blocked: fall back to the browser language
  }
  return navigator.language?.startsWith('es') ? 'es' : 'en'
}

// `client: true` enables the first-load redirect of English SEO pages for Spanish visitors
// (R-04); the build-time prerender leaves it off so every URL renders as requested.
export function createAppRouter(history, { client = false } = {}) {
  const router = createRouter({ history, routes })

  router.beforeEach((to, from) => {
    if (
      client &&
      from === START_LOCATION &&
      to.meta.seo &&
      to.meta.locale === 'en' &&
      preferredLocale() === 'es'
    ) {
      return { path: localizedPath(to.meta.seo.path, 'es'), query: to.query, hash: to.hash }
    }
    if (to.meta.locale) i18n.global.locale.value = to.meta.locale
  })

  return router
}

const router = createAppRouter(createWebHistory(), { client: true })

export default router
