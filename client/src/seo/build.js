// Pure helpers for the build-time prerender (spec OPS-003): fill the HTML template, build the
// sitemap and check the generated pages (R-15). Kept free of Node APIs so Vitest can cover them.
import { headTags } from './head'
import { LOCALES, DEFAULT_LOCALE, absoluteUrl, localizedPath } from './pages'

const SEO_BLOCK = /<!--seo-->[\s\S]*?<!--\/seo-->/
const JSONLD_BLOCK = /\s*<!--jsonld-->[\s\S]*?<!--\/jsonld-->/
const APP_DIV = '<div id="app"></div>'

// rendered = { html, locale, head } from entry-server render(); options.noindex for app shell/404
export function fillTemplate(template, rendered, { noindex = false, jsonLd = false } = {}) {
  if (!SEO_BLOCK.test(template) || !template.includes(APP_DIV)) {
    throw new Error('index.html is missing the <!--seo--> block or the empty #app div')
  }
  const head = rendered.head
    ? headTags(rendered.head)
    : `<title>${rendered.title || 'YayPoker'}</title>`
  const robots = noindex ? '\n    <meta name="robots" content="noindex" />' : ''
  let out = template
    .replace(SEO_BLOCK, () => head + robots)
    .replace(/<html lang="[^"]*"/, `<html lang="${rendered.locale}"`)
    .replace(APP_DIV, () => `<div id="app">${rendered.html}</div>`)
  out = jsonLd
    ? out.replace('<!--jsonld-->', '').replace('<!--/jsonld-->', '')
    : out.replace(JSONLD_BLOCK, '')
  return out
}

// urls = seoUrls() → [{ page, locale, path }]
export function sitemapXml(urls, lastmod) {
  const entries = urls.map(({ page, path }) => {
    const alternates = [
      ...LOCALES.map((l) => [l, localizedPath(page.path, l)]),
      ['x-default', localizedPath(page.path, DEFAULT_LOCALE)],
    ]
      .map(
        ([hreflang, p]) =>
          `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${absoluteUrl(p)}" />`,
      )
      .join('\n')
    return `  <url>\n    <loc>${absoluteUrl(path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alternates}\n  </url>`
  })
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries.join('\n') +
    '\n</urlset>\n'
  )
}

// pages = [{ path, html }] (full documents). Returns a list of problems; empty means OK.
export function validatePages(pages) {
  const problems = []
  const seen = { title: new Map(), description: new Map() }
  for (const { path, html } of pages) {
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1]
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1]
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1]
    const body = html.slice(html.indexOf('<div id="app">'))
    if (!/<h1[\s>]/.test(body)) problems.push(`${path}: no <h1> in the rendered body`)
    if (!title) problems.push(`${path}: no <title>`)
    if (!description) problems.push(`${path}: no meta description`)
    if (canonical !== absoluteUrl(path)) {
      problems.push(`${path}: canonical is ${canonical}, expected ${absoluteUrl(path)}`)
    }
    const hreflangs = (html.match(/<link rel="alternate" hreflang=/g) || []).length
    if (hreflangs !== LOCALES.length + 1) problems.push(`${path}: ${hreflangs} hreflang links`)
    for (const [key, value] of [
      ['title', title],
      ['description', description],
    ]) {
      if (!value) continue
      if (seen[key].has(value)) {
        problems.push(`${path}: same ${key} as ${seen[key].get(value)}`)
      } else seen[key].set(value, path)
    }
  }
  return problems
}
