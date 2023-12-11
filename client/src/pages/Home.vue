<script setup>
import Logo from '../components/Logo.vue'
import qrCode from '../components/qrCode.vue'
import DataForm from '../components/DataForm.vue';


import Card from '../components/Card.vue';
import CardBack from '../components/CardBack.vue';

</script>

<template>

    
    <Card :numSymbol="'Tc'" />
<br>
    <Card :numSymbol="'Ah'" />


    <br>
    <CardBack/>
   <Logo /> 
  <DataForm />
  <qrCode />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
