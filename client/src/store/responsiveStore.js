// stores/responsiveStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useResponsiveStore = defineStore('responsive', () => {
  const windowWidth = ref(window.innerWidth)

  // update windowWidth on resize
  const updateWidth = () => {
    windowWidth.value = window.innerWidth
  }
  window.addEventListener('resize', updateWidth)

  // Computed card size
  const cardSize = computed(() => {
    if (windowWidth.value < 640) return 'small'
    if (windowWidth.value < 1024) return 'medium'
    return 'large'
  })

  // Computed card crop percentage
  const cardPercentage = computed(() => {
    if (windowWidth.value < 640) return 55
    if (windowWidth.value < 1024) return 75
    return 100
  })

  return { windowWidth, cardSize, cardPercentage }
})
