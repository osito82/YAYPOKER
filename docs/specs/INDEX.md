# Specs index

Families: **GAM** = game engine and rules · **UXP** = client experience and layouts · **BOT** = AI bot service · **OPS** = deploy, infrastructure and observability.

| ID | Title | Status | Date | Notes |
|---|---|---|---|---|
| GAM-001 | Seat survives disconnects and mid-hand leaves | implemented | 2026-10-16 | TODO: disconnect ends tournament, table pause, leave loses pot chips |
| GAM-002 | Automatic blinds, one bet validator and action order | implemented | 2026-10-16 | Depends on GAM-001 |
| GAM-003 | Hand reveal and tournament certificates | implemented | 2026-10-16 | Fold-win reveal, bot certificates |
| OPS-001 | Server-issued session tokens | implemented | 2026-10-16 | Replaces PIN-as-session; depends on GAM-001 |
| OPS-002 | Drop prerender, remove the test domain, clean server backups | implemented | 2026-10-16 | Level S |
| OPS-003 | SEO: static HTML for public pages, Spanish URLs, rules and hand rankings | implemented | 2026-10-17 | Level M; build-time SSR, no Chromium |
