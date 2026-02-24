<template>
  <div
    :class="[
      sizeOption.width,
      sizeOption.height,
      'border-2 border-dashed border-yellow-500 rounded-lg bg-black bg-opacity-20 flex justify-center items-center',
    ]"
  ></div>
</template>

<script setup>
import { computed, defineProps } from "vue";

const props = defineProps({
  size: String,
});

const sizeOption = computed(() => {
  switch (props.size) {
    case "extraLarge":
      return {
        height: "h-48",
        width: "w-32",
      };
    case "large":
      return {
        height: "h-36",
        width: "w-24",
      };
    case "small":
      return {
        height: "h-20",
        width: "w-14",
      };
    default:
      return {
        height: "h-36",
        width: "w-24",
      };
  }
});
</script>

<style scoped>
</style>
