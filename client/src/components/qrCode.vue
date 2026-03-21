<template>
  <div :id="id" class="qr-code-wrapper">
    <QRCodeVue3
      v-if="render"
      :key="renderKey"
      :width="width"
      :height="height"
      :value="shareUrl"
      :qrOptions="{ typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'H' }"
      :imageOptions="{ hideBackgroundDots: true, imageSize: 0.4, margin: 0 }"
      :dotsOptions="{
        type: 'extra-rounded',
        color: '#eab308',
      }"
      :backgroundOptions="{ color: '#ffffff' }"
      :cornersSquareOptions="{ type: 'extra-rounded', color: '#000000' }"
      :cornersDotOptions="{ type: 'dot', color: '#000000' }"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import QRCodeVue3 from 'qrcode-vue3'
import { urlsFactory } from '../vutils'

const props = defineProps({
  width: { type: Number, default: 200 },
  height: { type: Number, default: 200 },
  gameCode: { type: String, required: true },
  id: { type: String, default: 'qr-code-component' },
})

const render = ref(false)
const renderKey = ref(0)

const shareUrl = computed(() => {
  const urls = urlsFactory()
  return `${urls.url}/join/${props.gameCode}`
})

const forceRender = async () => {
  render.value = false
  renderKey.value++
  setTimeout(() => {
    render.value = true
  }, 10)
}

onMounted(() => {
  forceRender()
})

watch(
  () => props.gameCode,
  () => {
    forceRender()
  },
)
</script>

<style scoped>
.qr-code-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
