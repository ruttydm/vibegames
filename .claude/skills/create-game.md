# Create Game Skill

Complete guide for adding a new game to VibeGames.

## Overview

Adding a new game involves:
1. Game metadata in `useGames.ts`
2. Game engine in `app/games/[slug]/`
3. Vue component in `app/components/game/`
4. SVG thumbnail in `public/games/[slug]/`
5. Wiring in the game page

---

## Step 1: Add Game Metadata

Edit `app/composables/useGames.ts` and add to the `games` array:

```typescript
{
  slug: 'your-game',           // URL-safe identifier
  title: 'Your Game',          // Display name
  description: 'Short description of the game.',
  thumbnail: '/games/your-game/thumbnail.svg',
  categories: ['arcade', 'puzzle'],  // See categories array for options
  mode: 'both',                // 'singleplayer' | 'multiplayer' | 'both'
  controls: [
    { key: 'Arrow Keys', action: 'Move' },
    { key: 'Space', action: 'Action' }
  ],
  minPlayers: 1,               // Optional, for multiplayer
  maxPlayers: 4,               // Optional, for multiplayer
  featured: true               // Optional, shows on homepage
}
```

**Available categories:** arcade, puzzle, racing, shooter, classic, sports, card, strategy, party

---

## Step 2: Create Game Engine

Create `app/games/[slug]/engine.ts`:

```typescript
export interface GameConfig {
  width: number
  height: number
  // Game-specific config
}

export interface GameState {
  score: number
  gameOver: boolean
  winner: string | null
  // Game-specific state
}

export class YourGame {
  private config: GameConfig
  private state: GameState
  private animationId: number | null = null
  private onUpdate: ((state: GameState) => void) | null = null
  private onGameOver: ((winner: string | null) => void) | null = null

  constructor(config: GameConfig) {
    this.config = config
    this.state = this.createInitialState()
  }

  private createInitialState(): GameState {
    return {
      score: 0,
      gameOver: false,
      winner: null
    }
  }

  setOnUpdate(callback: (state: GameState) => void) {
    this.onUpdate = callback
  }

  setOnGameOver(callback: (winner: string | null) => void) {
    this.onGameOver = callback
  }

  reset() {
    this.state = this.createInitialState()
  }

  start() {
    const loop = () => {
      this.update()
      this.onUpdate?.(this.state)

      if (!this.state.gameOver) {
        this.animationId = requestAnimationFrame(loop)
      }
    }
    loop()
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private update() {
    // Game logic here
    // Call this.endGame(winner) when game ends
  }

  private endGame(winner: string | null) {
    this.state.gameOver = true
    this.state.winner = winner
    this.stop()
    this.onGameOver?.(winner)
  }

  getState(): GameState {
    return { ...this.state }
  }

  // For multiplayer sync
  applyState(state: Partial<GameState>) {
    Object.assign(this.state, state)
  }
}
```

---

## Step 3: Create Renderer (if using canvas)

Create `app/games/[slug]/renderer.ts`:

```typescript
import type { GameState, GameConfig } from './engine'

export class YourRenderer {
  private ctx: CanvasRenderingContext2D
  private config: GameConfig

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    this.ctx = canvas.getContext('2d')!
    this.config = config
  }

  render(state: GameState) {
    this.clear()
    this.drawGame(state)
  }

  private clear() {
    this.ctx.fillStyle = '#0a0a0f'
    this.ctx.fillRect(0, 0, this.config.width, this.config.height)
  }

  private drawGame(state: GameState) {
    // Render game elements
  }

  drawCountdown(count: number) {
    // Draw countdown overlay
    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.8)'
    this.ctx.fillRect(0, 0, this.config.width, this.config.height)

    this.ctx.font = 'bold 48px monospace'
    this.ctx.fillStyle = '#00fff5'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(
      count > 0 ? String(count) : 'GO!',
      this.config.width / 2,
      this.config.height / 2
    )
  }

  drawPaused() {
    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.8)'
    this.ctx.fillRect(0, 0, this.config.width, this.config.height)

    this.ctx.font = 'bold 24px monospace'
    this.ctx.fillStyle = '#ffd700'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('PAUSED', this.config.width / 2, this.config.height / 2)
  }

  drawGameOver(winner: { name: string; score: number } | null, isMultiplayer: boolean) {
    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.9)'
    this.ctx.fillRect(0, 0, this.config.width, this.config.height)

    this.ctx.font = 'bold 32px monospace'
    this.ctx.fillStyle = '#ff2e63'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('GAME OVER', this.config.width / 2, this.config.height / 2 - 30)

    this.ctx.font = '16px monospace'
    this.ctx.fillStyle = '#a0a0b0'
    this.ctx.fillText('Press SPACE to restart', this.config.width / 2, this.config.height / 2 + 40)
  }
}
```

