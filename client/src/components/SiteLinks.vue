<template>
  <nav
    id="site-links-nav-Public"
    class="max-w-4xl mx-auto mt-20 pt-10 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40"
    :aria-label="$t('site_links.label')"
  >
    <div id="site-links-list-Public" class="flex flex-wrap gap-x-6 gap-y-3">
      <router-link
        v-for="link in links"
        :key="link.path"
        :id="`site-links-item-${link.id}-Public`"
        :to="localePath(link.path)"
        class="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors"
        >{{ $t(link.label) }}</router-link
      >
    </div>
    <div id="site-links-locale-Public" class="flex gap-3">
      <a
        v-for="l in ['en', 'es']"
        :key="l"
        :id="`site-links-locale-${l}-Public`"
        :href="localizedPath(basePath(route.path), l)"
        :hreflang="l"
        class="transition-colors"
        :class="
          locale === l
            ? 'text-yellow-600 dark:text-yellow-500'
            : 'hover:text-gray-600 dark:hover:text-white/70'
        "
        @click.prevent="switchLocale(l)"
        >{{ l.toUpperCase() }}</a
      >
    </div>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useLocalePath } from '../use/useLocalePath'
import { basePath, localizedPath } from '../seo/pages'

const route = useRoute()
const { locale, localePath, switchLocale } = useLocalePath()

const links = [
  { id: 'home', path: '/', label: 'site_links.home' },
  { id: 'rules', path: '/rules', label: 'site_links.rules' },
  { id: 'hand-rankings', path: '/hand-rankings', label: 'site_links.hand_rankings' },
  { id: 'about', path: '/about', label: 'site_links.about' },
  { id: 'privacy', path: '/privacy', label: 'footer.privacy' },
  { id: 'terms', path: '/terms', label: 'footer.terms' },
  { id: 'contact', path: '/contact', label: 'footer.contact' },
]
</script>
