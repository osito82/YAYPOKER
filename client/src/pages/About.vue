<template>
  <div
    :id="`about-viewport-${templateSuffix}`"
    class="min-h-screen bg-gray-950 text-white font-sans selection:bg-yellow-500 selection:text-black overflow-x-hidden"
  >
    <!-- Navbar Minimalista -->
    <nav
      class="flex justify-between items-center p-6 max-w-7xl mx-auto relative z-50"
    >
      <Logo id="nav-logo" class="scale-90" />
      <router-link
        to="/"
        class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-yellow-500 transition-colors"
      >
        Volver
      </router-link>
    </nav>

    <main class="max-w-4xl mx-auto px-6 py-20 relative">
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-yellow-500/5 blur-[120px] rounded-full -z-10"
      ></div>

      <header class="text-center mb-20">
        <div
          class="inline-block px-4 py-1 bg-white/5 border border-white/10 rounded-full mb-6"
        >
          <span
            class="text-yellow-500 font-mono text-[10px] font-black uppercase tracking-[0.3em]"
          >
            Nuestra Filosofía
          </span>
        </div>
        <h1
          class="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-8"
        >
          Póker para <span class="text-yellow-500">Gozar</span>
        </h1>
        <p
          class="text-gray-400 text-lg md:text-xl font-bold uppercase tracking-wide leading-relaxed"
        >
          YayPoker no es solo un juego, es el patio de recreo digital donde tú y
          tus amigos podéis demostrar quién es el rey del farol sin arriesgar el
          alquiler.
        </p>
      </header>

      <section class="grid md:grid-cols-2 gap-12 mb-20">
        <div class="bg-white/5 border border-white/10 p-8 rounded-[2rem]">
          <h3 class="text-2xl font-black uppercase italic mb-4">
            ¿Por qué <span class="text-yellow-500">Gratis</span>?
          </h3>
          <p class="text-gray-500 text-sm leading-relaxed font-bold uppercase tracking-widest">
            Porque el póker es un deporte de habilidad y risas. Queremos que la
            barrera de entrada sea CERO. No queremos tus datos, no queremos tus
            tarjetas, solo queremos que repartas leña.
          </p>
        </div>
        <div class="bg-white/5 border border-white/10 p-8 rounded-[2rem]">
          <h3 class="text-2xl font-black uppercase italic mb-4">
            ¿Por qué <span class="text-yellow-500">Rápido</span>?
          </h3>
          <p class="text-gray-500 text-sm leading-relaxed font-bold uppercase tracking-widest">
            Porque odiamos los registros de 5 minutos. En YayPoker, el tiempo
            entre "quiero jugar" y estar en la mesa se mide en parpadeos. Link,
            nombre y All-in.
          </p>
        </div>
      </section>

      <footer class="text-center border-t border-white/5 pt-20">
        <h2 class="text-3xl font-black uppercase tracking-widest mb-8 italic">
          Hecho con <span class="text-red-500">♥</span> por entusiastas
        </h2>
        <p class="text-gray-600 text-xs font-black uppercase tracking-[0.4em]">
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
