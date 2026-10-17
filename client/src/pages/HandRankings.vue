<template>
  <div
    id="rankings-viewport-HandRankings"
    class="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-600 dark:text-gray-300 font-sans p-8 md:p-16 transition-colors duration-300"
  >
    <article id="rankings-article-HandRankings" class="max-w-4xl mx-auto">
      <router-link
        id="rankings-link-back-HandRankings"
        :to="localePath('/')"
        class="inline-flex items-center text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400 mb-12 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        {{ $t('pages.hand_rankings.back') }}
      </router-link>

      <header id="rankings-header-HandRankings" class="mb-12">
        <p
          id="rankings-badge-HandRankings"
          class="text-xs font-black uppercase tracking-[0.3em] text-yellow-600 dark:text-yellow-500 mb-4"
        >
          {{ $t('pages.hand_rankings.badge') }}
        </p>
        <h1
          id="rankings-headline-HandRankings"
          class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-8 italic uppercase tracking-tighter"
        >
          {{ $t('pages.hand_rankings.headline') }}
        </h1>
        <p id="rankings-intro-HandRankings" class="text-lg leading-relaxed">
          {{ $t('pages.hand_rankings.intro') }}
        </p>
      </header>

      <ol id="rankings-list-HandRankings" class="space-y-6">
        <li
          v-for="(hand, i) in $tm('pages.hand_rankings.hands')"
          :key="i"
          :id="`rankings-item-${i}-HandRankings`"
          class="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-2xl"
        >
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            <span class="text-yellow-600 dark:text-yellow-500 mr-2"
              >{{ i + 1 }}.</span
            >{{ $rt(hand.name) }}
          </h2>
          <p class="text-lg leading-relaxed mb-4">{{ $rt(hand.body) }}</p>
          <div class="flex gap-1.5 sm:gap-2" aria-hidden="true">
            <Card
              v-for="card in EXAMPLES[i]"
              :key="card"
              :numSymbol="card"
              :size="responsive.screenSize === 'xsmall' ? 'xsmall' : 'small'"
              :percentage="100"
            />
          </div>
          <p class="sr-only">{{ cardText(EXAMPLES[i]) }}</p>
        </li>
      </ol>

      <section id="rankings-ties-HandRankings" class="mt-16 text-lg leading-relaxed">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {{ $t('pages.hand_rankings.ties_title') }}
        </h2>
        <ul class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
          <li v-for="(item, j) in $tm('pages.hand_rankings.ties')" :key="j">
            {{ $rt(item) }}
          </li>
        </ul>
        <router-link
          id="rankings-link-rules-HandRankings"
          :to="localePath('/rules')"
          class="inline-block mt-8 text-yellow-600 dark:text-yellow-500 hover:underline"
          >{{ $t('pages.hand_rankings.see_rules') }} →</router-link
        >
      </section>
    </article>
    <SiteLinks />
  </div>
</template>

<script setup>
import Card from '../components/Card.vue'
import SiteLinks from '../components/SiteLinks.vue'
import { useLocalePath } from '../use/useLocalePath'
import { useResponsiveStore } from '../store/responsiveStore'
import { simbolConverter } from '../vutils'

const { localePath } = useLocalePath()
const responsive = useResponsiveStore()

// One example per hand, in the same order as `pages.hand_rankings.hands`
const EXAMPLES = [
  ['As', 'Ks', 'Qs', 'Js', 'Ts'],
  ['9h', '8h', '7h', '6h', '5h'],
  ['Qc', 'Qd', 'Qh', 'Qs', '7d'],
  ['Kh', 'Kd', 'Ks', '4c', '4h'],
  ['Ad', 'Jd', '8d', '6d', '2d'],
  ['Tc', '9d', '8s', '7h', '6c'],
  ['7s', '7h', '7d', 'Kc', '2s'],
  ['Jh', 'Jc', '5d', '5s', 'As'],
  ['Ts', 'Th', 'Ad', '8c', '3h'],
  ['Ah', 'Jd', '9s', '6c', '3d'],
]

const cardText = (cards) =>
  cards
    .map((c) => {
      const { letter, symbol } = simbolConverter(c)
      return letter + symbol
    })
    .join(' ')
</script>
