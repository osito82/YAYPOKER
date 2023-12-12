<template>
  <div class="card" :style="{ transform: `scale(${scale})` }">
    <div  class="number">_</div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps } from "vue";

const props = defineProps({
  numSymbol: String,
  scale: Number,
});
const scale = computed(() => (props.scale ? props.scale : 1));
</script>

<style scoped>
.card {

  min-width: 80px;
  padding: 2em;
  margin: 5px;
  /*margin-right: 5px; */
/*padding: 2em;*/
  
    width: 100px;
    height: 150px;
    margin-right: 5px; 
  
  background-color: white;
  
  
  
  
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 15px !important;
}

.card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, #ffffff, #ffffff);
  z-index: -1;
  border-radius: 15px !important;
}

.card::after {
  content: "";
  position: absolute;
  top: 10%;
  border-radius: 15px;
  left: 10%;
  right: 10%;
  bottom: 10%;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    #183b5a 5px,
    #183b5a 10px
  );
  z-index: -1;
  border-radius: 15px !important;
}

.number {
  font-weight: bolder;
  font-size: 8em;
  text-align: center;
  line-height: 0.7;
  margin: 0;
  padding: 18px;
  min-width: max-content;
  display: none;
}
</style>
