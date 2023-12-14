<template>
  <div id="playerContainer" class="flex items-center justify-between mb-3 max-w-max">
    
    <div id="cards" v-if="showFront" class="flex ">
      <Card v-for="card in playerCards" :key="card.id" :numSymbol="card" />
    </div>

    <div id="coverCards" v-if="!showFront" class="flex ">
      <CardBack v-for="card in playerCards" :key="card.id" />
    </div>

    <div id="playerInfo" class="flex flex-col min-w-150 ml-4">

      <div class="mb-5 text-xl font-semibold">{{ playerName }}</div>

      <div class="info-item mb-5">
        <strong>{{ playerChips }} Chips</strong>
      </div>

      <div class="info-item">
        <strong>{{ playerAction }}</strong>
      </div>
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



<style scoped>
</style>


<!-- 
<style scoped>

  .playerContainer {
  display: flex;
  flex-direction: row;
  margin-bottom: 20px;
  align-items: normal;
  max-width: fit-content;
  /* margin-bottom: 5px;*/
}

.playerData {
  display: flex;
  flex-direction: column;
  min-width: 150px;
  margin-left: 10px;
}

.info-item {
  margin-bottom: 5px;
}
.nameContainer {
  margin-bottom: 5px;
  font-size: 1.5rem;
}

.cardsContainer {
  display: flex;
  flex-direction: row;
  border-right: #ccc;
  border-right-width: 1px;
  border-right-style: solid;
  padding-right: 10px;
  transform: scale(0.45); /* Puedes ajustar el valor según lo que necesites */
  align-items: center;
  height: 100px; /* Ajusta la altura según lo necesario */
  width: 150px;
  margin-right: 25px;
}
</style> -->
