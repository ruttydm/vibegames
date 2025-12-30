# VibeGames

A retro-styled arcade games portal featuring singleplayer and multiplayer browser games with a classic pixel art aesthetic.

## Tech Stack

- **Framework:** Nuxt 4 (Vue 3)
- **Styling:** Tailwind CSS 4 with custom arcade theme
- **Components:** shadcn-vue (Radix Vue)
- **Icons:** Iconify (MDI)
- **Multiplayer:** WebSocket via Nitro + crossws
- **Runtime:** Bun

## Features

- Retro arcade visual design with neon glow effects and CRT styling
- Session-based player usernames
- Real-time multiplayer with lobby system
- Fullscreen game mode with ESC to exit
- SVG game thumbnails with arcade aesthetic
- Local high score tracking

## Project Structure

```
app/
├── components/
│   ├── ui/           # shadcn-vue components (Button, Badge, Card, etc.)
│   ├── layout/       # AppHeader, AppFooter
│   └── game/         # GameCard, SnakeGame, etc.
├── composables/
│   ├── useGames.ts       # Game data and queries
│   ├── useMultiplayer.ts # WebSocket multiplayer client
│   ├── usePlayer.ts      # Session-based player names
│   └── useLocalScores.ts # Local storage high scores
├── pages/
│   ├── index.vue         # Homepage
│   ├── games/
│   │   ├── index.vue     # All games browser
│   │   └── [slug].vue    # Individual game page
│   └── multiplayer.vue   # Multiplayer lobby browser
└── assets/css/
    └── main.css          # Tailwind theme + effects

server/
├── routes/
│   └── _ws.ts            # WebSocket handler
└── utils/
    └── lobbyManager.ts   # Multiplayer lobby management

public/
└── games/
    └── [slug]/
        └── thumbnail.svg # Game thumbnail
```

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build
```

## Adding a New Game

1. Add game metadata to `app/composables/useGames.ts`
2. Create game component in `app/components/game/`
3. Create SVG thumbnail at `public/games/[slug]/thumbnail.svg`
4. Add game slug to `hasGameComponent` check in `app/pages/games/[slug].vue`
5. Wire up the component in the game page template

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Background | `#0a0a0f` | Page background |
| Surface | `#1a1a2e` | Cards, modals |
| Neon Pink | `#ff2e63` | Multiplayer, accents |
| Neon Cyan | `#00fff5` | Primary actions |
| Neon Yellow | `#ffd700` | Scores, warnings |
| Neon Green | `#39ff14` | Success, fullscreen |
| Neon Purple | `#bf00ff` | Special effects |

## Multiplayer Protocol

WebSocket messages use JSON with `{ type, payload }` structure:

- `create_lobby` / `lobby_created`
- `join_lobby` / `lobby_joined`
- `player_ready` / `player_ready_changed`
- `start_game` / `game_started`
- `game_action` (broadcast to other players)
- `update_score` / `score_updated`
- `end_game` / `game_ended`
