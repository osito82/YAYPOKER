import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const savedTheme = localStorage.getItem('user-theme')
  const theme = ref(savedTheme || 'dark')

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function setTheme(newTheme) {
    theme.value = newTheme
  }

  // Sync with DOM and LocalStorage
  watchEffect(() => {
    localStorage.setItem('user-theme', theme.value)
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
    // Update data-theme for extra flexibility if needed
    document.documentElement.setAttribute('data-theme', theme.value)
  })

  return {
    theme,
    toggleTheme,
    setTheme,
  }
})
