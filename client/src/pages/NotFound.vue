<template>
  <div
    :id="`not-found-viewport-${templateSuffix}`"
    class="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 select-none"
  >
    <div
      :id="`not-found-content-${templateSuffix}`"
      class="text-center space-y-8 animate-fade-in"
    >
      <!-- Visual Element: Dead Hand -->
      <div :id="`dead-hand-visual-${templateSuffix}`" class="flex justify-center -space-x-8 mb-4">
        <div class="transform -rotate-12 translate-y-4">
           <Card size="medium" numSymbol="As" id="dead-card-1" />
        </div>
        <div class="transform rotate-12 -translate-y-2">
           <Card size="medium" numSymbol="8s" id="dead-card-2" />
        </div>
      </div>

      <div :id="`not-found-text-wrapper-${templateSuffix}`" class="space-y-4">
        <h1
          :id="`not-found-title-text-${templateSuffix}`"
          class="text-8xl font-black text-yellow-500/20 uppercase tracking-tighter italic absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 -z-10 pointer-events-none"
        >
          404
        </h1>
        
        <h2
          :id="`not-found-headline-${templateSuffix}`"
          class="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter"
        >
          Mano <span class="text-red-600">Muerta</span>
        </h2>
        
        <div 
          :id="`funny-message-badge-${templateSuffix}`"
          class="inline-block px-4 py-1 bg-red-600/10 border border-red-600/20 rounded-full"
        >
          <p class="text-red-500 font-mono text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
            Hiciste All-In en una página que no existe
          </p>
        </div>
      </div>

      <p 
        :id="`not-found-description-text-${templateSuffix}`"
        class="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed"
      >
        Parece que intentaste un bluff pero el servidor no cayó. 
        Esta ruta está más vacía que el stack de un principiante.
      </p>

      <div :id="`not-found-actions-container-${templateSuffix}`" class="pt-8">
        <router-link
          :id="`back-to-safety-button-${templateSuffix}`"
          to="/"
          class="inline-block bg-yellow-600 hover:bg-yellow-500 text-black font-black py-4 px-10 rounded-2xl transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-[0.2em] text-sm shadow-[0_0_30px_rgba(234,179,8,0.2)]"
        >
          Volver a la Mesa Principal
        </router-link>
      </div>
    </div>

    <!-- Footer decoration -->
    <div class="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600/30 to-transparent"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'
import Card from '../components/Card.vue'

const responsive = useResponsiveStore()

const templateSuffix = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall': return 'TemplateXSmall'
    case 'small': return 'TemplateSmall'
    case 'medium': return 'TemplateMedium'
    default: return 'TemplateLarge'
  }
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
