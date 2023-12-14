<template>
  <div
    class="card lg:w-24 lg:h-32 bg-white rounded-lg flex flex-col justify-center items-center"
    :style="{ transform: `scale(${scale / 100})` }"
  />
</template>

<script setup>
import { ref, computed, defineProps } from "vue";

const props = defineProps({
  numSymbol: String,
  scale: Number,
});
const scale = computed(() => (props.scale ? props.scale : 100));
</script>

<style scoped>
.card {
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
  border-radius: 10px !important;
}

.card::after {
  content: "";
  position: absolute;
  top: 10%;

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
  border-radius: 10px !important;
}
</style>
