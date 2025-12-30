<script setup lang="ts">
import { AsteroidsEngine, type GameState } from '~/games/asteroids/engine'
import { AsteroidsRenderer } from '~/games/asteroids/renderer'

const { playSfx, startSong, stopSong } = useAudio()

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
const containerRef = ref<HTMLDivElement | null>(null)
const game = ref<AsteroidsEngine | null>(null)
const renderer = ref<AsteroidsRenderer | null>(null)
const gameState = ref<GameState | null>(null)
const isPaused = ref(false)
const isStarted = ref(false)
const countdown = ref(0)
const lastScore = ref(0)
const animationId = ref<number | null>(null)

const config = {
  width: 800,
  height: 600
}

const canvasSize = computed(() => ({
  width: config.width,
  height: config.height
}))

const score = computed(() => gameState.value?.score ?? 0)
const lives = computed(() => gameState.value?.lives ?? 3)
const level = computed(() => gameState.value?.level ?? 1)

// Input state
const keys = reactive({
  left: false,
  right: false,
  up: false,
  space: false
})

// Initialize game
onMounted(() => {
  if (!canvasRef.value) return

  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  game.value = new AsteroidsEngine(config)
  renderer.value = new AsteroidsRenderer(ctx, {
    shipColor: props.playerColor
  })

  // Set up callbacks
  game.value.setOnUpdate((state) => {
    gameState.value = state

    // Check for score changes
    if (state.score !== lastScore.value) {
      lastScore.value = state.score
      emit('score', state.score)
    }

    // Render
    renderer.value?.render(state)
  })

  game.value.setOnGameOver((finalScore) => {
    stopSong()
    playSfx('asteroids.gameover')
    emit('gameOver', null)
  })

  game.value.setOnSound((sound) => {
    playSfx(sound)
  })

  // Initial render
  initializeGame()
})

function initializeGame() {
  if (!game.value || !renderer.value) return

  gameState.value = game.value.getState()
  renderer.value.render(gameState.value)
  isStarted.value = false
  isPaused.value = false
  lastScore.value = 0
}

async function startGame() {
  if (!game.value || !renderer.value || isStarted.value) return

  // Countdown
  for (let i = 3; i >= 0; i--) {
    countdown.value = i
    renderer.value.render(game.value.getState())
    renderer.value.drawCountdown(canvasSize.value.width, canvasSize.value.height, i)

    if (i > 0) {
      playSfx('countdown.beep')
    } else {
      playSfx('countdown.go')
    }

    await new Promise(resolve => setTimeout(resolve, 800))
  }

  countdown.value = -1
  isStarted.value = true
  game.value.start()

  // Start game loop for input handling
  startInputLoop()

  // Start theme song
  startSong('asteroids')
}

function startInputLoop() {
  const handleInput = () => {
    if (!game.value || isPaused.value || gameState.value?.isGameOver) {
      animationId.value = requestAnimationFrame(handleInput)
      return
    }

    // Handle rotation
    if (keys.left && !keys.right) {
      game.value.setRotation(-1)
    } else if (keys.right && !keys.left) {
      game.value.setRotation(1)
    } else {
      game.value.setRotation(0)
    }

    // Handle thrust
    game.value.setThrust(keys.up)

    // Handle firing
    if (keys.space) {
      game.value.fire()
    }

    animationId.value = requestAnimationFrame(handleInput)
  }

  animationId.value = requestAnimationFrame(handleInput)
}

function restartGame() {
  if (!game.value) return
  game.value.stop()
  initializeGame()
  startGame()
}

function togglePause() {
  if (!game.value || !isStarted.value || gameState.value?.isGameOver) return

  isPaused.value = !isPaused.value

  if (isPaused.value) {
    game.value.pause()
    stopSong()
    if (renderer.value && gameState.value) {
      renderer.value.render(gameState.value)
    }
  } else {
    game.value.resume()
    startSong('asteroids')
  }
}

function handleKeydown(e: KeyboardEvent) {
  // Prevent default for game keys
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
    e.preventDefault()
  }

  // Update key state
  switch (e.key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
      keys.left = true
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      keys.right = true
      break
    case 'ArrowUp':
    case 'w':
    case 'W':
      keys.up = true
      break
    case ' ':
      keys.space = true
      break
  }

  // Handle other keys
  if (e.key === ' ' || e.key === 'Enter') {
    if (gameState.value?.isGameOver) {
      restartGame()
    } else if (!isStarted.value) {
      startGame()
    }
  }

  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    togglePause()
  }
}

function handleKeyup(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
      keys.left = false
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      keys.right = false
      break
    case 'ArrowUp':
    case 'w':
    case 'W':
      keys.up = false
      break
    case ' ':
      keys.space = false
      break
  }
}

// Keyboard event handling
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keyup', handleKeyup)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keyup', handleKeyup)
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
  game.value?.stop()
  stopSong()
})

// Expose methods for external control
defineExpose({
  game,
  startGame,
  restartGame
})
</script>

<template>
  <div ref="containerRef" class="asteroids-game relative">
    <!-- Game Canvas -->
    <div class="relative crt-screen">
      <canvas
        ref="canvasRef"
        :width="canvasSize.width"
        :height="canvasSize.height"
        class="block border-4 border-arcade-border bg-black"
        tabindex="0"
        @click="canvasRef?.focus()"
      />

      <!-- Start Overlay -->
      <div
        v-if="!isStarted && !gameState?.isGameOver"
        class="absolute inset-0 flex items-center justify-center bg-black/80"
      >
        <div class="text-center">
          <h3 class="font-pixel text-2xl text-neon-cyan mb-4">ASTEROIDS</h3>
          <div class="font-retro text-text-secondary mb-6 space-y-1">
            <p>Arrow Keys / WASD - Rotate & Thrust</p>
            <p>SPACE - Fire</p>
            <p>ESC - Pause</p>
          </div>
          <Button @click="startGame">
            <Icon name="mdi:play" class="mr-2" />
            Start Game
          </Button>
        </div>
      </div>
    </div>

    <!-- Score Display -->
    <div class="flex items-center justify-between mt-4 px-2">
      <div class="flex items-center gap-6">
        <div class="font-pixel text-xs text-text-secondary">
          SCORE
          <span class="text-neon-cyan ml-2">{{ score.toString().padStart(6, '0') }}</span>
        </div>
        <div class="font-pixel text-xs text-text-secondary">
          LEVEL
          <span class="text-neon-pink ml-2">{{ level }}</span>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- Lives -->
        <div class="flex items-center gap-1">
          <span class="font-pixel text-xs text-text-secondary mr-2">LIVES</span>
          <template v-for="i in lives" :key="i">
            <Icon name="mdi:triangle" class="text-neon-cyan text-sm -rotate-90" />
          </template>
        </div>

        <Button
          v-if="isStarted && !gameState?.isGameOver"
          size="sm"
          variant="ghost"
          @click="togglePause"
        >
          <Icon :name="isPaused ? 'mdi:play' : 'mdi:pause'" />
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
canvas:focus {
  outline: 2px solid var(--color-neon-cyan);
  outline-offset: 2px;
}

.asteroids-game {
  font-family: 'Press Start 2P', monospace;
}
</style>
