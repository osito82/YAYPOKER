<template>
  <div :id="`qr-code-main-wrapper-${templateSuffix}`">
    <QRCodeVue3
      v-if="renderComponent"
      :id="`qr-code-component-${templateSuffix}`"
      :width="width"
      :height="height"
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
import QRCodeVue3 from 'qrcode-vue3'
import { computed, ref, nextTick } from 'vue'
import { urlsFactory } from '../vutils'
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()
const templateSuffix = computed(() => responsive.templateSuffix)

const props = defineProps({
  width: { type: Number, default: 300 },
  height: { type: Number, default: 300 },
  gameCode: { type: String, required: true },
})

const renderComponent = ref(true)

const forceRender = async () => {
  renderComponent.value = false
  await nextTick()
  renderComponent.value = true
}

const computedGameCode = computed(() => {
  forceRender()
  const urls = urlsFactory()
  return `${urls.url}/join/${props.gameCode}`
})
</script>
