<!-- MessageBox.vue -->
<template>
  <div
    :id="`message-box-container-${templateSuffix}`"
    :class="['bg-red-500', 'text-white', 'p-4', 'rounded', 'text-center']"
  >
    <p :id="`message-box-text-${templateSuffix}`" class="text-4xl">
      {{ message }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'

defineProps({
  message: {
    type: String,
    required: true,
  },
})

const responsive = useResponsiveStore()
const templateSuffix = computed(() => responsive.templateSuffix)
</script>

<style scoped>
/* Aquí puedes agregar estilos específicos para este componente si es necesario */
</style>
