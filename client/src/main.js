import router from './router'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createGtag } from 'vue-gtag'
import App from './App.vue'
import i18n from './i18n'
import './styles.css'
import './index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.use(createGtag({
  config: { id: "G-WL3B425CCF" },
  enabled: import.meta.env.PROD // opcional pero recomendado
}))

app.use(i18n)
app.mount('#app')