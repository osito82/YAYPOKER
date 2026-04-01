import { createI18n } from 'vue-i18n'
import { watchEffect } from 'vue'
import en from './locales/en.json'
import es from './locales/es.json'

const savedLocale = localStorage.getItem('user-locale')
const defaultLocale = savedLocale || (navigator.language.startsWith('es') ? 'es' : 'en')

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    es
  }
})

// Persist language changes
watchEffect(() => {
  const locale = i18n.global.locale.value
  localStorage.setItem('user-locale', locale)
  document.documentElement.lang = locale
})

export default i18n
