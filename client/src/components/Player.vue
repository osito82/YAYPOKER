<template>
  <div id="playerContainer" class="flex  items-center justify-between mb-3 max-w-max ">
    


    <div id="playerInfo" class="flex flex-col min-w-150 mr-4">

      <div class="mb-5 text-xl font-semibold">{{ playerName }}</div>

      <div class="info-item mb-5">
        <strong>{{ playerChips }} Chips</strong>
      </div>

      <div class="info-item">
        <strong>{{ playerAction }}</strong>
      </div>
    </div>

    <div id="cards" v-if="showFront" class="flex space-x-2">
      <Card v-for="card in playerCards" :key="card.id" :numSymbol="card" />
    </div>

    <div id="coverCards" v-if="!showFront" class="flex space-x-2">
      <CardBack v-for="card in playerCards" :key="card.id" />
    </div>
  </div>
</template>

<script setup>
import Card from "../components/Card.vue";
import CardBack from "../components/CardBack.vue";
import { ref, computed } from "vue";

const props = defineProps({
  playerName: String,
  playerChips: Number,
  playerAction: String,
  playerCards: Array,
  showCards: Boolean,
});

const showFront = computed(() => {
  return props.showCards;
});
</script>



