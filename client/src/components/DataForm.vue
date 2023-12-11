<!-- src/components/MyForm.vue -->
<template>
    <form @submit.prevent="submitForm">
      <label for="name">Name:</label>
      <input type="text" id="name" v-model="name" />
      
  
      <label for="secretCode">Secret Code:</label>
      <input type="password" id="secretCode" v-model="secretCode" />
  
<input  id="gameCode" v-model="secretCode" />

      <button type="submit">Submit</button>
    </form>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
 
      // State
      const name = ref('');
      const secretCode = ref('');
      const gameCode = ref('');
  
      // Methods
      const submitForm = () => {
        // Do something with the form data, e.g., send it to a server
        console.log('Name:', name.value);
        console.log('Secret Code:', secretCode.value);
        console.log('Game Code:', gameCode.value);
     };
  
      
  </script>
  