---

## Step 4: Create Vue Component

Create `app/components/game/YourGame.vue`:

```vue
<script setup lang="ts">
import { YourGame, type GameState } from '~/games/your-game/engine'
import { YourRenderer } from '~/games/your-game/renderer'

interface Props {
  mode: 'singleplayer' | 'multiplayer'
  playerId?: string
  playerColor?: string
  players?: Array<{ id: string; color: string; name: string }>
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'singleplayer',
  playerId: 'player1',
  playerColor: '#00fff5'
})

const emit = defineEmits<{
  (e: 'score', score: number): void
  (e: 'gameOver', winner: string | null): void
  (e: 'action', action: string, data: any): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const game = ref<YourGame | null>(null)
const renderer = ref<YourRenderer | null>(null)
const gameState = ref<GameState | null>(null)
const isPaused = ref(false)
const isStarted = ref(false)
const lastScore = ref(0)

const config = {
  width: 600,
  height: 400
}

// Initialize game
onMounted(() => {
  if (!canvasRef.value) return

  game.value = new YourGame(config)
  renderer.value = new YourRenderer(canvasRef.value, config)

  game.value.setOnUpdate((state) => {
    gameState.value = state

    // Emit score changes
    if (state.score !== lastScore.value) {
      lastScore.value = state.score
      emit('score', state.score)
    }

    renderer.value?.render(state)
  })

  game.value.setOnGameOver((winner) => {
    emit('gameOver', winner)
  })

  initializeGame()
})

function initializeGame() {
  game.value?.reset()
  gameState.value = game.value?.getState() ?? null
  renderer.value?.render(gameState.value!)
  isStarted.value = false
}

async function startGame() {
  if (!game.value || isStarted.value) return
  isStarted.value = true
  game.value.start()
}

function restartGame() {
  initializeGame()
  startGame()
}

function togglePause() {
  if (!game.value || !isStarted.value || gameState.value?.gameOver) return

  isPaused.value = !isPaused.value

  if (isPaused.value) {
    game.value.stop()
    renderer.value?.drawPaused()
  } else {
    game.value.start()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (!game.value) return

  // Game-specific controls
  if (isStarted.value && !isPaused.value && !gameState.value?.gameOver) {
    // Handle game input
    // emit('action', 'actionName', { data }) for multiplayer
    e.preventDefault()
  }

  // Start/Restart
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    if (gameState.value?.gameOver) {
      restartGame()
    } else if (!isStarted.value) {
      startGame()
    }
  }

  // Pause
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    e.preventDefault()
    togglePause()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  game.value?.stop()
})

// Expose for multiplayer control
defineExpose({
  game,
  startGame,
  restartGame
})
</script>

<template>
  <div class="your-game relative">
    <div class="relative crt-screen">
      <canvas
        ref="canvasRef"
        :width="config.width"
        :height="config.height"
        class="block border-4 border-arcade-border"
        tabindex="0"
        @click="canvasRef?.focus()"
      />

      <!-- Start Overlay -->
      <div
        v-if="!isStarted && !gameState?.gameOver"
        class="absolute inset-0 flex items-center justify-center bg-arcade-bg/80"
      >
        <div class="text-center">
          <h3 class="font-pixel text-lg text-neon-cyan mb-4">YOUR GAME</h3>
          <p class="font-retro text-text-secondary mb-6">
            Controls description
          </p>
          <Button @click="startGame">
            <Icon name="mdi:play" class="mr-2" />
            Start Game
          </Button>
        </div>
      </div>
    </div>

    <!-- Score Display -->
    <div class="flex items-center justify-between mt-4 px-2">
      <div class="font-pixel text-xs text-text-secondary">
        SCORE
        <span class="text-neon-cyan ml-2">{{ gameState?.score ?? 0 }}</span>
      </div>

      <Button
        v-if="isStarted && !gameState?.gameOver"
        size="sm"
        variant="ghost"
        @click="togglePause"
      >
        <Icon :name="isPaused ? 'mdi:play' : 'mdi:pause'" />
      </Button>
    </div>
  </div>
</template>

<style scoped>
canvas:focus {
  outline: 2px solid var(--color-neon-cyan);
  outline-offset: 2px;
}
</style>
```

