// Public pages indexed by search engines (spec OPS-003). Single source for the router, the head
// updater, the build-time prerender and the sitemap.

export const SITE_URL = 'https://yaypoker.com'
export const LOCALES = ['en', 'es']
export const DEFAULT_LOCALE = 'en'

// `key` points to `seo.<key>.title|description` in the locale files.
export const SEO_PAGES = [
  { name: 'landing', path: '/', key: 'home' },
  { name: 'about', path: '/about', key: 'about' },
  { name: 'rules', path: '/rules', key: 'rules' },
  { name: 'hand-rankings', path: '/hand-rankings', key: 'hand_rankings' },
  { name: 'privacy', path: '/privacy', key: 'privacy' },
  { name: 'terms', path: '/terms', key: 'terms' },
  { name: 'contact', path: '/contact', key: 'contact' },
]

// '/about' + 'es' → '/es/about'; '/' + 'es' → '/es'
export function localizedPath(path, locale) {
  if (locale !== 'es') return path
  return path === '/' ? '/es' : '/es' + path
}

// '/es/about' → '/about'; '/es' → '/'
export function basePath(path) {
  if (path === '/es' || path === '/es/') return '/'
  return path.startsWith('/es/') ? path.slice(3) : path
}

export function absoluteUrl(path) {
  return SITE_URL + (path === '/' ? '/' : path)
}

// Every indexable URL: [{ page, locale, path }]
export function seoUrls() {
  return SEO_PAGES.flatMap((page) =>
    LOCALES.map((locale) => ({
      page,
      locale,
      path: localizedPath(page.path, locale),
    })),
  )
}
