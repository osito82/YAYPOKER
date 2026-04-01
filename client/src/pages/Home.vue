<template>
  <div
    :id="`landing-viewport-${templateSuffix}`"
    class="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden font-sans"
  >
    <!-- Grain overlay -->
    <div :id="`grain-overlay-${templateSuffix}`" class="grain-overlay"></div>

    <!-- ───────── NAV ───────── -->
    <nav
      :id="`landing-nav-bar-${templateSuffix}`"
      class="fixed top-0 left-0 right-0 z-50 nav-blur"
    >
      <div
        class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center"
      >
        <Logo :id="`nav-logo-${templateSuffix}`" />
        <div
          class="hidden md:flex gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40"
        >
          <a
            href="#how"
            :id="`nav-link-how-${templateSuffix}`"
            class="hover:text-white/80 transition-colors duration-200"
            >{{ $t('nav.how') }}</a
          >
          <a
            href="#features"
            :id="`nav-link-features-${templateSuffix}`"
            class="hover:text-white/80 transition-colors duration-200"
            >{{ $t('nav.features') }}</a
          >
        </div>
        <div class="flex items-center gap-6">
          <!-- Language Switcher -->
          <div class="flex gap-2 text-[10px] font-black uppercase tracking-widest mr-2">
            <button 
              @click="locale = 'en'" 
              class="transition-colors cursor-pointer"
              :class="locale === 'en' ? 'text-yellow-500' : 'text-white/20 hover:text-white/50'"
            >EN</button>
            <span class="text-white/10">|</span>
            <button 
              @click="locale = 'es'" 
              class="transition-colors cursor-pointer"
              :class="locale === 'es' ? 'text-yellow-500' : 'text-white/20 hover:text-white/50'"
            >ES</button>
          </div>

          <router-link
            to="/lobby"
            :id="`nav-link-join-${templateSuffix}`"
            class="hidden sm:block text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white/80 transition-colors duration-200"
          >
            {{ $t('nav.join') }}
          </router-link>
          <router-link
            to="/lobby"
            :id="`nav-cta-play-${templateSuffix}`"
            class="cta-pill"
          >
            {{ $t('nav.play') }}
          </router-link>
        </div>
      </div>
    </nav>

    <!-- ───────── HERO ───────── -->
    <header
      :id="`landing-hero-section-${templateSuffix}`"
      class="relative min-h-screen flex flex-col justify-center px-6 pt-24 pb-20 overflow-hidden"
    >
      <!-- Ambient glows -->
      <div
        :id="`hero-glow-amber-${templateSuffix}`"
        class="glow glow-amber"
      ></div>
      <div :id="`hero-glow-red-${templateSuffix}`" class="glow glow-red"></div>

      <!-- Card suit decorations -->
      <div
        :id="`hero-suit-deco-1-${templateSuffix}`"
        class="suit-deco suit-deco-1"
      >
        ♠
      </div>
      <div
        :id="`hero-suit-deco-2-${templateSuffix}`"
        class="suit-deco suit-deco-2"
      >
        ♥
      </div>
      <div
        :id="`hero-suit-deco-3-${templateSuffix}`"
        class="suit-deco suit-deco-3"
      >
        ♦
      </div>

      <div class="max-w-6xl mx-auto w-full relative z-10">
        <!-- Eyebrow -->
        <div
          :id="`hero-eyebrow-badge-${templateSuffix}`"
          class="eyebrow-badge mb-10"
        >
          <span
            :id="`hero-eyebrow-dot-${templateSuffix}`"
            class="eyebrow-dot"
          ></span>
          {{ $t('hero.badge') }}
        </div>

        <!-- Headline -->
        <h1 
          :id="`hero-headline-text-${templateSuffix}`" 
          class="hero-headline"
          v-html="$t('hero.headline', { br: '<br/>', like_pro: '<em class=\'text-[#f5a623]\'>' + $t('hero.like_pro') + '</em>' })"
        >
        </h1>

        <!-- Sub -->
        <p
          :id="`hero-sub-description-${templateSuffix}`"
          class="hero-sub mt-8 mb-14 max-w-xl"
        >
          {{ $t('hero.sub') }}
        </p>

        <!-- CTAs -->
        <div
          :id="`hero-actions-container-${templateSuffix}`"
          class="flex flex-col sm:flex-row gap-4 items-start"
        >
          <router-link
            to="/new"
            :id="`hero-btn-create-table-${templateSuffix}`"
            class="btn-primary"
          >
            {{ $t('hero.create') }}
            <svg
              class="btn-arrow"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clip-rule="evenodd"
              />
            </svg>
          </router-link>
          <router-link
            to="/lobby"
            :id="`hero-btn-browse-tables-${templateSuffix}`"
            class="btn-secondary"
          >
            {{ $t('hero.browse') }}
          </router-link>
        </div>

        <!-- Social proof strip -->
        <div
          :id="`hero-social-proof-${templateSuffix}`"
          class="social-strip mt-16"
        >
          <div
            :id="`hero-social-avatars-${templateSuffix}`"
            class="social-avatars"
          >
            <span class="avatar" style="background: #4f46e5">J</span>
            <span class="avatar" style="background: #0891b2">M</span>
            <span class="avatar" style="background: #be185d">A</span>
            <span class="avatar" style="background: #b45309">R</span>
          </div>
          <p
            :id="`hero-social-text-${templateSuffix}`"
            class="text-[12px] text-white/40 font-medium"
            v-html="$t('hero.social', { count: '<span class=\'text-white/70 font-bold\'>' + $t('hero.thousands') + '</span>' })"
          >
          </p>
        </div>
      </div>

      <!-- Scroll hint -->
      <div :id="`hero-scroll-hint-${templateSuffix}`" class="scroll-hint">
        <span
          :id="`hero-scroll-line-${templateSuffix}`"
          class="scroll-line"
        ></span>
        <span
          class="text-[10px] text-white/25 uppercase tracking-[0.3em] font-bold mt-3"
          >{{ $t('hero.scroll') }}</span
        >
      </div>
    </header>

    <!-- ───────── HOW IT WORKS ───────── -->
    <section
      id="how"
      :id="`how-it-works-section-${templateSuffix}`"
      class="py-32 px-6 border-t border-white/5"
    >
      <div class="max-w-6xl mx-auto">
        <div :id="`how-label-${templateSuffix}`" class="section-label mb-4">
          {{ $t('pages.home.how.label') }}
        </div>
        <h2
          :id="`how-headline-${templateSuffix}`"
          class="section-heading mb-20"
          v-html="$t('pages.home.how.headline', { br: '<br/>' })"
        >
        </h2>

        <div :id="`how-steps-grid-${templateSuffix}`" class="steps-grid">
          <div :id="`how-step-1-${templateSuffix}`" class="step-card">
            <div class="step-num">01</div>
            <h3 class="step-title">{{ $t('pages.home.how.step1_title') }}</h3>
            <p class="step-body">
              {{ $t('pages.home.how.step1_body') }}
            </p>
          </div>
          <div class="step-divider">→</div>
          <div :id="`how-step-2-${templateSuffix}`" class="step-card">
            <div class="step-num">02</div>
            <h3 class="step-title">{{ $t('pages.home.how.step2_title') }}</h3>
            <p class="step-body">
              {{ $t('pages.home.how.step2_body') }}
            </p>
          </div>
          <div class="step-divider">→</div>
          <div :id="`how-step-3-${templateSuffix}`" class="step-card">
            <div class="step-num">03</div>
            <h3 class="step-title">{{ $t('pages.home.how.step3_title') }}</h3>
            <p class="step-body">
              {{ $t('pages.home.how.step3_body') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────── FEATURES ───────── -->
    <section
      id="features"
      :id="`features-section-${templateSuffix}`"
      class="py-32 px-6"
    >
      <div class="max-w-6xl mx-auto">
        <div
          :id="`features-label-${templateSuffix}`"
          class="section-label mb-4"
        >
          {{ $t('pages.home.features.label') }}
        </div>
        <h2
          :id="`features-headline-${templateSuffix}`"
          class="section-heading mb-20"
          v-html="$t('pages.home.features.headline', { br: '<br/>' })"
        >
        </h2>

        <div :id="`features-grid-${templateSuffix}`" class="features-grid">
          <div
            :id="`feature-card-money-${templateSuffix}`"
            class="feature-card feature-card-large"
          >
            <div class="feature-icon feature-icon-green">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 class="feature-title">{{ $t('pages.home.features.money_title') }}</h4>
            <p class="feature-body">
              {{ $t('pages.home.features.money_body') }}
            </p>
          </div>

          <div
            :id="`feature-card-setup-${templateSuffix}`"
            class="feature-card"
          >
            <div class="feature-icon feature-icon-blue">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h4 class="feature-title">{{ $t('pages.home.features.setup_title') }}</h4>
            <p class="feature-body">
              {{ $t('pages.home.features.setup_body') }}
            </p>
          </div>

          <div
            :id="`feature-card-private-${templateSuffix}`"
            class="feature-card"
          >
            <div class="feature-icon feature-icon-amber">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h4 class="feature-title">{{ $t('pages.home.features.private_title') }}</h4>
            <p class="feature-body">
              {{ $t('pages.home.features.private_body') }}
            </p>
          </div>

          <div
            :id="`feature-card-responsive-${templateSuffix}`"
            class="feature-card"
          >
            <div class="feature-icon feature-icon-pink">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h4 class="feature-title">{{ $t('pages.home.features.responsive_title') }}</h4>
            <p class="feature-body">
              {{ $t('pages.home.features.responsive_body') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────── QUOTE / PULL ───────── -->
    <section
      :id="`quote-section-${templateSuffix}`"
      class="py-32 px-6 border-y border-white/5 bg-white/[0.02]"
    >
      <div class="max-w-4xl mx-auto text-center">
        <p :id="`quote-text-content-${templateSuffix}`" class="quote-text">
          {{ $t('pages.home.quote.text') }}
        </p>
        <p :id="`quote-attribution-${templateSuffix}`" class="quote-attr mt-8">
          {{ $t('pages.home.quote.attribution') }}
        </p>
      </div>
    </section>

    <!-- ───────── FINAL CTA ───────── -->
    <section :id="`final-cta-section-${templateSuffix}`" class="py-32 px-6">
      <div
        class="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-16"
      >
        <div>
          <div
            :id="`final-cta-label-${templateSuffix}`"
            class="section-label mb-4"
          >
            {{ $t('pages.home.final_cta.label') }}
          </div>
          <h2
            :id="`final-cta-headline-${templateSuffix}`"
            class="section-heading"
            style="max-width: 520px"
            v-html="$t('pages.home.final_cta.headline', { br: '<br/>' })"
          >
          </h2>
        </div>
        <div
          :id="`final-cta-actions-wrapper-${templateSuffix}`"
          class="flex flex-col sm:flex-row gap-4 lg:pb-2"
        >
          <router-link
            to="/new"
            :id="`final-cta-btn-create-${templateSuffix}`"
            class="btn-primary"
          >
            {{ $t('pages.home.final_cta.create') }}
            <svg
              class="btn-arrow"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clip-rule="evenodd"
              />
            </svg>
          </router-link>
          <router-link
            to="/lobby"
            :id="`final-cta-btn-browse-${templateSuffix}`"
            class="btn-secondary"
          >
            {{ $t('pages.home.final_cta.join') }}
          </router-link>
        </div>
      </div>
    </section>

    <!-- ───────── FOOTER ───────── -->
    <footer
      :id="`landing-footer-${templateSuffix}`"
      class="py-16 border-t border-white/5 px-6"
    >
      <div
        class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10"
      >
        <div class="max-w-xs">
          <Logo :id="`footer-logo-${templateSuffix}`" class="mb-5 opacity-60" />
          <p
            :id="`footer-disclaimer-${templateSuffix}`"
            class="text-[13px] text-white/20 font-medium leading-relaxed"
          >
            {{ $t('footer.disclaimer') }}
          </p>
        </div>
        <div
          :id="`footer-copyright-wrapper-${templateSuffix}`"
          class="flex flex-col items-start md:items-end gap-3"
        >
          <p
            :id="`footer-copyright-text-${templateSuffix}`"
            class="text-[13px] text-white/20 font-bold uppercase tracking-widest"
          >
            &copy; 2026 YayPoker
          </p>
          <div
            :id="`footer-links-wrapper-${templateSuffix}`"
            class="flex gap-6 text-[13px] text-white/30 font-medium"
          >
            <router-link
              to="/privacy"
              :id="`footer-link-privacy-${templateSuffix}`"
              class="hover:text-white/60 transition-colors"
              >{{ $t('footer.privacy') }}</router-link
            >
            <router-link
              to="/terms"
              :id="`footer-link-terms-${templateSuffix}`"
              class="hover:text-white/60 transition-colors"
              >{{ $t('footer.terms') }}</router-link
            >
            <router-link
              to="/contact"
              :id="`footer-link-contact-${templateSuffix}`"
              class="hover:text-white/60 transition-colors"
              >{{ $t('footer.contact') }}</router-link
            >
          </div>
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
    case 'xsmall':
      return 'Home'
    case 'small':
      return 'Home'
    case 'medium':
      return 'Home'
    default:
      return 'Home'
  }
})
</script>

<style scoped>
/* ── Grain overlay ── */
.grain-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ── Nav blur ── */
.nav-blur {
  background: rgba(10, 10, 10, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* ── Ambient glows ── */
.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
}
.glow-amber {
  width: 600px;
  height: 600px;
  background: rgba(245, 166, 35, 0.07);
  top: -100px;
  left: 50%;
  transform: translateX(-60%);
}
.glow-red {
  width: 400px;
  height: 400px;
  background: rgba(239, 68, 68, 0.05);
  top: 200px;
  right: -100px;
}

/* ── Card suit decorations ── */
.suit-deco {
  position: absolute;
  font-size: 120px;
  font-family: serif;
  pointer-events: none;
  user-select: none;
  opacity: 0.03;
  line-height: 1;
}
.suit-deco-1 {
  top: 80px;
  right: 8%;
  color: #fff;
  transform: rotate(12deg);
}
.suit-deco-2 {
  bottom: 120px;
  left: 5%;
  color: #ef4444;
  transform: rotate(-8deg);
  font-size: 90px;
}
.suit-deco-3 {
  top: 40%;
  right: 15%;
  color: #f5a623;
  transform: rotate(20deg);
  font-size: 70px;
}

/* ── Eyebrow badge ── */
.eyebrow-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: rgba(255, 255, 255, 0.5);
}
.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse-dot 2s ease infinite;
}
@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.7);
  }
}

