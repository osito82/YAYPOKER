---
trigger: always_on
description: "Secrets, environments and the manual production deploy"
---

# Secrets & Deploy Standard

1. **Secrets.** `.env`, `client/.env`, `webSocket/.env`, `bot/.env` and `DEPLOYMENT.md` are gitignored and hold credentials (LLM keys, SMTP, server access). Do not read, print or copy them; document new variables in the matching `.env.example`.
2. **Production** is one VPS running `docker-compose-prod.yml` behind Caddy (`Caddyfile`): client on 443, WebSocket + HTTP API on 8888, bot on the internal network. A test domain (`osongo.duckdns.org`) shares the same Caddyfile.
3. **Deploy is manual** and happens only after explicit human OK, from a clean, pushed `main` with `ship check` green. Follow the `yaypoker-deploy` skill (`.claude/skills/yaypoker-deploy/SKILL.md`): backup, `git archive` upload of tracked files only, `down` + `up --build -d` (never `--rmi all -v`), smoke checks, rollback. Agents never run it on their own.
4. **Smoke** after a deploy: `ship smoke` (`https://yaypoker.com:8888/health`, the home page, and `/Logs/certificates.json` must not be served as JSON).
5. **Cost.** No new paid service or API without OK; Gemini free tier and local Ollama are the default bot providers.
