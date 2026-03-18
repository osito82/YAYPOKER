<template>
  <div
    :id="`landing-viewport-${templateSuffix}`"
    class="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden font-sans"
  >

    <!-- Grain overlay -->
    <div class="grain-overlay"></div>

    <!-- ───────── NAV ───────── -->
    <nav class="fixed top-0 left-0 right-0 z-50 nav-blur">
      <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Logo id="nav-logo" />
        <div class="hidden md:flex gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
          <a href="#how" class="hover:text-white/80 transition-colors duration-200">How it works</a>
          <a href="#features" class="hover:text-white/80 transition-colors duration-200">Features</a>
        </div>
        <router-link
          to="/lobby"
          class="cta-pill"
        >
          Play now
        </router-link>
      </div>
    </nav>

    <!-- ───────── HERO ───────── -->
    <header class="relative min-h-screen flex flex-col justify-center px-6 pt-24 pb-20 overflow-hidden">

      <!-- Ambient glows -->
      <div class="glow glow-amber"></div>
      <div class="glow glow-red"></div>

      <!-- Card suit decorations -->
      <div class="suit-deco suit-deco-1">♠</div>
      <div class="suit-deco suit-deco-2">♥</div>
      <div class="suit-deco suit-deco-3">♦</div>

      <div class="max-w-6xl mx-auto w-full relative z-10">
        <!-- Eyebrow -->
        <div class="eyebrow-badge mb-10">
          <span class="eyebrow-dot"></span>
          Free to play &nbsp;·&nbsp; No account needed &nbsp;·&nbsp; Works on any device
        </div>

        <!-- Headline -->
        <h1 class="hero-headline">
          Poker night,<br />
          <em class="text-[#f5a623]">no strings</em><br />
          attached.
        </h1>

        <!-- Sub -->
        <p class="hero-sub mt-8 mb-14 max-w-xl">
          Spin up a private table in seconds, share a link, and deal with your friends — wherever they are. No app downloads. No real money. Just the game.
        </p>

        <!-- CTAs -->
        <div class="flex flex-col sm:flex-row gap-4 items-start">
          <router-link to="/new" class="btn-primary">
            Create a table
            <svg class="btn-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd"/></svg>
          </router-link>
          <router-link to="/lobby" class="btn-secondary">
            Browse open tables
          </router-link>
        </div>

        <!-- Social proof strip -->
        <div class="social-strip mt-16">
          <div class="social-avatars">
            <span class="avatar" style="background:#4f46e5">J</span>
            <span class="avatar" style="background:#0891b2">M</span>
            <span class="avatar" style="background:#be185d">A</span>
            <span class="avatar" style="background:#b45309">R</span>
          </div>
          <p class="text-[12px] text-white/40 font-medium">Played by&nbsp;<span class="text-white/70 font-bold">thousands of crews</span>&nbsp;this week</p>
        </div>
      </div>

      <!-- Scroll hint -->
      <div class="scroll-hint">
        <span class="scroll-line"></span>
        <span class="text-[10px] text-white/25 uppercase tracking-[0.3em] font-bold mt-3">Scroll</span>
      </div>
    </header>

    <!-- ───────── HOW IT WORKS ───────── -->
    <section id="how" class="py-32 px-6 border-t border-white/5">
      <div class="max-w-6xl mx-auto">
        <div class="section-label mb-4">How it works</div>
        <h2 class="section-heading mb-20">From zero to all-in<br />in under a minute.</h2>

        <div class="steps-grid">
          <div class="step-card">
            <div class="step-num">01</div>
            <h3 class="step-title">Create your table</h3>
            <p class="step-body">Hit the button, choose an alias — your private table is live. No forms, no passwords, no friction.</p>
          </div>
          <div class="step-divider">→</div>
          <div class="step-card">
            <div class="step-num">02</div>
            <h3 class="step-title">Share the link</h3>
            <p class="step-body">Copy the room code and drop it on WhatsApp, Discord, or wherever your crew hangs out.</p>
          </div>
          <div class="step-divider">→</div>
          <div class="step-card">
            <div class="step-num">03</div>
            <h3 class="step-title">Play your hand</h3>
            <p class="step-body">Cards are dealt automatically. Chips are virtual. The trash talk is very much real.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────── FEATURES ───────── -->
    <section id="features" class="py-32 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="section-label mb-4">Features</div>
        <h2 class="section-heading mb-20">Everything you need.<br />Nothing you don't.</h2>

        <div class="features-grid">
          <div class="feature-card feature-card-large">
            <div class="feature-icon feature-icon-green">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h4 class="feature-title">No real money — ever</h4>
            <p class="feature-body">YayPoker deals in virtual chips only. Want to make it interesting with a side bet between friends? That's your business. We just run the table.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon feature-icon-blue">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h4 class="feature-title">Instant setup</h4>
            <p class="feature-body">No install. No sign-up. Open the link and you're at the table.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon feature-icon-amber">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h4 class="feature-title">Private by default</h4>
            <p class="feature-body">Tables are invite-only. No strangers at your game.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon feature-icon-pink">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <h4 class="feature-title">Any screen, any place</h4>
            <p class="feature-body">Fully responsive — phone, tablet, laptop. Everyone at the table, wherever they are.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────── QUOTE / PULL ───────── -->
    <section class="py-32 px-6 border-y border-white/5 bg-white/[0.02]">
      <div class="max-w-4xl mx-auto text-center">
        <p class="quote-text">
          "The best part of poker night was never the cards. It was the stories you told after."
        </p>
        <p class="quote-attr mt-8">YayPoker &mdash; built for the moments between the hands</p>
      </div>
    </section>

    <!-- ───────── FINAL CTA ───────── -->
    <section class="py-32 px-6">
      <div class="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-16">
        <div>
          <div class="section-label mb-4">Ready?</div>
          <h2 class="section-heading" style="max-width: 520px;">Start your table.<br />Deal the first hand.</h2>
        </div>
        <div class="flex flex-col sm:flex-row gap-4 lg:pb-2">
          <router-link to="/new" class="btn-primary">
            Create a table
            <svg class="btn-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd"/></svg>
          </router-link>
          <router-link to="/lobby" class="btn-secondary">
            Browse open tables
          </router-link>
        </div>
      </div>
    </section>

    <!-- ───────── FOOTER ───────── -->
    <footer class="py-16 border-t border-white/5 px-6">
      <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
        <div class="max-w-xs">
          <Logo class="mb-5 opacity-60" />
          <p class="text-[11px] text-white/20 font-medium leading-relaxed">
            YayPoker is a free social game. No real money changes hands on this platform. Virtual chips have no monetary value. Side arrangements between players are solely their responsibility.
          </p>
        </div>
        <div class="flex flex-col items-start md:items-end gap-3">
          <p class="text-[11px] text-white/20 font-bold uppercase tracking-widest">&copy; 2026 YayPoker</p>
          <div class="flex gap-6 text-[11px] text-white/30 font-medium">
            <a href="#" class="hover:text-white/60 transition-colors">Privacy</a>
            <a href="#" class="hover:text-white/60 transition-colors">Terms</a>
            <a href="#" class="hover:text-white/60 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'