/* ── Hero headline ── */
.hero-headline {
  font-family: inherit;
  font-weight: 800;
  font-size: clamp(52px, 9vw, 110px);
  line-height: 1;
  letter-spacing: -0.03em;
  color: #fff;
}
.hero-headline em {
  font-style: italic;
}

/* ── Hero sub ── */
.hero-sub {
  font-size: clamp(18px, 1.8vw, 22px);
  color: rgba(255, 255, 255, 0.45);
  font-weight: 400;
  line-height: 1.75;
}

/* ── Buttons ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: #f5a623;
  color: #000;
  font-family: inherit;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.01em;
  border-radius: 12px;
  transition:
    background 0.2s,
    transform 0.15s;
  text-decoration: none;
}
.btn-primary:hover {
  background: #fbbf24;
  transform: translateY(-1px);
}
.btn-primary:active {
  transform: scale(0.97);
}
.btn-arrow {
  width: 16px;
  height: 16px;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 14px 28px;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-family: inherit;
  font-weight: 600;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  transition:
    border-color 0.2s,
    color 0.2s,
    transform 0.15s;
  text-decoration: none;
}
.btn-secondary:hover {
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
  transform: translateY(-1px);
}

.cta-pill {
  padding: 8px 20px;
  background: rgba(245, 166, 35, 0.12);
  border: 1px solid rgba(245, 166, 35, 0.3);
  color: #f5a623;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition:
    background 0.2s,
    border-color 0.2s;
  text-decoration: none;
}
.cta-pill:hover {
  background: rgba(245, 166, 35, 0.2);
  border-color: rgba(245, 166, 35, 0.5);
}

/* ── Social strip ── */
.social-strip {
  display: flex;
  align-items: center;
  gap: 12px;
}
.social-avatars {
  display: flex;
}
.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  margin-left: -6px;
}
.avatar:first-child {
  margin-left: 0;
}

