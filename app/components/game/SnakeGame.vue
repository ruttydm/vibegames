<script setup lang="ts">
import { SnakeGame, type Direction, type GameState } from '~/games/snake/engine'
import { SnakeRenderer } from '~/games/snake/renderer'

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
const game = ref<SnakeGame | null>(null)
const renderer = ref<SnakeRenderer | null>(null)
const gameState = ref<GameState | null>(null)
const isPaused = ref(false)
const isStarted = ref(false)
const countdown = ref(0)
const lastScore = ref(0)

const config = {
  gridWidth: 30,
  gridHeight: 20,
  cellSize: 20,
  initialSpeed: 150,
  speedIncrement: 2,
  maxSpeed: 60
}

const canvasSize = computed(() => ({
  width: config.gridWidth * config.cellSize,
  height: config.gridHeight * config.cellSize
}))

const currentSnake = computed(() => {
  if (!gameState.value) return null
  return gameState.value.snakes.get(props.playerId)
})

const score = computed(() => currentSnake.value?.score ?? 0)

// Initialize game
onMounted(() => {
  if (!canvasRef.value) return

  game.value = new SnakeGame(config)
  renderer.value = new SnakeRenderer(canvasRef.value, config)

  // Set up callbacks
  game.value.setOnUpdate((state) => {
    gameState.value = state

    // Check for score changes
    const snake = state.snakes.get(props.playerId)
    if (snake && snake.score !== lastScore.value) {
      lastScore.value = snake.score
      emit('score', snake.score)
    }

    // Render
    renderer.value?.render(state)
  })

  game.value.setOnGameOver((winner) => {
    emit('gameOver', winner)
    renderGameOver()
  })

  // Initial render
  initializeGame()
})

function initializeGame() {
  if (!game.value || !renderer.value) return

  game.value.reset()

  if (props.mode === 'singleplayer') {
    game.value.addSnake(props.playerId, props.playerColor)
  } else if (props.players) {
    // Multiplayer - add all players
    props.players.forEach(player => {
      game.value!.addSnake(player.id, player.color)
    })
  }

  game.value.spawnFood(3)
  gameState.value = game.value.getState()
  renderer.value.render(gameState.value)
  isStarted.value = false
}

async function startGame() {
  if (!game.value || isStarted.value) return

  // Countdown
  for (let i = 3; i >= 0; i--) {
    countdown.value = i
    renderer.value?.render(game.value.getState())
    renderer.value?.drawCountdown(i)
    await new Promise(resolve => setTimeout(resolve, 800))
  }

  countdown.value = -1
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

  // Handle direction keys
  const directionMap: Record<string, Direction> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    W: 'up',
    s: 'down',
    S: 'down',
    a: 'left',
    A: 'left',
    d: 'right',
    D: 'right'
  }

  const direction = directionMap[e.key]
  if (direction && isStarted.value && !isPaused.value && !gameState.value?.gameOver) {
    game.value.setDirection(props.playerId, direction)
    emit('action', 'direction', { direction })
    e.preventDefault()
  }

  // Handle other keys
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    if (gameState.value?.gameOver) {
      restartGame()
    } else if (!isStarted.value) {
      startGame()
    }
  }

  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    e.preventDefault()
    togglePause()
  }
}

function renderGameOver() {
  if (!renderer.value || !gameState.value) return

  const winner = gameState.value.winner
    ? gameState.value.snakes.get(gameState.value.winner)
    : currentSnake.value

  renderer.value.drawGameOver(
    winner || null,
    props.mode === 'multiplayer'
  )
}

// Keyboard event handling
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  game.value?.stop()
})

// Expose methods for multiplayer control
defineExpose({
  game,
  startGame,
  restartGame,
  setDirection: (playerId: string, direction: Direction) => {
    game.value?.setDirection(playerId, direction)
  },
  applyRemoteState: (state: any) => {
    if (game.value) {
      game.value.applyState(state)
      if (renderer.value) {
        renderer.value.render(game.value.getState())
      }
    }
  }
})
</script>

<template>
  <div class="snake-game relative">
    <!-- Game Canvas -->
    <div class="relative crt-screen">
      <canvas
        ref="canvasRef"
        :width="canvasSize.width"
        :height="canvasSize.height"
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
          <h3 class="font-pixel text-lg text-neon-cyan mb-4">SNAKE</h3>
          <p class="font-retro text-text-secondary mb-6">
            Use arrow keys or WASD to move
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
        <span class="text-neon-cyan ml-2">{{ score }}</span>
      </div>

      <div class="flex gap-2">
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

    <!-- Multiplayer Scores -->
    <div v-if="mode === 'multiplayer' && players && players.length > 1" class="mt-4">
      <div class="font-pixel text-xs text-text-muted mb-2">PLAYERS</div>
      <div class="space-y-2">
        <div
          v-for="player in players"
          :key="player.id"
          class="flex items-center justify-between p-2 bg-arcade-surface border border-arcade-border"
        >
          <div class="flex items-center gap-2">
            <span
              class="w-3 h-3"
              :style="{ backgroundColor: player.color }"
            />
            <span class="font-retro text-sm" :class="player.id === playerId ? 'text-neon-cyan' : 'text-text-secondary'">
              {{ player.name }}
              <span v-if="player.id === playerId" class="text-text-muted">(You)</span>
            </span>
          </div>
          <span class="font-pixel text-xs" :style="{ color: player.color }">
            {{ gameState?.snakes.get(player.id)?.score ?? 0 }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
canvas:focus {
  outline: 2px solid var(--color-neon-cyan);
  outline-offset: 2px;
}
</style>