---

## Step 5: Create SVG Thumbnail

Create `public/games/[slug]/thumbnail.svg` (320x180):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="320" height="180">
  <defs>
    <!-- Grid pattern (arcade background) -->
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill="#0a0a0f"/>
      <rect width="19" height="19" fill="#12121a"/>
    </pattern>

    <!-- Neon glow filters -->
    <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="glow-pink" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background with grid -->
  <rect width="320" height="180" fill="url(#grid)"/>

  <!-- Border glow -->
  <rect x="10" y="10" width="300" height="160" fill="none"
        stroke="#00fff5" stroke-width="2" opacity="0.3"/>

  <!-- Game-specific artwork here -->
  <!-- Use neon colors: #00fff5 (cyan), #ff2e63 (pink), #39ff14 (green), #ffd700 (yellow) -->
  <!-- Apply glow filters: filter="url(#glow-cyan)" -->

  <!-- Score display -->
  <g filter="url(#glow-cyan)">
    <text x="20" y="30" font-family="monospace" font-size="12"
          fill="#00fff5" font-weight="bold">SCORE: 000</text>
  </g>

  <!-- Scanlines overlay (creates CRT effect) -->
  <defs>
    <pattern id="scanlines" width="1" height="4" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="320" y2="0" stroke="#fff" stroke-width="1" opacity="0.1"/>
    </pattern>
  </defs>
  <rect width="320" height="180" fill="url(#scanlines)"/>
</svg>
```

**SVG Guidelines:**
- ViewBox: `0 0 320 180` (16:9 aspect ratio)
- Use grid pattern for background
- Apply neon glow filters to key elements
- Include score display in top-left
- Add scanlines for CRT effect
- Use theme colors only

---

## Step 6: Wire Up in Game Page

Edit `app/pages/games/[slug].vue`:

### 6a. Add slug to hasGameComponent check:

```typescript
const hasGameComponent = computed(() => {
  return ['snake', 'your-game'].includes(slug)  // Add your slug
})
```

### 6b. Add component in template (inside Game Container):

```vue
<!-- Your Game -->
<div v-if="slug === 'your-game'" class="flex justify-center p-4">
  <YourGame
    :mode="gameMode"
    :player-id="multiplayer.lobby.currentPlayer?.id || 'player1'"
    :player-color="multiplayer.lobby.currentPlayer?.color || '#00fff5'"
    :players="gameMode === 'multiplayer' ? multiplayerPlayers : undefined"
    @score="handleScore"
    @game-over="handleGameOver"
    @action="handleGameAction"
  />
