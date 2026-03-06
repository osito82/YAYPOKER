# Engineering Standards & Conventions

## UI ID Naming Convention

All UI elements must have descriptive and unique IDs that follow this pattern:
`[descriptive-name]-[TemplateSuffix]`

### Rules:
1. **Descriptive Names**: IDs should clearly describe the element's purpose (e.g., `player-item-chip-stack-count` instead of `chips`).
2. **Template Suffix**: Every ID must end with a suffix identifying its context or template.
   - For static templates: `-TemplateLarge`, `-TemplateMedium`, `-TemplateSmall`, `-TemplateXSmall`.
   - For specific pages: `-Home`, `-About`.
   - For dynamic components: Use a computed `templateSuffix` based on the active layout.

### Examples:
- `game-container-TemplateSmall`
- `lobby-main-card-Home`
- `poker-table-viewport-TemplateLarge`
- `player-item-display-name-{{ player.id }}-{{ templateSuffix }}`
