<template>
  <Logo />
  <div>
    <div class="container mx-auto bg-red-100">
      <!-- BANNER -->
      <div id="banner" class="sticky top-0 h-300 bg-blue-200 p-3">
        <DataForm />
      </div>

      <div id="main_holder" class="flex flex-row flex-wrap py-2 bg-pink-500">
        <main
          role="main"
          class="w-full sm:w-2/3 md:w-3/4 pt-4 px-2 bg-yellow-300 mx-auto flex justify-center"
        >
          <div
            id="comunityCards"
            class="flex justify-center items-center w-4/5 bg-blue-500 space-x-14 h-[70%] min-h-min-content "
          >
            <Card :scale="150" :numSymbol="'Tc'" />
            <Card :numSymbol="'Ah'" :scale="150" />
            <CardBack :scale="150" /><CardBack :scale="150" /><CardBack :scale="150" />
          </div>
        </main>

        <aside class="w-full sm:w-1/3 md:w-1/4 px-1 bg-blue-100  ">
          <div id="players" class="top-0 p-4 w-full bg-red-500 " >
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
import DataForm from "../components/DataForm.vue";

import Player from "../components/Player.vue";
import Card from "../components/Card.vue";
import CardBack from "../components/CardBack.vue";
import { usePokerStore } from "../store/pokerStore";
import { useRoute } from "vue-router";
import { computed, defineProps, onMounted, onUpdated, watch, ref, nextTick } from "vue";

const route = useRoute();
const pokerStore = usePokerStore();

//pokerStore.getGameCode"

onMounted(() => {
  pokerStore.setGameCode(route.params.gameCode);
  // console.log("route.query",  route.params.gameCode);
  //updateGameCode();
});
</script>

<style scoped></style>
