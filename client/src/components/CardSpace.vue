<template>
  <div
    :class="[
      sizeOption.width,
      sizeOption.height,
      'rounded-lg flex justify-center items-center',
    ]"
    :style="cardStyle"
  ></div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: String,
})

const sizeOption = computed(() => {
  switch (props.size) {
    case 'extraLarge': return { height: 'h-56', width: 'w-40' }
    case 'large':      return { height: 'h-44', width: 'w-32' }
    case 'medium':     return { height: 'h-36', width: 'w-24' }
    case 'small':      return { height: 'h-24', width: 'w-16' }
    default:           return { height: 'h-44', width: 'w-32' }
  }
})

// Estilo inline para fondo y borde más realista
const cardStyle = computed(() => ({
  backgroundColor: 'rgba(0, 60, 0, 0.6)', // verde mesa oscuro semitransparente
  border: '2px dashed rgba(255, 255, 255, 0.2)', // borde punteado blanco suave
}))
</script>

<style scoped>
/* Puedes añadir un pequeño efecto de textura con gradient */
</style>