/* ── Scroll hint ── */
.scroll-hint {
  position: absolute;
  bottom: 36px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.scroll-line {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.4), transparent);
  display: block;
  margin-bottom: 6px;
  animation: scroll-drop 2s ease infinite;
}
@keyframes scroll-drop {
  0% {
    transform: scaleY(0);
    transform-origin: top;
    opacity: 1;
  }
  60% {
    transform: scaleY(1);
    transform-origin: top;
    opacity: 1;
  }
  100% {
    transform: scaleY(1);
    transform-origin: top;
    opacity: 0;
  }
}

/* ── Section labels & headings ── */
.section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #f5a623;
}
.section-heading {
  font-family: inherit;
  font-weight: 800;
  font-size: clamp(32px, 5vw, 60px);
  line-height: 1.08;
  letter-spacing: -0.025em;
  color: #fff;
}

/* ── How it works ── */
.steps-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  gap: 0;
  align-items: start;
}
@media (max-width: 768px) {
  .steps-grid {
    grid-template-columns: 1fr;
  }
  .step-divider {
    display: none;
  }
}
.step-card {
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.02);
  transition:
    border-color 0.2s,
    background 0.2s;
}
.step-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}
.step-divider {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.1);
  align-self: center;
  padding: 0 16px;
  font-family: inherit;
}
.step-num {
  font-family: inherit;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.15);
  margin-bottom: 20px;
}
.step-title {
  font-family: inherit;
  font-weight: 700;
  font-size: 18px;
  color: #fff;
  margin-bottom: 12px;
  letter-spacing: -0.01em;
}
.step-body {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.75;
  font-weight: 400;
}

/* ── Features ── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
@media (max-width: 640px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}
.feature-card {
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.02);
  transition:
    border-color 0.25s,
    background 0.25s;
}
.feature-card:hover {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
}
.feature-card-large {
  grid-column: span 2;
}
@media (max-width: 640px) {
  .feature-card-large {
    grid-column: span 1;
  }
}
.feature-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
.feature-icon-green {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}
.feature-icon-blue {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
}
.feature-icon-amber {
  background: rgba(245, 166, 35, 0.1);
  color: #f5a623;
}
.feature-icon-pink {
  background: rgba(236, 72, 153, 0.1);
  color: #f472b6;
}
.feature-title {
  font-family: inherit;
  font-weight: 700;
  font-size: 17px;
  color: #fff;
  margin-bottom: 10px;
  letter-spacing: -0.01em;
}
.feature-body {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.8;
}

/* ── Quote ── */
.quote-text {
  font-family: inherit;
  font-style: italic;
  font-size: clamp(22px, 3.5vw, 38px);
  font-weight: 700;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: -0.02em;
}
.quote-attr {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.2);
}
</style>
