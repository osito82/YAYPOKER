<template>
  <div
    :id="`landing-viewport-${templateSuffix}`"
    class="min-h-screen bg-[#030712] text-white overflow-x-hidden font-sans selection:bg-yellow-500/30"
  >
    <!-- Background Effects -->
    <div class="fixed inset-0 z-0 pointer-events-none">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500/10 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-600/5 rounded-full blur-[120px]"></div>
      <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
    </div>

    <!-- ───────── NAV ───────── -->
    <nav
      :id="`landing-nav-bar-${templateSuffix}`"
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl"
    >
      <div class="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <Logo :id="`nav-logo-${templateSuffix}`" class="h-8 w-auto" />
        
        <div class="hidden md:flex gap-8 text-[12px] font-bold uppercase tracking-[0.2em] text-white/50">
          <a href="#how" class="hover:text-yellow-500 transition-colors duration-300">{{ $t('nav.how') }}</a>
          <a href="#features" class="hover:text-yellow-500 transition-colors duration-300">{{ $t('nav.features') }}</a>
        </div>

        <div class="flex items-center gap-4 sm:gap-8">
          <!-- Language Switcher -->
          <div class="flex gap-3 text-[10px] font-black uppercase tracking-widest border border-white/10 rounded-full px-3 py-1.5 bg-white/5">
            <button 
              @click="locale = 'en'" 
              class="transition-colors cursor-pointer"
              :class="locale === 'en' ? 'text-yellow-500' : 'text-white/30 hover:text-white/60'"
            >EN</button>
            <span class="text-white/10">|</span>
            <button 
              @click="locale = 'es'" 
              class="transition-colors cursor-pointer"
              :class="locale === 'es' ? 'text-yellow-500' : 'text-white/30 hover:text-white/60'"
            >ES</button>
          </div>

          <router-link
            to="/lobby"
            class="hidden sm:block text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white/80 transition-all"
          >
            {{ $t('nav.join') }}
          </router-link>
          
          <router-link
            to="/new"
            class="group relative px-6 py-2.5 bg-yellow-500 text-black text-[12px] font-black uppercase tracking-[0.15em] rounded-full overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-95"
          >
            <span class="relative z-10">{{ $t('nav.play') }}</span>
            <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- ───────── HERO ───────── -->
    <header
      :id="`landing-hero-section-${templateSuffix}`"
      class="relative pt-40 pb-20 px-6 min-h-[90vh] flex flex-col justify-center items-center text-center z-10"
    >
      <div class="max-w-5xl mx-auto">
        <!-- Eyebrow -->
        <div
          :id="`hero-eyebrow-badge-${templateSuffix}`"
          class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-yellow-500/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-12 animate-fade-in"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
          {{ $t('hero.badge') }}
        </div>

        <!-- Headline -->
        <h1 
          :id="`hero-headline-text-${templateSuffix}`" 
          class="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] uppercase mb-8"
        >
          <span class="block">{{ $t('hero.headline').split('{br}')[0] }}</span>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-600 italic">
            {{ $t('hero.like_pro') }}
          </span>
          <span class="block">{{ $t('hero.headline').split('{br}')[2] }}</span>
        </h1>

        <!-- Sub -->
        <p
          :id="`hero-sub-description-${templateSuffix}`"
          class="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-12"
        >
          {{ $t('hero.sub') }}
        </p>

        <!-- CTAs -->
        <div
          :id="`hero-actions-container-${templateSuffix}`"
          class="flex flex-col sm:flex-row gap-6 justify-center items-center"
        >
          <router-link
            to="/new"
            class="w-full sm:w-auto px-10 py-5 bg-yellow-500 text-black font-black uppercase tracking-widest text-sm rounded-xl transition-all hover:scale-105 hover:shadow-[0_10px_40px_rgba(234,179,8,0.3)] active:scale-95 flex items-center justify-center gap-3"
          >
            {{ $t('hero.create') }}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
          </router-link>
          
          <router-link
            to="/lobby"
            class="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-sm rounded-xl transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
          >
            {{ $t('hero.browse') }}
          </router-link>
        </div>

        <!-- Social Proof -->
        <div class="mt-20 pt-10 border-t border-white/5 flex flex-col items-center gap-4">
          <div class="flex -space-x-3">
            <div v-for="i in 4" :key="i" class="w-10 h-10 rounded-full border-2 border-[#030712] bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-[10px] font-bold">
              {{ ['J','M','A','R'][i-1] }}
            </div>
          </div>
          <p class="text-xs text-white/30 font-medium tracking-wide uppercase" v-html="$t('hero.social', { count: '<span class=\'text-white/60 font-bold\'>' + $t('hero.thousands') + '</span>' })"></p>
        </div>
      </div>

      <!-- Scroll Hint -->
      <div class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-30">
        <div class="w-[1px] h-12 bg-gradient-to-b from-yellow-500 to-transparent"></div>
      </div>
    </header>

    <!-- ───────── HOW IT WORKS ───────── -->
    <section id="how" class="py-32 px-6 relative z-10 border-t border-white/5">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-24">
          <span class="text-yellow-500 font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">{{ $t('pages.home.how.label') }}</span>
          <h2 class="text-4xl md:text-6xl font-black tracking-tight uppercase leading-none" v-html="$t('pages.home.how.headline', { br: '<br/>' })"></h2>
        </div>

        <div class="grid md:grid-cols-3 gap-8 relative">
          <!-- Connector Lines (Desktop) -->
          <div class="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0"></div>
          
          <div v-for="i in 3" :key="i" class="relative z-10 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-yellow-500/30 transition-all duration-500 group">
            <div class="w-14 h-14 rounded-2xl bg-yellow-500 text-black flex items-center justify-center text-2xl font-black mb-8 group-hover:scale-110 transition-transform duration-500">
              0{{ i }}
            </div>
            <h3 class="text-xl font-bold uppercase tracking-tight mb-4">{{ $t(`pages.home.how.step${i}_title`) }}</h3>
            <p class="text-white/40 leading-relaxed">{{ $t(`pages.home.how.step${i}_body`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────── FEATURES ───────── -->
    <section id="features" class="py-32 px-6 bg-white/[0.01]">
      <div class="max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <span class="text-yellow-500 font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">{{ $t('pages.home.features.label') }}</span>
            <h2 class="text-4xl md:text-6xl font-black tracking-tight uppercase leading-none mb-8" v-html="$t('pages.home.features.headline', { br: '<br/>' })"></h2>
            <p class="text-lg text-white/40 max-w-md">{{ $t('hero.sub') }}</p>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div 
              v-for="(feat, idx) in ['money', 'setup', 'private', 'responsive']" 
              :key="feat"
              class="p-8 rounded-2xl border border-white/5 bg-[#030712] hover:bg-white/[0.03] transition-all group"
              :class="idx === 0 ? 'sm:col-span-2 sm:p-10' : ''"
            >
              <div class="w-10 h-10 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center mb-6 group-hover:bg-yellow-500 group-hover:text-black transition-all">
                <svg v-if="feat === 'money'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <svg v-if="feat === 'setup'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <svg v-if="feat === 'private'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                <svg v-if="feat === 'responsive'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h4 class="text-lg font-bold uppercase tracking-tight mb-2">{{ $t(`pages.home.features.${feat}_title`) }}</h4>
              <p class="text-sm text-white/40 leading-relaxed">{{ $t(`pages.home.features.${feat}_body`) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────── QUOTE ───────── -->
    <section class="py-40 px-6 relative overflow-hidden">
      <div class="absolute inset-0 bg-yellow-500/[0.02]"></div>
      <div class="max-w-4xl mx-auto text-center relative z-10">
        <span class="text-5xl text-yellow-500/20 font-serif mb-8 block">“</span>
        <p class="text-3xl md:text-5xl font-black italic tracking-tight leading-tight text-white/80 mb-12">
          {{ $t('pages.home.quote.text') }}
        </p>
        <p class="text-xs font-bold uppercase tracking-[0.4em] text-white/20">{{ $t('pages.home.quote.attribution') }}</p>
      </div>
    </section>

    <!-- ───────── FINAL CTA ───────── -->
    <section class="py-32 px-6">
      <div class="max-w-7xl mx-auto rounded-[3rem] bg-gradient-to-br from-yellow-500 to-yellow-600 p-12 md:p-24 text-black overflow-hidden relative group">
        <div class="absolute top-0 right-0 p-10 text-[20rem] font-black opacity-10 leading-none translate-x-1/4 -translate-y-1/4 select-none pointer-events-none">♠</div>
        
        <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div class="text-center md:text-left">
            <span class="font-black uppercase tracking-[0.3em] text-[10px] mb-4 block opacity-60">{{ $t('pages.home.final_cta.label') }}</span>
            <h2 class="text-4xl md:text-6xl font-black tracking-tight uppercase leading-[0.9]" v-html="$t('pages.home.final_cta.headline', { br: '<br/>' })"></h2>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <router-link to="/lobby" class="px-10 py-5 bg-black text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all hover:scale-105 active:scale-95 text-center">
              {{ $t('pages.home.final_cta.create') }}
            </router-link>
            <router-link to="/lobby" class="px-10 py-5 bg-transparent border-2 border-black text-black font-black uppercase tracking-widest text-sm rounded-xl transition-all hover:bg-black hover:text-white active:scale-95 text-center">
              {{ $t('pages.home.final_cta.join') }}
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────── FOOTER ───────── -->
    <footer class="py-20 px-6 border-t border-white/5">
      <div class="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-start">
        <div class="max-w-sm">
          <Logo class="h-6 w-auto mb-8 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all" />
          <p class="text-sm text-white/20 font-medium leading-relaxed mb-8">
            {{ $t('footer.disclaimer') }}
          </p>
        </div>
        
        <div class="flex flex-col md:items-end gap-10">
          <div class="flex flex-wrap gap-8 text-xs font-bold uppercase tracking-widest text-white/30">
            <router-link to="/privacy" class="hover:text-yellow-500 transition-colors">{{ $t('footer.privacy') }}</router-link>
            <router-link to="/terms" class="hover:text-yellow-500 transition-colors">{{ $t('footer.terms') }}</router-link>
            <router-link to="/contact" class="hover:text-yellow-500 transition-colors">{{ $t('footer.contact') }}</router-link>
          </div>
          <p class="text-[10px] text-white/10 font-black uppercase tracking-[0.5em]">
            &copy; 2026 YayPoker Engineering
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useResponsiveStore } from '../store/responsiveStore'
import Logo from '../components/Logo.vue'

const { locale } = useI18n()
const responsive = useResponsiveStore()
const templateSuffix = computed(() => {
  switch (responsive.screenSize) {
    case 'xsmall': return 'Home'
    case 'small': return 'Home'
    case 'medium': return 'Home'
    default: return 'Home'
  }
})
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.8s ease-out forwards;
}
</style>
