// Build-time renderer for the public pages (spec OPS-003). Loaded by scripts/prerender.mjs from
// the SSR bundle; never shipped to the browser.
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createPinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import App from './App.vue'
import { createAppRouter } from './router'
import i18n from './i18n'
import { headData } from './seo/head'

export { seoUrls, SITE_URL, absoluteUrl, LOCALES } from './seo/pages'
export { fillTemplate, sitemapXml, validatePages } from './seo/build'

// Renders one URL. Returns the app HTML, its locale and the head data (null for non-SEO routes).
export async function render(url) {
  const app = createSSRApp(App)
  app.use(createPinia())
  const router = createAppRouter(createMemoryHistory())
  app.use(router)
  app.use(i18n)

  await router.push(url)
  await router.isReady()

  const route = router.currentRoute.value
  // App shell and 404 are rendered in the default language
  if (!route.meta.locale) i18n.global.locale.value = 'en'
  const html = await renderToString(app)
  const locale = i18n.global.locale.value
  const head = route.meta.seo
    ? headData(route.meta.seo, route.meta.locale, i18n.global.t)
    : null
  return { html, locale, head, title: route.meta.title }
}
