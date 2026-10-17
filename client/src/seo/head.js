// Head tags for SEO pages (spec OPS-003 R-02). `headTags` builds the HTML string used at build
// time; `applyHead` keeps the live document in sync on client-side navigation.
import {
  LOCALES,
  DEFAULT_LOCALE,
  SITE_URL,
  absoluteUrl,
  localizedPath,
} from './pages'

const OG_IMAGE = SITE_URL + '/og-image.jpg'

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export function headData(page, locale, t) {
  const path = localizedPath(page.path, locale)
  // The brand suffix stays out of the messages: vue-i18n reads `|` as a plural separator.
  const title = t(`seo.${page.key}.title`)
  return {
    title: page.path === '/' ? title : `${title} | YayPoker`,
    description: t(`seo.${page.key}.description`),
    canonical: absoluteUrl(path),
    alternates: [
      ...LOCALES.map((l) => ({
        hreflang: l,
        href: absoluteUrl(localizedPath(page.path, l)),
      })),
      {
        hreflang: 'x-default',
        href: absoluteUrl(localizedPath(page.path, DEFAULT_LOCALE)),
      },
    ],
    ogLocale: locale === 'es' ? 'es_ES' : 'en_US',
  }
}

export function headTags(data) {
  const title = escapeHtml(data.title)
  const description = escapeHtml(data.description)
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${data.canonical}" />`,
    ...data.alternates.map(
      (a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`,
    ),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="YayPoker" />`,
    `<meta property="og:locale" content="${data.ogLocale}" />`,
    `<meta property="og:url" content="${data.canonical}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
  ].join('\n    ')
}

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

// data = headData(...) for SEO pages, or null for app pages (title only, no canonical).
export function applyHead(data, fallbackTitle) {
  document.head
    .querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]')
    .forEach((el) => el.remove())
  if (!data) {
    document.title = fallbackTitle || 'YayPoker'
    return
  }
  document.title = data.title
  setMeta('name', 'description', data.description)
  setMeta('property', 'og:url', data.canonical)
  setMeta('property', 'og:title', data.title)
  setMeta('property', 'og:description', data.description)
  setMeta('property', 'og:locale', data.ogLocale)
  setMeta('name', 'twitter:title', data.title)
  setMeta('name', 'twitter:description', data.description)
  const links = [
    { rel: 'canonical', href: data.canonical },
    ...data.alternates.map((a) => ({ rel: 'alternate', ...a })),
  ]
  for (const attrs of links) {
    const el = document.createElement('link')
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
    document.head.appendChild(el)
  }
}
