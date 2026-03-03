<template>
  <div
    id="card-space-outer"
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
    case 'extraLarge': return { height: 'h-64', width: 'w-48' }
    case 'large':      return { height: 'h-48', width: 'w-36' }
    case 'medium':     return { height: 'h-40', width: 'w-28' }
    case 'small':      return { height: 'h-28', width: 'w-20' }
    default:           return { height: 'h-48', width: 'w-36' }
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
