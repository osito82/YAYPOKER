---
trigger: always_on
description: "Language, testing, logging and git standards for YAYPOKER"
---

# Code & Language Standards

1. **English only.** New code, comments, identifiers, docs (`.md`) and commit messages are written in English. Legacy Spanish comments may stay until the code around them is touched.
   - **On-screen text** goes through vue-i18n (`client/src/locales/en.json` and `es.json`); add every new key to both files. Most components still hardcode English text (legacy); new or touched user-facing text should move to i18n keys.

2. **Testing.**
   - Framework: Vitest in all three packages. Server tests in `webSocket/tests/*.test.js` (Node env, `NODE_ENV=test` shortens `TIMEOUTS`); client tests in `client/src/tests/**` (jsdom, `@vue/test-utils`, `@pinia/testing`); bot tests in `bot/tests/`.
   - Run once with `npx vitest run` inside the package — `npm test` starts watch mode.
   - Every change to game rules (betting, blinds, all-in, side pots, showdown, sit-out, reconnect, autofold) ships with a test in `webSocket/tests/`; reuse `tests/fixtures.js`.
   - No Jest APIs (`jest.fn`, `@jest/globals`); use `vi`. Mocha/chai are legacy devDependencies — do not write new tests with them.

3. **Logging.**
   - Server: `webSocket/logger.js`; bot: `bot/logger.js` (winston + `osolog`, daily rotated files under `/Logs`). No new raw `console.*` in `webSocket/` or `bot/` (legacy calls remain in `dealer.js`; replace them when touched). Tests may print.
   - Never log secrets, emails from `/api/contact`, secret room codes, certificate codes or other players' pocket cards.

4. **Lint & format.** `npx eslint .` to check (`npm run lint` auto-fixes, use it only on purpose); Prettier via `npm run format`. The `bot/` package has no ESLint config yet.

5. **Git.**
   - Conventional Commits (`feat:`, `fix:`, `chore:` …).
   - Commit only when the user explicitly asks; push (`origin` = `github.com/osito82/YAYPOKER`) only with explicit OK.
   - Merges into `main` use `git merge --no-ff <branch> -m "Merge branch '<branch>'"`; no fast-forward or squash merges into `main`. Feature branches are not deleted unless the user asks.
