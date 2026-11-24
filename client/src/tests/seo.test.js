// OPS-003: prerendered public pages, Spanish URLs and the R-15 build checks
import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createMemoryHistory } from 'vue-router'
import { render } from '../entry-server'
import { createAppRouter } from '../router'
import { fillTemplate, sitemapXml, validatePages } from '../seo/build'
import { seoUrls, localizedPath, basePath, SHARE_SHELLS } from '../seo/pages'
import { shareHeadTags } from '../seo/head'

const template = readFileSync(resolve(__dirname, '../../index.html'), 'utf8')

const renderPage = async (path) => {
  const rendered = await render(path)
  return { path, rendered, html: fillTemplate(template, rendered, { jsonLd: path === '/' }) }
}

describe('seo/pages', () => {
  it('maps paths between languages', () => {
    expect(localizedPath('/', 'es')).toBe('/es')
    expect(localizedPath('/rules', 'es')).toBe('/es/rules')
    expect(localizedPath('/rules', 'en')).toBe('/rules')
    expect(basePath('/es')).toBe('/')
    expect(basePath('/es/hand-rankings')).toBe('/hand-rankings')
    expect(basePath('/about')).toBe('/about')
    expect(seoUrls()).toHaveLength(14)
  })
})

describe('prerendered pages', () => {
  beforeEach(() => localStorage.clear())

  // AC-01, AC-02
  it('renders every SEO URL with content and passes the build checks', async () => {
    const pages = []
    for (const { path } of seoUrls()) pages.push(await renderPage(path))
    expect(validatePages(pages)).toEqual([])
    for (const { path, html } of pages) {
      const lang = path === '/es' || path.startsWith('/es/') ? 'es' : 'en'
      expect(html).toContain(`<html lang="${lang}"`)
      expect(html).not.toContain('<div id="app"></div>')
    }
    expect(pages.filter((p) => p.html.includes('application/ld+json'))).toHaveLength(1)
  }, 30000)

  // AC-03
  it('renders Spanish pages in Spanish with Spanish links', async () => {
    const { html } = await renderPage('/es/rules')
    expect(html).toContain('Reglas del Texas Hold&#39;em')
    expect(html).toContain('href="/es/hand-rankings"')
    expect(html).toContain('href="/es/privacy"')
    expect(html).not.toContain('href="/privacy"')
  })

  it('draws an example for each of the 10 hands', async () => {
    const { html } = await renderPage('/hand-rankings')
    expect(html.match(/id="rankings-item-\d-HandRankings"/g)).toHaveLength(10)
    expect(html).toContain('A♠ K♠ Q♠ J♠ 10♠')
  })

  // R-15
  it('reports a missing h1, a duplicate title and a wrong canonical', async () => {
    const good = await renderPage('/about')
    const problems = validatePages([
      good,
      { path: '/terms', html: good.html },
      { path: '/rules', html: good.html.replace(/<h1[\s\S]*?<\/h1>/, '') },
    ])
    expect(problems.join('\n')).toMatch(/\/terms: canonical/)
    expect(problems.join('\n')).toMatch(/\/terms: same title as \/about/)
    expect(problems.join('\n')).toMatch(/\/rules: no <h1>/)
  })

  // AC-09
  it('builds a sitemap with 14 URLs and hreflang alternates', () => {
    const xml = sitemapXml(seoUrls(), '2026-10-17')
    const doc = new DOMParser().parseFromString(xml, 'application/xml')
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0)
    expect(doc.getElementsByTagName('loc')).toHaveLength(14)
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="es" href="https://yaypoker.com/es/rules" />',
    )
  })

  it('marks the app shell noindex without a canonical', () => {
    const shell = fillTemplate(
      template,
      { html: '', locale: 'en', head: null, title: 'YayPoker' },
      { noindex: true },
    )
    expect(shell).toContain('<meta name="robots" content="noindex" />')
    expect(shell).not.toContain('rel="canonical"')
  })

  // Shared /join and /watch links: a chat preview with title, text and image, still noindex
  it('gives shared app links a link preview without making them indexable', () => {
    expect(SHARE_SHELLS.map((s) => s.file)).toEqual(['invite.html', 'watch.html'])
    for (const share of SHARE_SHELLS) {
      const html = fillTemplate(
        template,
        { html: '', locale: 'en', headHtml: shareHeadTags(share) },
        { noindex: true },
      )
      const titles = html.match(/<title>[^<]*<\/title>/g)
      expect(titles).toHaveLength(1)
      expect(html).toContain('<meta name="robots" content="noindex" />')
      expect(html).not.toContain('rel="canonical"')
      expect(html).not.toContain('hreflang=')
      expect(html).toContain('<meta property="og:image" content="https://yaypoker.com/og-image.jpg" />')
      expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />')
      expect(html).toMatch(/<meta property="og:title" content="[^"]+" \/>/)
      expect(html).toMatch(/<meta property="og:description" content="[^"]+" \/>/)
      expect(html).toContain('<div id="app"></div>')
    }
    // Quotes in the text are escaped, so the attribute is not cut short
    expect(shareHeadTags({ title: 'A "b"', description: "it's" })).toContain(
      'content="A &quot;b&quot;"',
    )
  })
})

