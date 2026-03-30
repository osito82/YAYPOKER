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
        {{ $t('pages.about.back') }}
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
            {{ $t('pages.about.philosophy_badge') }}
          </span>
        </div>
        <h1
          :id="`about-headline-text-${templateSuffix}`"
          class="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-8"
          v-html="$t('pages.about.headline', { span: '<span class=\'text-yellow-500\'>' + $t('pages.about.headline_span') + '</span>' })"
        ></h1>
        <p
          :id="`about-sub-description-${templateSuffix}`"
          class="text-gray-400 text-lg md:text-xl font-bold uppercase tracking-wide leading-relaxed"
        >
          {{ $t('pages.about.description') }}
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
          <h3
            class="text-2xl font-black uppercase italic mb-4"
            v-html="$t('pages.about.why_free_title', { span: '<span class=\'text-yellow-500\'>' + $t('pages.about.free') + '</span>' })"
          ></h3>
          <p
            class="text-gray-500 text-sm leading-relaxed font-bold uppercase tracking-widest"
          >
            {{ $t('pages.about.why_free_desc') }}
          </p>
        </div>
        <div
          :id="`about-card-fast-${templateSuffix}`"
          class="bg-white/5 border border-white/10 p-8 rounded-[2rem]"
        >
          <h3
            class="text-2xl font-black uppercase italic mb-4"
            v-html="$t('pages.about.why_fast_title', { span: '<span class=\'text-yellow-500\'>' + $t('pages.about.fast') + '</span>' })"
          ></h3>
          <p
            class="text-gray-500 text-sm leading-relaxed font-bold uppercase tracking-widest"
          >
            {{ $t('pages.about.why_fast_desc') }}
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
          v-html="$t('pages.about.made_by', { heart: '<span class=\'text-red-500\'>♥</span>' })"
        ></h2>
        <p
          :id="`about-footer-copyright-${templateSuffix}`"
          class="text-gray-600 text-xs font-black uppercase tracking-[0.4em]"
        >
          {{ $t('pages.about.copyright') }}
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
