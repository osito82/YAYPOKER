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
    if (windowWidth.value < 640) return 'xsmall' // Móvil vertical (Portrait)
    if (windowWidth.value < 768) return 'small' // Móvil horizontal (Landscape) / Phablet
    if (windowWidth.value < 1024) return 'medium' // Tableta (iPad) / Laptop pequeño
    return 'large' // Desktop estándar
  })

  // Computed card size
  const cardSize = computed(() => {
    if (screenSize.value === 'xsmall') return 'small' // móvil vertical
    if (screenSize.value === 'small') return 'small' // móvil horizontal
    if (screenSize.value === 'medium') return 'medium' // tablet
    return 'large' // desktop
  })

  // Computed card crop percentage
  const cardPercentage = computed(() => {
    if (screenSize.value === 'xsmall') return 40
    if (screenSize.value === 'small' || screenSize.value === 'medium') return 55
    return 100
  })

  const templateSuffix = computed(() => {
    if (screenSize.value === 'xsmall') return 'TemplateXSmall'
    if (screenSize.value === 'small') return 'TemplateSmall'
    if (screenSize.value === 'medium') return 'TemplateMedium'
    return 'TemplateLarge'
  })

  return {
    windowWidth,
    cardSize,
    cardPercentage,
    screenSize,
    templateSuffix,
  }
})