</div>
```

---

## Checklist

- [ ] Game metadata added to `useGames.ts`
- [ ] Game engine created at `app/games/[slug]/engine.ts`
- [ ] Renderer created at `app/games/[slug]/renderer.ts` (if canvas-based)
- [ ] Vue component created at `app/components/game/[Name]Game.vue`
- [ ] SVG thumbnail created at `public/games/[slug]/thumbnail.svg`
- [ ] Slug added to `hasGameComponent` in game page
- [ ] Component wired in game page template
- [ ] Keyboard controls work (arrows, WASD, Space, P/Escape)
- [ ] Score emits correctly
- [ ] Game over emits correctly
- [ ] Pause/resume works
- [ ] Restart works
- [ ] Multiplayer props passed (if mode is 'both' or 'multiplayer')
- [ ] Audio: useAudio composable integrated
- [ ] Audio: Countdown sounds play (countdown.beep, countdown.go)
- [ ] Audio: Theme song starts after countdown, stops on pause/game over
- [ ] Audio: SFX play on game events (eat, die, score, etc.)
- [ ] Audio: stopSong() called in onUnmounted

---

## Multiplayer Considerations

If your game supports multiplayer:

1. **Emit actions** for player input:
   ```typescript
   emit('action', 'move', { direction: 'left' })
   ```

2. **Handle remote actions** via exposed method:
   ```typescript
   defineExpose({
     applyRemoteAction: (playerId: string, action: string, data: any) => {
       // Apply action from other player
     }
   })
   ```

3. **Sync game state** (host only):
   ```typescript
   // Host broadcasts state periodically
   multiplayer.updateGameState(game.value.getState())
   ```

4. **Add players array** to engine for multiplayer state tracking

---

## Audio Integration

### Step 1: Add useAudio composable

```typescript
const { playSfx, startSong, stopSong } = useAudio()
```

### Step 2: Add countdown sounds

```typescript
async function startGame() {
  for (let i = 3; i >= 0; i--) {
    if (i > 0) {
      playSfx('countdown.beep')
    } else {
      playSfx('countdown.go')
    }
    await new Promise(resolve => setTimeout(resolve, 800))
  }

  // Start theme song after countdown
  startSong('your-game')
  game.value.start()
}
```

### Step 3: Handle pause/game over

```typescript
function togglePause() {
  isPaused.value = !isPaused.value

  if (isPaused.value) {
    game.value.stop()
    stopSong()
  } else {
    game.value.start()
    startSong('your-game')
  }
}

game.value.setOnGameOver((winner) => {
  stopSong()
  playSfx('game.over')  // or custom SFX
  emit('gameOver', winner)
})
```

### Step 4: Add game event SFX

```typescript
// Play SFX on score changes
if (score > lastScore) {
  playSfx('your-game.score')  // Define in app/audio/sfx.ts
}
```

### Step 5: Stop song on unmount

```typescript
onUnmounted(() => {
  game.value?.stop()
  stopSong()
})
```

### Step 6: Create game-specific audio file

Create `app/games/your-game/audio.ts` with both SFX and theme song:

```typescript
import { Tone, getAudioEngine } from '~/audio/engine'

// =============================================================================
// Your Game Sound Effects
// =============================================================================

export function playYourGameScore(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  // Define your SFX using Tone.js synths
  const synth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }
  }).connect(output)

  synth.triggerAttackRelease('C5', '16n')
  setTimeout(() => synth.dispose(), 200)
}

// =============================================================================
// Your Game Theme Song
// =============================================================================

export function createYourGameSong() {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()

  if (!output) {
    return { start: () => {}, stop: () => {}, dispose: () => {} }
  }

  // Create synths and sequences
  // See app/games/snake/audio.ts for full example

  return {
    start: () => { /* start sequences */ },
    stop: () => { /* stop sequences */ },
    dispose: () => { /* clean up synths */ }
  }
}
```

Register song in `app/audio/songs/index.ts`:

```typescript
import { createYourGameSong } from '~/games/your-game/audio'

const songs = {
  snake: createSnakeSong,
  'your-game': createYourGameSong  // Add your song
}
```

Register SFX in `app/audio/sfx.ts`:

```typescript
import { playYourGameScore } from '~/games/your-game/audio'

// In sfxRegistry:
'your-game.score': playYourGameScore
```

### Available SFX

| Name | Usage |
|------|-------|
| `countdown.beep` | Countdown 3, 2, 1 |
| `countdown.go` | "GO!" moment |
| `ui.click` | Button press |
| `game.over` | Generic game over |
| `score.up` | Score increase |
| `powerup` | Power-up collected |
| `victory` | Win state |

Add game-specific SFX in `app/audio/sfx.ts` following the existing patterns
