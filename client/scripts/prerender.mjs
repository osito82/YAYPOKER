// Build-time prerender of the public pages (spec OPS-003). Runs after `vite build` (client, into
// dist/) and `vite build --ssr` (into dist-ssr/). No browser: Vue renders to a string in Node.
//
// Writes dist/<path>/index.html for every SEO URL, dist/app.html (shell for the app routes),
// dist/404.html and dist/sitemap.xml, then fails the build if a page breaks the R-15 checks.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssrDir = join(root, 'dist-ssr')

// Stores and i18n read window/localStorage/navigator at setup; give them a clean browser-like
// global with no saved preferences, so every page renders in its URL's language and dark theme.
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: 'https://yaypoker.com/',
})
for (const key of ['window', 'document', 'localStorage', 'navigator', 'location', 'history']) {
  Object.defineProperty(globalThis, key, {
    value: dom.window[key],
    configurable: true,
    writable: true,
  })
}
Object.defineProperty(dom.window.navigator, 'language', { value: 'en-US' })

const ssr = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href)
const template = await readFile(join(dist, 'index.html'), 'utf8')

const outFile = (path) =>
  path === '/' ? join(dist, 'index.html') : join(dist, path.slice(1), 'index.html')

const pages = []
for (const { path } of ssr.seoUrls()) {
  const rendered = await ssr.render(path)
  const html = ssr.fillTemplate(template, rendered, { jsonLd: path === '/' })
  pages.push({ path, html })
}

const problems = ssr.validatePages(pages)
if (problems.length) {
  console.error('[prerender] SEO checks failed:\n  ' + problems.join('\n  '))
  process.exit(1)
}

for (const { path, html } of pages) {
  const file = outFile(path)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, html)
}

// App routes (lobby, game, verify…): empty shell, not indexed
const shell = ssr.fillTemplate(
  template,
  { html: '', locale: 'en', head: null, title: 'YayPoker' },
  { noindex: true },
)
await writeFile(join(dist, 'app.html'), shell)

// Unknown paths: NotFound page, served by nginx with status 404
const notFound = await ssr.render('/404-page-not-found')
await writeFile(join(dist, '404.html'), ssr.fillTemplate(template, notFound, { noindex: true }))

const today = new Date().toISOString().slice(0, 10)
await writeFile(join(dist, 'sitemap.xml'), ssr.sitemapXml(ssr.seoUrls(), today))

await rm(ssrDir, { recursive: true, force: true })
console.log(`[prerender] ${pages.length} pages, app.html, 404.html and sitemap.xml written`)
