<template>
  <div>
    
    <QRCodeVue3
      v-if="renderComponent"
      :width="300"
      :height="300"
      :value="computedGameCode"
      :qrOptions="{ typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'H' }"
      :imageOptions="{ hideBackgroundDots: true, imageSize: 0.4, margin: 0 }"
      :dotsOptions="{
        type: 'classy',
        color: '#000000',
        gradient: {
          type: 'linear',
          rotation: 0,
          colorStops: [
            { offset: 0, color: '#000000' },
            { offset: 1, color: '#000000' },
          ],
        },
      }"
      :backgroundOptions="{ color: '#ffffff' }"
      :cornersSquareOptions="{ type: 'dot', color: '#000000' }"
      :cornersDotOptions="{ type: undefined, color: '#000000' }"
      :download="false"
      myclass="my-qur"
    />
  </div>
</template>

<script setup>
import QRCodeVue3 from "qrcode-vue3";
import { computed, defineProps, onMounted, onUpdated, watch, ref, nextTick } from "vue";
import { usePokerStore } from "../store/pokerStore";

const pokerStore = usePokerStore();

const renderComponent = ref(true);

const forceRender = async () => {
  renderComponent.value = false;
  await nextTick();
  renderComponent.value = true;
};

const computedGameCode = computed(() => {
  forceRender();
  return "http://localhost:5173/game/" + pokerStore.getGameCredentials.gameCode;
});
</script>
