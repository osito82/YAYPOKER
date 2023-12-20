<template>
  {{ props }}
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

    <!-- <div id="cards" v-if="showFront" class="flex space-x-2">
      <Card v-for="card in playerCards" :key="card.id" :numSymbol="card" :size="'large'"  />
    </div> -->


    <Card
    v-for="(card, index) in playerCards"
    :key="index"
    :size="'large'"
    :numSymbol="card || ''"
  />

    <div id="coverCards" v-if="!showFront" class="flex space-x-2">
      
      <CardSpace
      v-for="index in 2 - playerCards.length"
      :size="'large'"
      :key="`space-${index}`"
    />
    </div>
  </div>
</template>

<script setup>
import Card from "../components/Card.vue";
import CardBack from "../components/CardBack.vue";
import CardSpace from "../components/CardSpace.vue";
import { ref, computed } from "vue";

const props = defineProps({
  playerName: String,
  playerChips: Number,
  playerAction: String,
  
  playerCards: {
    type: Array,
    default: () => ['5d', 'Ts'] // Inicialización predeterminada como un array vacío
  },

  showCards: Boolean,
});

const showFront = computed(() => {
  return props.showCards;
});
</script>



