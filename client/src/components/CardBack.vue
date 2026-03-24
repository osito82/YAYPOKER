<template>
  <div
    :id="`card-back-crop-container-${templateSuffix}`"
    class="relative overflow-hidden transition-all duration-300"
    :style="cropStyle"
  >
    <div
      :id="`card-back-outer-${templateSuffix}`"
      :class="[
        sizeOption.width,
        sizeOption.heightClass,
        'card-back rounded-xl relative select-none flex justify-center items-center overflow-hidden',
      ]"
    >
      <!-- Inner border shine -->
      <div
        :id="`card-back-inner-shine-${templateSuffix}`"
        class="absolute inset-[1px] rounded-[10px] pointer-events-none"
        style="
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            transparent 50%
          );
        "
      ></div>
      <!-- Pattern -->
      <div
        :id="`card-back-pattern-container-${templateSuffix}`"
        class="card-back-pattern absolute inset-2 rounded-lg overflow-hidden"
      >
        <div
          :id="`card-back-pattern-inner-${templateSuffix}`"
          class="pattern-inner w-full h-full"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()
const templateSuffix = computed(() => responsive.templateSuffix)

const props = defineProps({
  size: String,
  percentage: { type: Number, default: 100 },
})

const sizeOption = computed(() => {
  switch (props.size) {
    case 'extraLarge':
      return { heightClass: 'h-64', width: 'w-48', heightPx: 256 }
    case 'large':
      return { heightClass: 'h-48', width: 'w-36', heightPx: 192 }
    case 'medium':
      return { heightClass: 'h-40', width: 'w-28', heightPx: 160 }
    case 'small':
      return { heightClass: 'h-28', width: 'w-20', heightPx: 112 }
    default:
      return { heightClass: 'h-48', width: 'w-36', heightPx: 192 }
  }
})

const cropStyle = computed(() => {
  const pct = props.percentage ?? 100
  if (pct >= 100) return {}
  return { height: `${(sizeOption.value.heightPx * pct) / 100}px` }
})
</script>

<style scoped>
.card-back {
  background: linear-gradient(145deg, #1a3a5c 0%, #0f2340 50%, #0a1a30 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.5),
    0 1px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.card-back-pattern {
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.pattern-inner {
  background-image:
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 4px,
      rgba(255, 255, 255, 0.04) 4px,
      rgba(255, 255, 255, 0.04) 8px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 4px,
      rgba(255, 255, 255, 0.025) 4px,
      rgba(255, 255, 255, 0.025) 8px
    );
  background-color: rgba(20, 50, 90, 0.5);
}
</style>
