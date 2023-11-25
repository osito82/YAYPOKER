<template>
  <div>

   <QRCodeVue3
          value="Simple QR code"
        />

   <QRCodeVue3
          :width="200"
          :height="200"
          value="https://scholtz.sk"
          :qrOptions="{ typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'H' }"
          :imageOptions="{ hideBackgroundDots: true, imageSize: 0.4, margin: 0 }"
          :dotsOptions="{
            type: 'dots',
            color: '#26249a',
            gradient: {
              type: 'linear',
              rotation: 0,
              colorStops: [
                { offset: 0, color: '#26249a' },
                { offset: 1, color: '#26249a' },
              ],
            },
          }"
          :backgroundOptions="{ color: '#ffffff' }"
          :cornersSquareOptions="{ type: 'dot', color: '#000000' }"
          :cornersDotOptions="{ type: undefined, color: '#000000' }"
          fileExt="png"
          :download="true"
          myclass="my-qur"
          imgclass="img-qr"
          downloadButton="my-button"
          :downloadOptions="{ name: 'vqr', extension: 'png' }"
        />
  </div>
</template>

<script setup>
import QRCodeVue3 from "qrcode-vue3";

//import { ref } from 'vue';

//const msg = ref('Hello, World!'); // Example data

// const updateMessage = () => {
//   msg.value = 'Updated Message!';
// };

</script>
