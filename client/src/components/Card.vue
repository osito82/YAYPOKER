<template>
  
  <div
        :class="`${sizeOption.height} max-w-xs ${sizeOption.width} bg-white rounded-lg flex flex-col justify-center items-center`"
      >
    <div v-if="color == 'red'" :class="`text-red-600 ${sizeOption.textSize} items-center custom-line-height`">
      {{ numSymbol.letter }}
    </div>

    <div v-if="color == 'red'" :class="`text-red-600 ${sizeOption.textSize} items-center custom-line-height`">
      {{ numSymbol.symbol }}
    </div>


    <div v-if="color == 'black'" :class="`text-black ${sizeOption.textSize} items-center custom-line-height`">
      {{ numSymbol.letter }}
    </div>

    <div v-if="color == 'black'" :class="`text-black ${sizeOption.textSize} items-center custom-line-height`">
      {{ numSymbol.symbol }}
    </div>


  </div>
</template>

<script setup>
import { ref, computed, defineProps } from "vue";

const props = defineProps({
  numSymbol: String,
  size: String  
});

import { simbolConverter, whatColor } from "../vutils.js";


const sizeOption = computed(() => { 
  switch (props.size) {
    case 'extraLarge':
      return {
        textSize: 'text-9xl',
        height: 'lg:h-60',
        width: 'lg:w-44',
      };
    case 'large':
      return {
        textSize: 'text-7xl',
        height: 'lg:h-32',
        width: 'lg:w-24',
      };
    case 'small':
      return {
        textSize: 'text-4xl',
        height: 'lg:h-16',
        width: 'lg:w-12',
      };
    default:
      // Valores predeterminados si props.sizeOption no coincide con 'large' ni 'small'
      return {
        textSize: 'text-7xl',
        height: 'lg:h-32',
        width: 'lg:w-24',
      };
  }
});


const numSymbol = computed(() => simbolConverter(props.numSymbol));
const color = computed(() => whatColor(props.numSymbol));
</script>

<style scoped>
.custom-line-height {
  line-height: 0.75;
}
</style>
