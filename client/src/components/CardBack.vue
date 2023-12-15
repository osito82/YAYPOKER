<template>
  <div
    :class="[
      sizeOption.width,
      sizeOption.height,
      'card',
      'bg-white',
      'rounded-lg',
      'flex',
    ]"
  >
    <div class="rayas centered"></div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps } from "vue";

const props = defineProps({
  numSymbol: Object,
  size: String,
});


const sizeOption = computed(() => {
  switch (props.size) {
    case 'extraLarge':
      return {        
        height: 'lg:h-60',
        width: 'lg:w-44',
      };
    case "large":
      return {
        height: "lg:h-32",
        width: "lg:w-24",
      };
    case "small":
      return {
        height: "lg:h-16",
        width: "lg:w-12",
      };
    default:
      return {
        height: "lg:h-32",
        width: "lg:w-24",
      };
  }
});
</script>

<style scoped>
.card {
  background-color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  position: relative;
  
}

.rayas {
  width: 90%;
  height: 90%;  
  border-radius: 15px;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    #183b5a 5px,
    #183b5a 15px
  );
  z-index: 100;
}

.centered {
  margin: auto;
  text-align: center;
  
}
</style>
