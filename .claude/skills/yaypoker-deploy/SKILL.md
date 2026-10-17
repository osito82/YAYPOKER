---
name: yaypoker-deploy
description: Deploy YAYPOKER to the production VPS (Docker Compose + Caddy) safely — preflight, backup, upload only tracked files with git archive, rebuild without destroying the running images, smoke checks and rollback. Use when the user asks to deploy, release, ship or update production, or to check/roll back a deploy.
---

# YAYPOKER production deploy

Proven on 2026-10-16. Production is one small VPS (864 MB RAM, no swap, 1 CPU, ~10 GB disk) running
`docker-compose-prod.yml`: `caddy` (TLS, ports 80/443/8888), `client` (nginx + built SPA),
`websocket` (game server, state in memory), `bot`. The code lives in `/root/YAYPOKER` on the server,
which is **not** a git clone.

## Hard rules

- **Human OK first.** Deploying is a production mutation: get an explicit "yes" for the plan before
  step 2, and again before anything destructive. Auto-mode may block remote commands until the user
  authorizes them in chat; never work around a block.
- **Never read `DEPLOYMENT.md`** (gitignored; holds the root password) and never type passwords. Use
  key auth only. If key auth fails, ask the user to run `! ssh-copy-id -i ~/.ssh/id_rsa.pub <host>`
  themselves.
- **Never use `docker compose down --rmi all -v`** (the old documented step). `--rmi all` deletes the
  working images, so a failed build leaves the site down with nothing to roll back to; `-v` deletes
  Caddy's TLS certificates (`caddy_data`) and forces Let's Encrypt re-issuance (rate limited).
- **Never upload the working tree with `tar`.** It ships the local `.env`, `DEPLOYMENT.md` and
  `Logs/`, overwriting production's `Logs/certificates.json` (needed by `/verify`). Upload only
  tracked files with `git archive`.
- Server-only files that must survive every deploy: `.env`, `Logs/` (incl. `certificates.json`),
  `DEPLOYMENT.md`.

## Target host

Use the SSH alias `yaypoker-prod` (a `Host` entry in `~/.ssh/config`: the VPS address, `User root`,
key auth). If the alias is missing, ask the user for the host — do not look it up in
`DEPLOYMENT.md`. Every command below uses `ssh -o BatchMode=yes yaypoker-prod` so a missing key fails
fast instead of prompting for a password.

## 0. Preflight (local, read-only)

```bash
git status --short                      # must be empty
git fetch origin && git rev-list --left-right --count origin/main...main   # must be "0 0" (pushed)
node ../harnes/scripts/harness.mjs ship check   # or lint + `npx vitest run` per package
curl -s https://yaypoker.com:8888/status        # "tournaments" > 0 means live games will be lost
```

A restart ends every running match (state is in memory). `connections.active` can be inflated on old
builds (socket registry leak fixed 2026-10-16); trust `tournaments`.

## 1. Inspect the server (read-only)

```bash
ssh -o BatchMode=yes yaypoker-prod 'cd /root/YAYPOKER && ls -A; docker ps --format "{{.Names}} {{.Status}}"; free -m; df -h /; docker system df'
```

## 2. Backup

```bash
ssh -o BatchMode=yes yaypoker-prod 'B=/root/YAYPOKER-backup-$(date +%Y%m%d-%H%M); test -e $B && { echo "EXISTS $B"; exit 1; }; cp -a /root/YAYPOKER $B && du -sh $B'
```

Include the time in the name: if the target folder already exists, `cp -a` silently nests the copy
inside it (`…-backup-20261016/YAYPOKER`) instead of creating a new backup.

## 3. Upload tracked files from `main`

```bash
git archive --format=tar main | ssh -o BatchMode=yes yaypoker-prod 'tar -x -C /root/YAYPOKER && echo EXTRACT_OK'
```

Must print `EXTRACT_OK`. Verify a marker from the new code landed (e.g. `grep -c <new symbol>` in a
changed file). Files deleted from the repo are not removed on the server; delete them explicitly if
they matter.

## 4. Rebuild and restart

Plain `down` frees memory for the build on this 864 MB box while keeping images and volumes:

```bash
ssh -o BatchMode=yes yaypoker-prod 'cd /root/YAYPOKER && docker compose -f docker-compose-prod.yml down && docker compose -f docker-compose-prod.yml up --build -d > /tmp/yay-deploy.log 2>&1; echo "UP_EXIT=$?"; docker ps --format "{{.Names}} {{.Status}}"'
```

Downtime ≈ build time (~2–3 min). Do **not** build with the old containers running (not enough
memory). If `UP_EXIT` ≠ 0, go to Rollback immediately.

## 5. Smoke checks

```bash
ssh -o BatchMode=yes yaypoker-prod 'docker logs --tail 15 yaypoker-websocket-1; tail -5 /tmp/yay-deploy.log'
curl -s https://yaypoker.com:8888/health                         # {"status":"healthy"}
curl -s -o /dev/null -w "%{http_code}\n" https://yaypoker.com/   # 200
curl -sI https://yaypoker.com/Logs/certificates.json | grep -i content-type   # text/html (SPA), never JSON
curl -s https://yaypoker.com:8888/status                         # fresh startTime
```

Confirm the served bundle is the new one: take `assets/index-*.js` from the home HTML and grep it for
an id added in this release.

Bots: after the first bot turn, the day's `Logs/bot/bot-<date>.log` must show `AI:GEMINI_REQUEST`
without an `ERROR:AI` right after it (mask any `key=` when printing). A 404 means the model in
`DEFAULT_AI_MODEL` was retired — check https://ai.google.dev/gemini-api/docs/models.

## Rollback

- Build failed after `down`: the previous images still exist →
  `docker compose -f docker-compose-prod.yml up -d --no-build`.
- New version misbehaves: restore the backup
  (`rm -rf /root/YAYPOKER && cp -a /root/YAYPOKER-backup-<date> /root/YAYPOKER`), then
  `down` + `up --build -d` as in step 4.

## Known issues and history (as of 2026-10-16)

- **Prerender was removed** on 2026-10-16 (OPS-002): the client build no longer needs Chromium.
- **Caddy** no longer serves the test domain `osongo.duckdns.org` (OPS-002).
- **Local dev**: the root `.env` has `NODE_ENV=production`; the bot service URL defaults to
  `http://localhost:8886` and compose sets `BOT_SERVICE_URL=http://bot:8886`.
- **`!` commands**: when the user runs commands with the `!` prefix, one command per input. A pasted
  multi-line block turns the leading `!` of later lines into bash negation (`! cd x && …` skips the
  rest silently).

## After the deploy

- Report the checks above with their actual output.
- Remind the user to delete old `/root/YAYPOKER-backup-*` folders once the release is confirmed.
- Record the deploy (date, commit, issues) in `progress.md`.
