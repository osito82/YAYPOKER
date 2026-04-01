<template>
  <div class="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-600 dark:text-gray-300 font-sans p-8 md:p-16 transition-colors duration-300">
    <div class="max-w-4xl mx-auto">
      <router-link to="/" class="inline-flex items-center text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400 mb-12 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {{ $t('pages.privacy.back') }}
      </router-link>

      <h1 
        class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-8 italic uppercase tracking-tighter"
        v-html="$t('pages.privacy.headline', { span: '<span class=\'text-yellow-600 dark:text-yellow-500\'>' + $t('pages.privacy.headline_span') + '</span>' })"
      ></h1>

      <div class="space-y-8 text-lg leading-relaxed">
        <section>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ $t('pages.privacy.section1_title') }}</h2>
          <p>
            {{ $t('pages.privacy.section1_content') }}
          </p>
        </section>

        <section class="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-2xl">
          <h2 class="text-2xl font-bold text-yellow-600 dark:text-yellow-500 mb-4">{{ $t('pages.privacy.section2_title') }}</h2>
          <p class="mb-4" v-html="$t('pages.privacy.section2_content')"></p>
          <ul class="list-disc list-inside space-y-2 text-gray-500 dark:text-gray-400">
            <li v-for="(item, index) in $tm('pages.privacy.section2_list')" :key="index">
              {{ item }}
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ $t('pages.privacy.section3_title') }}</h2>
          <p v-html="$t('pages.privacy.section3_content')"></p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ $t('pages.privacy.section4_title') }}</h2>
          <p>
            {{ $t('pages.privacy.section4_content') }}
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ $t('pages.privacy.section5_title') }}</h2>
          <p>
            {{ $t('pages.privacy.section5_content') }}
          </p>
        </section>

        <section class="pt-8 border-t border-gray-200 dark:border-white/10">
          <p class="text-sm text-gray-400 dark:text-gray-500 italic">
            {{ $t('pages.privacy.last_updated') }}
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
// Privacy Policy Page
</script>