import Logo from '../components/Logo.vue'

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
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

/* ── Ambient glows ── */
.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
}
.glow-amber {
  width: 600px; height: 600px;
  background: rgba(245, 166, 35, 0.07);
  top: -100px; left: 50%;
  transform: translateX(-60%);
}
.glow-red {
  width: 400px; height: 400px;
  background: rgba(239, 68, 68, 0.05);
  top: 200px; right: -100px;
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
.suit-deco-1 { top: 80px; right: 8%; color: #fff; transform: rotate(12deg); }
.suit-deco-2 { bottom: 120px; left: 5%; color: #ef4444; transform: rotate(-8deg); font-size: 90px; }
.suit-deco-3 { top: 40%; right: 15%; color: #f5a623; transform: rotate(20deg); font-size: 70px; }

/* ── Eyebrow badge ── */
.eyebrow-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: rgba(255,255,255,0.5);
}
.eyebrow-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse-dot 2s ease infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.7); }
}

/* ── Hero headline ── */
.hero-headline {
  font-family: inherit;
  font-weight: 800;
  font-size: clamp(52px, 9vw, 110px);
  line-height: 1.0;
  letter-spacing: -0.03em;
  color: #fff;
}
.hero-headline em {
  font-style: italic;
}

/* ── Hero sub ── */
.hero-sub {
  font-size: clamp(15px, 1.5vw, 18px);
  color: rgba(255,255,255,0.45);
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
  transition: background 0.2s, transform 0.15s;
  text-decoration: none;
}
.btn-primary:hover { background: #fbbf24; transform: translateY(-1px); }
.btn-primary:active { transform: scale(0.97); }
.btn-arrow { width: 16px; height: 16px; }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 14px 28px;
  background: transparent;
  color: rgba(255,255,255,0.6);
  font-family: inherit;
  font-weight: 600;
  font-size: 14px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  transition: border-color 0.2s, color 0.2s, transform 0.15s;
  text-decoration: none;
}
.btn-secondary:hover {
  border-color: rgba(255,255,255,0.3);
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
  transition: background 0.2s, border-color 0.2s;
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
  width: 30px; height: 30px;
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
.avatar:first-child { margin-left: 0; }

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
  background: linear-gradient(to bottom, rgba(255,255,255,0.4), transparent);
  display: block;
  margin-bottom: 6px;
  animation: scroll-drop 2s ease infinite;
}
@keyframes scroll-drop {
  0% { transform: scaleY(0); transform-origin: top; opacity: 1; }
  60% { transform: scaleY(1); transform-origin: top; opacity: 1; }
  100% { transform: scaleY(1); transform-origin: top; opacity: 0; }
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
  .step-divider { display: none; }
}
.step-card {
  padding: 32px;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  background: rgba(255,255,255,0.02);
  transition: border-color 0.2s, background 0.2s;
}
.step-card:hover {
  border-color: rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
}
.step-divider {
  font-size: 22px;
  color: rgba(255,255,255,0.1);
  align-self: center;
  padding: 0 16px;
  font-family: inherit;
}
.step-num {
  font-family: inherit;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.15);
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
  font-size: 13px;
  color: rgba(255,255,255,0.4);
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
  .features-grid { grid-template-columns: 1fr; }
}
.feature-card {
  padding: 32px;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  background: rgba(255,255,255,0.02);
  transition: border-color 0.25s, background 0.25s;
}
.feature-card:hover {
  border-color: rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
}
.feature-card-large {
  grid-column: span 2;
}
@media (max-width: 640px) {
  .feature-card-large { grid-column: span 1; }
}
.feature-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
.feature-icon-green  { background: rgba(34, 197, 94, 0.1);  color: #22c55e; }
.feature-icon-blue   { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
.feature-icon-amber  { background: rgba(245, 166, 35, 0.1); color: #f5a623; }
.feature-icon-pink   { background: rgba(236, 72, 153, 0.1); color: #f472b6; }
.feature-title {
  font-family: inherit;
  font-weight: 700;
  font-size: 17px;
  color: #fff;
  margin-bottom: 10px;
  letter-spacing: -0.01em;
}
.feature-body {
  font-size: 13px;
  color: rgba(255,255,255,0.4);
  line-height: 1.8;
}

/* ── Quote ── */
.quote-text {
  font-family: inherit;
  font-style: italic;
  font-size: clamp(22px, 3.5vw, 38px);
  font-weight: 700;
  line-height: 1.35;
  color: rgba(255,255,255,0.75);
  letter-spacing: -0.02em;
}
.quote-attr {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.2);
}
</style>
