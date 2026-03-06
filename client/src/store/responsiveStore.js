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



    const screenSize = computed(() => {
  if (windowWidth.value < 640) return 'xsmall'  // Móvil vertical (Portrait)
  if (windowWidth.value < 768) return 'small'   // Móvil horizontal (Landscape) / Phablet
  if (windowWidth.value < 1024) return 'medium' // Tableta (iPad) / Laptop pequeño
  return 'large'  // Desktop estándar
})

  // Computed card size
  const cardSize = computed(() => {
    if (screenSize.value === 'xsmall') return 'small'
    if (screenSize.value === 'small' || screenSize.value === 'medium') return 'medium'
    return 'large'
  })

  // Computed card crop percentage
  const cardPercentage = computed(() => {
    if (screenSize.value === 'xsmall') return 40
    if (screenSize.value === 'small' || screenSize.value === 'medium') return 55
    return 100
  })

  return { windowWidth, cardSize, cardPercentage, screenSize }
})