describe('nginx.conf', () => {
  const conf = readFileSync(resolve(__dirname, '../../nginx.conf'), 'utf8')

  it('serves the share shells on /join and /watch, noindex', () => {
    const block = (route) =>
      conf.match(new RegExp(`location ~ \\^/${route}\\(/\\|\\$\\) \\{[^}]*\\}`))?.[0]
    expect(block('join')).toContain('try_files /invite.html =404')
    expect(block('watch')).toContain('try_files /watch.html =404')
    for (const route of ['join', 'watch']) expect(block(route)).toContain('X-Robots-Tag "noindex"')
    // The generic app shell must no longer catch them first
    const generic = conf.match(/location ~ \^\/\(([^)]*)\)\(\/\|\$\)/)[1].split('|')
    expect(generic).not.toContain('join')
    expect(generic).not.toContain('watch')
    expect(generic).toEqual(expect.arrayContaining(['lobby', 'public', 'new', 'play', 'verify']))
  })

  it('compresses JS and CSS', () => {
    expect(conf).toMatch(/^\s*gzip on;/m)
    expect(conf).toMatch(/gzip_types[^;]*application\/javascript/)
    expect(conf).toMatch(/gzip_types[^;]*text\/css/)
  })
})

// AC-04 (R-04): Spanish visitors are moved to the Spanish URL on first load, crawlers are not
describe('first-load language redirect', () => {
  beforeEach(() => localStorage.clear())

  const firstLoad = async (path, options) => {
    const router = createAppRouter(createMemoryHistory(), options)
    await router.push(path)
    return router.currentRoute.value.path
  }

  it('redirects an English page when the saved locale is Spanish', async () => {
    localStorage.setItem('user-locale', 'es')
    expect(await firstLoad('/rules', { client: true })).toBe('/es/rules')
    expect(await firstLoad('/', { client: true })).toBe('/es')
  })

  it('keeps the English page for an English visitor and for the prerender', async () => {
    localStorage.setItem('user-locale', 'en')
    expect(await firstLoad('/rules', { client: true })).toBe('/rules')
    localStorage.setItem('user-locale', 'es')
    expect(await firstLoad('/rules')).toBe('/rules')
  })

  it('does not redirect app routes or later navigations', async () => {
    localStorage.setItem('user-locale', 'es')
    expect(await firstLoad('/lobby', { client: true })).toBe('/lobby')
    const router = createAppRouter(createMemoryHistory(), { client: true })
    await router.push('/es/about')
    await router.push('/about')
    expect(router.currentRoute.value.path).toBe('/about')
  })
})
