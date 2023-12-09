<template>
  <div>

   <QRCodeVue3
          :width="300"
          :height="300"
          value="0001"
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

</script>