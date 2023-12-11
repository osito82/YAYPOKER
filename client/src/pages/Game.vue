<script setup>
import Logo from '../components/Logo.vue'
import qrCode from '../components/qrCode.vue'
import DataForm from '../components/DataForm.vue';


import Card from '../components/Card.vue';
import CardBack from '../components/CardBack.vue';
import { usePokerStore } from '../store/pokerStore';
import { useRoute } from 'vue-router'
import { computed, defineProps, onMounted, onUpdated, watch, ref, nextTick } from "vue";

const route = useRoute()
const pokerStore = usePokerStore();


//pokerStore.getGameCode"

onMounted(() => {
  pokerStore.setGameCode(route.params.gameCode);
 // console.log("route.query",  route.params.gameCode);
  //updateGameCode();
});
</script>

<template>


   
  <DataForm />
  <Logo /> 
  <!-- <qrCode  /> -->


    
  <Card :numSymbol="'Tc'" />
  <br>
      <Card :numSymbol="'Ah'" />
  
  
      <br>
      <CardBack/>

   <qrCode  />
</template>

<style scoped>

</style>
