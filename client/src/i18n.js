import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import es from './locales/es.json'

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: navigator.language.split('-')[0] || 'en', // Default to browser language
  fallbackLocale: 'en',
  messages: {
    en,
    es
  }
})

export default i18n
