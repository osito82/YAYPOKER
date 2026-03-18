<template>
  <div
    :id="`landing-page-viewport-${templateSuffix}`"
    class="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 select-none"
  >
    <div
      :id="`landing-main-content-${templateSuffix}`"
      class="text-center space-y-8 animate-fade-in"
    >
      <Logo
        :id="`landing-brand-logo-${templateSuffix}`"
        class="mb-6 scale-150 mx-auto"
      />

      <div :id="`landing-text-wrapper-${templateSuffix}`" class="space-y-2">
        <h1
          :id="`landing-title-text-${templateSuffix}`"
          class="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic"
        >
          YayPoker
          <span class="text-yellow-500 text-3xl md:text-5xl block md:inline"
            >Texas Hold'em</span
          >
        </h1>

        <div
          :id="`construction-badge-${templateSuffix}`"
          class="inline-block px-4 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full"
        >
          <p
            class="text-yellow-500 font-mono text-[10px] md:text-xs font-black uppercase tracking-[0.4em] animate-pulse"
          >
            [ Under Construction / En Construcción ]
          </p>
        </div>
      </div>

      <p
        :id="`landing-description-text-${templateSuffix}`"
        class="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed"
      >
        Estamos preparando la mejor experiencia de póker online. Vuelve pronto
        para jugar con tus amigos.
      </p>

      <div
        :id="`landing-actions-container-${templateSuffix}`"
        class="pt-8 flex flex-col sm:flex-row gap-4 justify-center"
      >
        <router-link
          :id="`landing-join-table-button-${templateSuffix}`"
          to="/lobby"
          class="inline-block bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-10 rounded-2xl transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-[0.2em] text-sm shadow-[0_0_30px_rgba(37,99,235,0.2)]"
        >
          Unirse a Mesa
        </router-link>
        <router-link
          :id="`landing-create-table-button-${templateSuffix}`"
          to="/new"
          class="inline-block bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-4 px-10 rounded-2xl transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-[0.2em] text-sm"
        >
          Crear Mesa Nueva
        </router-link>
      </div>
    </div>

    <!-- Footer -->
    <p
      :id="`landing-copyright-footer-${templateSuffix}`"
      class="fixed bottom-8 text-gray-700 text-[10px] font-black uppercase tracking-[0.5em]"
    >
      &copy; 2026 YayPoker Engineering
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'
import Logo from '../components/Logo.vue'

const responsive = useResponsiveStore()

const templateSuffix = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall':
      return 'TemplateXSmall'
    case 'small':
      return 'TemplateSmall'
    case 'medium':
      return 'TemplateMedium'
    default:
      return 'TemplateLarge'
  }
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
