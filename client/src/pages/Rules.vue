<template>
  <div
    id="rules-viewport-Rules"
    class="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-600 dark:text-gray-300 font-sans p-8 md:p-16 transition-colors duration-300"
  >
    <article id="rules-article-Rules" class="max-w-4xl mx-auto">
      <router-link
        id="rules-link-back-Rules"
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
        {{ $t('pages.rules.back') }}
      </router-link>

      <header id="rules-header-Rules" class="mb-12">
        <p
          id="rules-badge-Rules"
          class="text-xs font-black uppercase tracking-[0.3em] text-yellow-600 dark:text-yellow-500 mb-4"
        >
          {{ $t('pages.rules.badge') }}
        </p>
        <h1
          id="rules-headline-Rules"
          class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-8 italic uppercase tracking-tighter"
        >
          {{ $t('pages.rules.headline') }}
        </h1>
        <p id="rules-intro-Rules" class="text-lg leading-relaxed">
          {{ $t('pages.rules.intro') }}
        </p>
      </header>

      <div id="rules-sections-Rules" class="space-y-12 text-lg leading-relaxed">
        <section
          v-for="(section, i) in $tm('pages.rules.sections')"
          :key="i"
          :id="`rules-section-${i}-Rules`"
        >
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {{ $rt(section.title) }}
          </h2>
          <ul
            v-if="section.list"
            class="list-disc pl-6 space-y-2 mb-4 text-gray-600 dark:text-gray-400"
          >
            <li v-for="(item, j) in section.list" :key="j">{{ $rt(item) }}</li>
          </ul>
          <p
            v-for="(paragraph, j) in section.paragraphs || []"
            :key="j"
            class="mb-4"
          >
            {{ $rt(paragraph) }}
          </p>
        </section>
      </div>

      <section
        id="rules-cta-Rules"
        class="mt-16 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-8 rounded-2xl"
      >
        <h2
          id="rules-cta-title-Rules"
          class="text-2xl font-bold text-gray-900 dark:text-white mb-3"
        >
          {{ $t('pages.rules.cta_title') }}
        </h2>
        <p id="rules-cta-body-Rules" class="mb-6">
          {{ $t('pages.rules.cta_body') }}
        </p>
        <div class="flex flex-wrap gap-3">
          <router-link
            id="rules-cta-create-Rules"
            to="/new"
            class="px-6 py-3 rounded-xl bg-yellow-500 text-black font-black uppercase text-sm tracking-wider hover:bg-yellow-400 transition-colors"
            >{{ $t('pages.rules.cta_create') }}</router-link
          >
          <router-link
            id="rules-cta-public-Rules"
            to="/public"
            class="px-6 py-3 rounded-xl border border-gray-300 dark:border-white/20 font-black uppercase text-sm tracking-wider hover:border-yellow-500 transition-colors"
            >{{ $t('pages.rules.cta_public') }}</router-link
          >
        </div>
        <router-link
          id="rules-link-rankings-Rules"
          :to="localePath('/hand-rankings')"
          class="inline-block mt-6 text-yellow-600 dark:text-yellow-500 hover:underline"
          >{{ $t('pages.rules.see_rankings') }} →</router-link
        >
      </section>
    </article>
    <SiteLinks />
  </div>
</template>

<script setup>
import SiteLinks from '../components/SiteLinks.vue'
import { useLocalePath } from '../use/useLocalePath'

const { localePath } = useLocalePath()
</script>
