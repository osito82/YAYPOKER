---
trigger: always_on
description: "Secrets, environments and the manual production deploy"
---

# Secrets & Deploy Standard

1. **Secrets.** `.env`, `client/.env`, `webSocket/.env`, `bot/.env` and `DEPLOYMENT.md` are gitignored and hold credentials (LLM keys, SMTP, server access). Do not read, print or copy them; document new variables in the matching `.env.example`.
2. **Production** is one VPS running `docker-compose-prod.yml` behind Caddy (`Caddyfile`): client on 443, WebSocket + HTTP API on 8888, bot on the internal network. A test domain (`osongo.duckdns.org`) shares the same Caddyfile.
3. **Deploy is manual** (tarball → scp → `docker compose -f docker-compose-prod.yml up --build -d`) and happens only after explicit human OK, from a clean `main` with `ship check` green. Agents never run it on their own.
4. **Smoke** after a deploy: `ship smoke` (`https://yaypoker.com:8888/health` and the home page).
5. **Cost.** No new paid service or API without OK; Gemini free tier and local Ollama are the default bot providers.
