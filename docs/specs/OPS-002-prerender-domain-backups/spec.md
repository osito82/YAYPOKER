# OPS-002 · Drop prerender, remove the test domain, clean server backups

- **Level:** S · **Status:** implemented (R-04 at the next deploy) · **Owner:** Guillermo · **Created:** 2026-10-16
- **Repos:** client, root (Caddyfile, compose), webSocket (CORS) · **Flags:** —

## Audit

- `client/vite.config.js` uses `vite-plugin-prerender` (Puppeteer + Chromium in `client/Dockerfile`).
  On the VPS (864 MB, no swap) it logs "Unable to prerender all routes!" on every deploy and makes the
  client build need the old containers stopped.
- Caddy cannot get a certificate for `osongo.duckdns.org` (test domain) and retries forever.
- Two backups on the server: `/root/YAYPOKER-backup-20261016` (first release) and
  `…-20261016-2351` (rollback point for `830d2ee`).
- **Decision (human, 2026-10-16):** drop prerender (SEO trade-off accepted).

## Requirements

- R-01 The client build SHALL NOT use prerender, Puppeteer or Chromium.
- R-02 `/`, `/privacy`, `/terms` SHALL keep their titles/meta through the existing SPA head handling.
- R-03 The production Caddyfile SHALL NOT serve `osongo.duckdns.org` (the Vite dev-server config and
  CORS keep it: it is the developer's tunnel to a local machine, not the VPS).
- R-04 After the next deploy is confirmed, older server backups SHALL be removed, keeping only the
  newest rollback point (server action, only with explicit OK).
- R-05 The deploy skill SHALL drop the prerender notes and the "stop containers before build" reason
  that only applied to Chromium (keep `down` before `up --build` for memory).

## Acceptance criteria

| ID | Criterion | Evidence |
|---|---|---|
| AC-01 | `npx vite build` passes without prerender; no `puppeteer`/`chromium` in client deps or Dockerfile | build output |
| AC-02 | `grep osongo Caddyfile` finds nothing | grep output |
| AC-03 | Deploy log has no "prerender" line; site 200 | deploy smoke |
| AC-04 | Only one backup left on the server | `ls -d /root/YAYPOKER-backup-*` |
