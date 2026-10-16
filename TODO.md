# TODO

Pending work agreed with the product owner and known gaps, in one place. Specs hold the detail;
this list is the index. When something here is done, remove it (and record it in `progress.md`);
when a new gap is found, add it with where it comes from.

Last reviewed: 2026-10-15.

## Next

- [ ] **Rotate the VPS root password and switch to SSH keys** — `DEPLOYMENT.md` (gitignored, never
      committed) stores it in plain text. Disable root password login afterwards.
- [ ] **Node ≥ 22 locally** — the harness CLI (`ship check`) refuses Node 20.19; Dockerfiles also use
      `node:20-alpine`.

## Gaps

- [ ] `bot/` has no ESLint config (only Prettier); add one so `ship check` can lint it.
- [ ] Raw `console.log` in `webSocket/dealer.js` (`talkToSocketById`, `talkToAllSockets`) → `logger`.
- [ ] Lint warning: unused `err` in `client/src/pages/Contact.vue:206`.
- [ ] `npm test` runs Vitest in watch mode in all packages; consider `"test": "vitest run"`.
- [ ] Most client text is hardcoded; vue-i18n (`en`/`es`) is used in only a few components.
- [ ] `webSocket/utils.js` requires `uuid`, but `package.json` declares `uuidv4`; it works only because
      `uuid` is a transitive dependency. Declare `uuid` (or use `crypto.randomUUID`) — needs OK.
- [ ] Unused `webSocket` devDeps/deps: `mocha`, `chai` (no tests use them) and the `http` placeholder package.
- [ ] `README.md` links `DEPLOYMENT.md` with an absolute `file:///home/...` path.
