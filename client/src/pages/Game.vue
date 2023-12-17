<template>
  <div>
    <h1>Conexión al WebSocket</h1>
    <!-- <p v-if="socket && socket.readyState === WebSocket.OPEN">Conectado al WebSocket</p> -->
    <!-- <p v-else>Desconectado del WebSocket</p> -->

    <button @click="connectSocket">Conectar al WebSocket</button>
    <button @click="disconnectSocket">Desconectar del WebSocket</button>
  </div>

  <Logo />
  <div>
    <div class="container mx-auto bg-red-100">
      <!-- BANNER -->

      <div id="main_holder" class="flex flex-row flex-wrap py-2 h-max bg-pink-500">
        <main
          role="main"
          class="w-full sm:w-2/3 md:w-3/4 pt-4 px-2 h-auto bg-yellow-300 mx-auto flex justify-center flex-col items-center"
        >
          <div
            id="comunityCards"
            class="flex bottom-3 w-4/5 bg-blue-600 space-x-4 justify-center mb-6"
          >
            
            <Card
              v-for="(card, index) in communityCards"
              :key="index"
              :size="'extraLarge'"
              :numSymbol="card || ''"
            />
            <CardSpace
              v-for="index in 5 - communityCards.length"
              :size="'extraLarge'"
              :key="`space-${index}`"
            />
          </div>


          <div id="mySpace" class="flex bottom-3 w-4/5 bg-green-600 space-x-4">
            <div id="myCards" class="flex bottom-3 bg-gray-600 space-x-4 left-0">
              <Card :size="'extraLarge'" :numSymbol="'Tc'" />
              <Card :size="'extraLarge'" :numSymbol="'Ah'" />
            </div>

            <div id="myCards" class="flex bottom-3 bg-gray-600 space-x-4 left-0">
              numbers
            </div>
          </div>
        </main>

        <aside class="w-full sm:w-1/3 md:w-1/4 px-1 bg-blue-100">
          <div id="players" class="top-0 p-4 w-full bg-red-500 border border-black">
            <fieldset class="p-3">
              <legend>A Legend Title</legend>
              Blah blah. Blah blah.
            </fieldset>

            <Player
              :playerName="'Osito'"
              :playerChips="1000"
              :showCards="true"
              :playerAction="'All in'"
              :playerCards="['Js', 'Td']"
            />

            <Player
              :playerName="'Pollito'"
              :playerChips="2500"
              :showCards="true"
              :playerAction="'Riase'"
              :playerCards="['Ks', 'Qc']"
            />

            <Player
              :playerName="'Mark'"
              :playerChips="2500"
              :playerAction="'Riase'"
              :showCards="false"
              :playerCards="['Ks', 'Qc']"
            />
          </div>
        </aside>
      </div>
    </div>
    <footer class="mt-auto bg-green-100">vvcvc</footer>

    <!-- <qrCode  /> -->

    <qrCode />
  </div>
</template>

<script setup>
import Logo from "../components/Logo.vue";
import qrCode from "../components/qrCode.vue";

import Player from "../components/Player.vue";
import Card from "../components/Card.vue";
import CardSpace from "../components/CardSpace.vue";
import CardBack from "../components/CardBack.vue";
import { usePokerStore } from "../store/pokerStore";
import { useRoute } from "vue-router";
import { computed, defineProps, onMounted, onUpdated, watch, ref, nextTick } from "vue";
import useSockets from "../use/useSockets";

const communityCards = ref(["Tc", "Tc", "Ah"]); // Array de cartas comunitarias (5 elementos)

const showDealerSpace = ref(true);

const pokerStore = usePokerStore();
const route = useRoute();
//const gameCode = route.params.gameCode;

//console.log(pokerStore.getGameCredentials, 'okerStore.getGameCredentials')
//console.log('Game Credentials:', pokerStore.getGameCredentials);

//const route = useRoute();
</script>

<style scoped>
/* Estilo para el espacio de la carta del dealer */
.cardSpace {
  width: 100px;
  height: 150px;
  background-color: #df0808; /* Puedes ajustar el color según tu preferencia */
  border-radius: 8px;
  margin-right: 10px;
}
</style>
