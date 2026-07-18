import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useThemeStore } from './store/themeStore'

import './styles.css'
import './index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize theme immediately to apply classes to <html>
useThemeStore()

// ==================== Google Analytics (gtag) ====================

function loadGtag() {
  // Load the gtag script
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-WL3B425CCF'
  document.head.appendChild(script)

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag

  gtag('js', new Date())

  gtag('config', 'G-WL3B425CCF', {
    send_page_view: false, // Important for SPAs
  })
}

// Only load in production
if (import.meta.env.PROD) {
  loadGtag()
}

// ==================== Track page views in SPA ====================

// Wait for router to be ready, then track navigation
router.isReady().then(() => {
  router.afterEach((to) => {
    if (window.gtag) {
      window.gtag('config', 'G-WL3B425CCF', {
        page_path: to.fullPath,
        page_title: to.meta.title || document.title,
      })
    }
  })
})

// Optional: Make gtag available globally in components via provide/inject
app.provide('gtag', window.gtag)

// Mount app
app.use(i18n)
app.mount('#app')
