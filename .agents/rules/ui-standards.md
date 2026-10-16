---
trigger: always_on
description: "Element IDs, responsive templates and UI behaviour for the Vue client"
---

# UI Standards (`client/`)

1. **Element IDs.** Every interactive or test-relevant element has a unique, descriptive `id`: `[descriptive-name]-[TemplateSuffix]`.
   - Layout suffixes: `-TemplateLarge`, `-TemplateMedium`, `-TemplateSmall`, `-TemplateXSmall`; page suffixes: `-Home`, `-About`, …; dynamic components bind the computed `templateSuffix`.
   - Examples: `game-container-TemplateSmall`, `poker-table-viewport-TemplateLarge`, `player-item-display-name-{{ player.id }}-{{ templateSuffix }}`. (Also in `client/GEMINI.md`.)
2. **Responsive templates.** Layout is chosen by `store/responsiveStore.js` (`xsmall`, `small`, `medium`, `large`). A change to the table or action bar is checked in every template; `TemplateXSmall` must work at 360 px.
3. **Display only.** Components show what the server sends (stacks, pots, odds, winners); they never compute chip amounts or hand results. Client-side checks are only UX hints.
4. **Modals and overlays** (winner overlays, info dialogs) close with ✕, Esc and backdrop; the leave-game confirmation (`LeaveGameModal`) is exempt and closes only through its buttons.
5. **Text** comes from vue-i18n (`code-standards.md` §1); styling with Tailwind 4 utilities.
6. **Secure context.** Voice chat (`use/useVoice.js`) needs HTTPS or localhost; connection URLs are derived at runtime (`vutils.js`), never hardcoded.
