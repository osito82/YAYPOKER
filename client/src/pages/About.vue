<template>
  <div
    :id="`about-viewport-${templateSuffix}`"
    class="min-h-screen bg-gray-950 text-white font-sans selection:bg-yellow-500 selection:text-black overflow-x-hidden"
  >
    <!-- Navbar Minimalista -->
    <nav
      :id="`about-nav-bar-${templateSuffix}`"
      class="flex justify-between items-center p-6 max-w-7xl mx-auto relative z-50"
    >
      <Logo :id="`about-nav-logo-${templateSuffix}`" class="scale-90" />
      <router-link
        to="/"
        :id="`about-nav-link-back-${templateSuffix}`"
        class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-yellow-500 transition-colors"
      >
        Volver
      </router-link>
    </nav>

    <main
      :id="`about-main-content-${templateSuffix}`"
      class="max-w-4xl mx-auto px-6 py-20 relative"
    >
      <div
        :id="`about-bg-glow-${templateSuffix}`"
        class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-yellow-500/5 blur-[120px] rounded-full -z-10"
      ></div>

      <header
        :id="`about-header-section-${templateSuffix}`"
        class="text-center mb-20"
      >
        <div
          :id="`about-eyebrow-badge-${templateSuffix}`"
          class="inline-block px-4 py-1 bg-white/5 border border-white/10 rounded-full mb-6"
        >
          <span
            class="text-yellow-500 font-mono text-[10px] font-black uppercase tracking-[0.3em]"
          >
            Nuestra Filosofía
          </span>
        </div>
        <h1
          :id="`about-headline-text-${templateSuffix}`"
          class="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-8"
        >
          Póker para <span class="text-yellow-500">Gozar</span>
        </h1>
        <p
          :id="`about-sub-description-${templateSuffix}`"
          class="text-gray-400 text-lg md:text-xl font-bold uppercase tracking-wide leading-relaxed"
        >
          YayPoker no es solo un juego, es el patio de recreo digital donde tú y
          tus amigos podéis demostrar quién es el rey del farol sin arriesgar el
          alquiler.
        </p>
      </header>

      <section
        :id="`about-philosophy-grid-${templateSuffix}`"
        class="grid md:grid-cols-2 gap-12 mb-20"
      >
        <div
          :id="`about-card-free-${templateSuffix}`"
          class="bg-white/5 border border-white/10 p-8 rounded-[2rem]"
        >
          <h3 class="text-2xl font-black uppercase italic mb-4">
            ¿Por qué <span class="text-yellow-500">Gratis</span>?
          </h3>
          <p
            class="text-gray-500 text-sm leading-relaxed font-bold uppercase tracking-widest"
          >
            Because poker is a sport of skill and laughs. We want the barrier to
            entry to be ZERO. We don't want your data, we don't want your cards,
            we just want you to deal the cards.
          </p>
        </div>
        <div
          :id="`about-card-fast-${templateSuffix}`"
          class="bg-white/5 border border-white/10 p-8 rounded-[2rem]"
        >
          <h3 class="text-2xl font-black uppercase italic mb-4">
            ¿Por qué <span class="text-yellow-500">Rápido</span>?
          </h3>
          <p
            class="text-gray-500 text-sm leading-relaxed font-bold uppercase tracking-widest"
          >
            Because we hate 5-minute registrations. At YayPoker, the time
            between "I want to play" and being at the table is measured in
            blinks. Link, name, and All-in.
          </p>
        </div>
      </section>

      <footer
        :id="`about-page-footer-${templateSuffix}`"
        class="text-center border-t border-white/5 pt-20"
      >
        <h2
          :id="`about-footer-tagline-${templateSuffix}`"
          class="text-3xl font-black uppercase tracking-widest mb-8 italic"
        >
          Hecho con <span class="text-red-500">♥</span> por entusiastas
        </h2>
        <p
          :id="`about-footer-copyright-${templateSuffix}`"
          class="text-gray-600 text-xs font-black uppercase tracking-[0.4em]"
        >
          &copy; 2026 YayPoker Engineering
        </p>
      </footer>
    </main>
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
      return 'About'
    case 'small':
      return 'About'
    case 'medium':
      return 'About'
    default:
      return 'About'
  }
})
</script>
