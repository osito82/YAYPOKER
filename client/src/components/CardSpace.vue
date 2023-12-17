<template>
  <div
    :class="[sizeOption.width, sizeOption.height, 'card', sizeOption.borderWidth, 'flex']"
  ></div>
</template>

<script setup>
import { ref, computed, defineProps } from "vue";

const props = defineProps({
  size: String,
});

const sizeOption = computed(() => {
  switch (props.size) {
    case "extraLarge":
      return {
        height: "lg:h-60",
        width: "lg:w-44",
        borderWidth: "border-8",
      };
    case "large":
      return {
        height: "lg:h-32",
        width: "lg:w-24",
        borderWidth: "border-4",
      };
    case "small":
      return {
        height: "lg:h-16",
        width: "lg:w-12",
        borderWidth: "border-4",
      };
    default:
      return {
        height: "lg:h-32",
        width: "lg:w-24",
        borderWidth: "border-4",
      };
  }
});
</script>

<style scoped>
.card {
  background-color: transparent;
  border-color: yellow;


  position: relative;
}

.centered {
  margin: auto;
  text-align: center;
}
</style>
