<!-- MessageBox.vue -->
<template>
    <div :class="['bg-red-500', 'text-white', 'p-4', 'rounded', 'text-center']">
      <p class="text-4xl">{{ message }}</p>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      message: {
        type: String,
        required: true,
      },
    },
  };
  </script>
  
  <style scoped>
  /* Aquí puedes agregar estilos específicos para este componente si es necesario */
  </style>
  