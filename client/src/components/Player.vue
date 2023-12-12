<!-- src/components/PlayerInfo.vue -->

<!-- <template>
    <div class="container">
  
    </div>
  </template> -->

<template>

    <div class="playerContainer">
    <div v-if="showFront" class="cardsContainer">
      <Card v-for="card in playerCards" :key="card.id" :numSymbol="card" />
    </div>

    <div v-if="!showFront" class="cardsContainer">
      <CardBack v-for="card in playerCards" :key="card.id" />
    </div>

    <div class="playerData">
      <div class="nameContainer">
        <strong> {{ playerName }} </strong>
      </div>

      <div class="info-item">
        <strong> {{ playerChips }} Chips</strong>
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
</style>
