<template>
  <div class="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-600 dark:text-gray-300 font-sans p-8 md:p-16 transition-colors duration-300">
    <div class="max-w-4xl mx-auto">
      <router-link to="/" class="inline-flex items-center text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400 mb-12 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {{ $t('pages.terms.back') }}
      </router-link>

      <h1 
        class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-8 italic uppercase tracking-tighter"
        v-html="$t('pages.terms.headline', { span: '<span class=\'text-yellow-600 dark:text-yellow-500\'>' + $t('pages.terms.headline_span') + '</span>' })"
      ></h1>

      <div class="space-y-8 text-lg leading-relaxed">
        <section class="bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
          <h2 class="text-2xl font-bold text-red-600 dark:text-red-500 mb-4 italic uppercase">{{ $t('pages.terms.section1_title') }}</h2>
          <p class="text-gray-900 dark:text-white font-medium">
            {{ $t('pages.terms.section1_content_bold') }}
          </p>
          <p class="mt-2">
            {{ $t('pages.terms.section1_content') }}
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ $t('pages.terms.section2_title') }}</h2>
          <p>
            {{ $t('pages.terms.section2_content') }}
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ $t('pages.terms.section3_title') }}</h2>
          <p>
            {{ $t('pages.terms.section3_content') }}
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ $t('pages.terms.section4_title') }}</h2>
          <p>
            {{ $t('pages.terms.section4_content') }}
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ $t('pages.terms.section5_title') }}</h2>
          <p>
            {{ $t('pages.terms.section5_content') }}
          </p>
        </section>

        <section class="pt-8 border-t border-gray-200 dark:border-white/10 text-sm text-gray-400 dark:text-gray-500">
          <p>
            {{ $t('pages.terms.footer') }}
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
// Terms of Service Page
</script>
