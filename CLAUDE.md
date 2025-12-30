# VibeGames - Project Instructions

Retro-styled arcade games portal built with Nuxt 4, Tailwind CSS 4, and shadcn-vue.

## Tech Stack

- **Runtime:** Bun (not npm/yarn/pnpm)
- **Framework:** Nuxt 4 with Vue 3 Composition API (`<script setup lang="ts">`)
- **Styling:** Tailwind CSS 4 with custom arcade theme
- **Components:** shadcn-vue (Radix Vue based)
- **Icons:** Iconify with MDI icon set (`@iconify-json/mdi`)
- **Multiplayer:** WebSocket via Nitro server + crossws package

## Project Structure

- `app/components/ui/` - shadcn-vue components (Button, Badge, Card, Input, etc.)
- `app/components/layout/` - AppHeader, AppFooter
- `app/components/game/` - Game components (SnakeGame, etc.)
- `app/composables/` - Shared composables (useGames, useMultiplayer, usePlayer, useLocalScores)
- `app/pages/games/[slug].vue` - Individual game page with mode selection and multiplayer
- `server/routes/_ws.ts` - WebSocket handler for multiplayer
- `server/utils/lobbyManager.ts` - Multiplayer lobby management
- `public/games/[slug]/thumbnail.svg` - Game thumbnails

## Code Style

- Use TypeScript for all Vue components and composables
- Components use `<script setup lang="ts">` syntax
- Use existing UI components from `app/components/ui/` - do not create new base components
- Prefer `ref()` and `computed()` over Options API
- Use `defineProps` and `defineEmits` for component interfaces

## Styling Rules

- Use theme color variables, not raw hex values:
  - `neon-pink` (#ff2e63) - Multiplayer, accents
  - `neon-cyan` (#00fff5) - Primary actions, headings
  - `neon-yellow` (#ffd700) - Scores, warnings
  - `neon-green` (#39ff14) - Success, fullscreen
  - `neon-purple` (#bf00ff) - Special effects
  - `arcade-bg` (#0a0a0f) - Page background
  - `arcade-surface` (#1a1a2e) - Cards, modals
  - `arcade-border` (#2a2a4e) - Borders
- Use font classes: `font-pixel` for headings, `font-retro` for body text
- Buttons use pixel font with size `text-[10px]` or `text-xs`
- Add neon glow on hover: `hover:shadow-[0_0_15px_rgba(R,G,B,0.5)]`

## Game Components

Game components in `app/components/game/` must:

- Accept props: `mode`, `playerId`, `playerColor`, `players` (for multiplayer)
- Emit events: `@score`, `@game-over`, `@action` (for multiplayer sync)
- Handle keyboard input with proper cleanup on unmount
- Support pause with P or Escape keys
- Use `requestAnimationFrame` for game loops with proper cleanup

## Multiplayer

- WebSocket messages use `{ type, payload }` JSON structure
- Player names come from `usePlayer()` composable (session-based)
- Lobby management via `useMultiplayer()` composable
- Game actions broadcast via `sendGameAction(action, data)`

## Assets

- Game thumbnails are SVGs at `public/games/[slug]/thumbnail.svg`
- SVG thumbnails: 320x180 viewBox, neon glow filters, arcade aesthetic
- No external image URLs - all assets must be local
- Use Iconify icons with `mdi:` prefix

## Adding New Games

See skill: `create-game` for complete instructions on adding a new game.
