<template>
  <div
    :id="'poker-chip-' + value + '-' + size + '-' + responsive.templateSuffix"
    :class="[
      chipSize.container,
      'relative rounded-full flex items-center justify-center select-none cursor-pointer transition-all duration-200 group',
      disabled 
        ? 'opacity-40 grayscale pointer-events-none shadow-none' 
        : 'active:scale-90 hover:brightness-110 shadow-[0_8px_16px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(0,0,0,0.3)]'
    ]"
  >
    <!-- Outer Rim -->
    <div
      :class="[
        color,
        'absolute inset-0 rounded-full border-[3px] border-white/20 border-dashed opacity-80'
      ]"
    ></div>

    <!-- Main Body -->
    <div
      :class="[
        color,
        'absolute inset-1 rounded-full flex items-center justify-center overflow-hidden',
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/30 before:to-black/40'
      ]"
    >
      <div class="absolute inset-1.5 rounded-full border border-white/20"></div>

      <!-- Center White Background -->
      <div 
        class="absolute inset-[22%] bg-white rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-black/5 flex items-center justify-center"
      >
        <div 
          :class="[
            'text-black',
            chipSize.text,
            'font-black tracking-tighter leading-none'
          ]"
        >
          {{ value }}
        </div>
      </div>
    </div>

    <!-- Shine Overlay -->
    <div v-if="!disabled" class="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'

const responsive = useResponsiveStore()

const props = defineProps({
  value: [Number, String],
  color: {
    type: String,
    default: 'bg-slate-100'
  },
  textColor: String,
  size: {
    type: String,
    default: 'medium'
  },
  disabled: Boolean
})

const chipSize = computed(() => {
  switch (props.size) {
    case 'xsmall':
      return { container: 'w-7 h-7 aspect-square', text: 'text-[10px]' }
    case 'small':
      return { container: 'w-10 h-10 aspect-square', text: 'text-[12px]' }
    case 'medium':
      return { container: 'w-14 h-14 aspect-square', text: 'text-[16px]' }
    case 'large':
      return { container: 'w-16 h-16 aspect-square', text: 'text-[18px]' }
    case 'extraLarge':
      return { container: 'w-20 h-20 aspect-square', text: 'text-[22px]' }
    default:
      return { container: 'w-14 h-14 aspect-square', text: 'text-[16px]' }
  }
})
</script>

<style scoped>
/* Animación de flotación al pasar el mouse */
.group:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(0,0,0,0.3);
}
</style>
