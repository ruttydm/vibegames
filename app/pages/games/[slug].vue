<script setup lang="ts">
const route = useRoute()
const { getGameBySlug, getGamesByCategory } = useGames()
const { playerName, initPlayer } = usePlayer()

const slug = route.params.slug as string
const game = getGameBySlug(slug)

if (!game) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Game not found'
  })
}

// Get related games from same categories
const relatedGames = computed(() => {
  if (!game) return []
  const related = game.categories.flatMap(cat => getGamesByCategory(cat))
  return [...new Map(related.map(g => [g.slug, g])).values()]
    .filter(g => g.slug !== slug)
    .slice(0, 4)
})

// Game state
const gameMode = ref<'select' | 'singleplayer' | 'multiplayer'>('select')
const isFullscreen = ref(false)
const currentScore = ref(0)

// Multiplayer state
const multiplayer = useMultiplayer()
const showCreateLobby = ref(false)
const joinCode = ref('')
const joinError = ref('')

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// ESC key handler for fullscreen exit
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false
  }
}

// Initialize player and keyboard listeners
onMounted(() => {
  initPlayer()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Mode selection
const startSingleplayer = () => {
  gameMode.value = 'singleplayer'
}

const openMultiplayerOptions = () => {
  showCreateLobby.value = true
}

// Multiplayer actions
const createMultiplayerLobby = async () => {
  try {
    await multiplayer.createLobby(slug, game.title, game.maxPlayers || 4, playerName.value)
    gameMode.value = 'multiplayer'
    showCreateLobby.value = false
  } catch (e) {
    console.error('Failed to create lobby:', e)
  }
}

const joinLobby = async () => {
  if (!joinCode.value.trim()) {
    joinError.value = 'Please enter a room code'
    return
  }
  joinError.value = ''

  try {
    await multiplayer.joinLobby(joinCode.value.toUpperCase(), playerName.value)
    gameMode.value = 'multiplayer'
    showCreateLobby.value = false
  } catch (e) {
    joinError.value = 'Failed to join lobby'
  }
}

const leaveLobby = () => {
  multiplayer.leaveLobby()
  gameMode.value = 'select'
}

// Handle game events
const handleScore = (score: number) => {
  currentScore.value = score
  if (gameMode.value === 'multiplayer') {
    multiplayer.updateScore(score)
  }
}

const handleGameOver = (winner: string | null) => {
  if (gameMode.value === 'multiplayer' && multiplayer.isHost) {
    multiplayer.endGame(winner || undefined)
  }
}

const handleGameAction = (action: string, data: any) => {
  if (gameMode.value === 'multiplayer') {
    multiplayer.sendGameAction(action, data)
  }
}

// Watch for lobby errors
watch(() => multiplayer.lobby.error, (error) => {
  if (error) {
    joinError.value = error
  }
})

// Check if game component exists for this slug
const hasGameComponent = computed(() => {
  return ['snake'].includes(slug)
})

const multiplayerPlayers = computed(() => {
  return multiplayer.lobby.players.map(p => ({
    id: p.id,
    color: p.color,
    name: p.name
  }))
})

useSeoMeta({
  title: `${game.title} - VibeGames`,
  description: game.description
})
</script>

<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Back Button & Title -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/games"
            class="flex items-center gap-2 font-pixel text-xs text-text-secondary hover:text-neon-cyan transition-colors"
          >
            <Icon name="mdi:arrow-left" />
            Back
          </NuxtLink>
          <h1 class="font-pixel text-lg text-neon-cyan">{{ game.title }}</h1>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="gameMode !== 'select'" class="font-pixel text-xs text-neon-yellow">
            SCORE: {{ currentScore }}
          </span>
          <button
            v-if="gameMode !== 'select'"
            class="flex items-center gap-2 px-3 py-2 bg-arcade-surface border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-arcade-bg font-pixel text-[10px] transition-all duration-200 hover:shadow-[0_0_15px_rgba(57,255,20,0.5)]"
            @click="toggleFullscreen"
          >
            <Icon :name="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" class="text-lg" />
            {{ isFullscreen ? 'EXIT' : 'FULLSCREEN' }}
          </button>
        </div>
      </div>

      <!-- Mode Selection -->
      <div v-if="gameMode === 'select'" class="mb-8">
        <div class="bg-arcade-surface border-2 border-arcade-border p-8">
          <div class="text-center mb-8">
            <Icon name="mdi:gamepad-variant" class="text-6xl text-neon-cyan mb-4" />
            <h2 class="font-pixel text-sm text-text-primary mb-2">Choose Game Mode</h2>
            <p class="font-retro text-text-secondary">{{ game.description }}</p>
          </div>

          <div class="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" @click="startSingleplayer">
              <Icon name="mdi:account" class="mr-2" />
              Single Player
            </Button>

            <Button
              v-if="game.mode === 'both' || game.mode === 'multiplayer'"
              size="lg"
              variant="pink"
              @click="openMultiplayerOptions"
            >
              <Icon name="mdi:account-group" class="mr-2" />
              Multiplayer
            </Button>
          </div>
        </div>
      </div>

      <!-- Multiplayer Lobby -->
      <div v-else-if="gameMode === 'multiplayer' && multiplayer.lobby.status === 'waiting'" class="mb-8">
        <div class="bg-arcade-surface border-2 border-neon-pink p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="font-pixel text-sm text-neon-pink">Multiplayer Lobby</h2>
            <Button size="sm" variant="ghost" @click="leaveLobby">
              <Icon name="mdi:exit-to-app" class="mr-1" />
              Leave
            </Button>
          </div>

          <!-- Room Code -->
          <div class="text-center mb-6 p-4 bg-arcade-bg border-2 border-arcade-border">
            <p class="font-pixel text-[10px] text-text-muted mb-2">ROOM CODE</p>
            <p class="font-pixel text-xl text-neon-green">{{ multiplayer.lobby.id }}</p>
            <p class="font-retro text-sm text-text-muted mt-2">Share this code with friends!</p>
          </div>

          <!-- Players -->
          <div class="mb-6">
            <h3 class="font-pixel text-xs text-text-muted mb-3">
              PLAYERS ({{ multiplayer.playerCount }}/{{ multiplayer.lobby.maxPlayers }})
            </h3>
            <div class="space-y-2">
              <div
                v-for="player in multiplayer.lobby.players"
                :key="player.id"
                class="flex items-center justify-between p-3 bg-arcade-bg border border-arcade-border"
              >
                <div class="flex items-center gap-3">
                  <span class="w-4 h-4" :style="{ backgroundColor: player.color }" />
                  <span class="font-retro text-text-primary">
                    {{ player.name }}
                    <span v-if="player.isHost" class="text-neon-yellow ml-2">(Host)</span>
                    <span v-if="player.id === multiplayer.lobby.currentPlayer?.id" class="text-neon-cyan ml-2">(You)</span>
                  </span>
                </div>
                <Badge v-if="player.isReady" variant="green">Ready</Badge>
                <Badge v-else-if="!player.isHost" variant="default">Waiting</Badge>
              </div>
            </div>
          </div>

          <!-- Ready / Start Buttons -->
          <div class="flex gap-4">
            <Button
              v-if="!multiplayer.isHost"
              class="flex-1"
              :variant="multiplayer.lobby.currentPlayer?.isReady ? 'ghost' : 'green'"
              @click="multiplayer.setReady(!multiplayer.lobby.currentPlayer?.isReady)"
            >
              {{ multiplayer.lobby.currentPlayer?.isReady ? 'Not Ready' : 'Ready!' }}
            </Button>

            <Button
              v-if="multiplayer.isHost"
              class="flex-1"
              variant="pink"
              :disabled="!multiplayer.canStart"
              @click="multiplayer.startGame"
            >
              <Icon name="mdi:play" class="mr-2" />
              Start Game
            </Button>
          </div>
        </div>
      </div>

      <!-- Game Container -->
      <div
        v-if="gameMode !== 'select' && (gameMode === 'singleplayer' || multiplayer.lobby.status === 'playing')"
        :class="[
          'relative bg-arcade-bg border-4 border-arcade-border mb-8',
          isFullscreen && 'fixed inset-0 z-50 border-0 flex items-center justify-center'
        ]"
      >
        <!-- Snake Game -->
        <div v-if="slug === 'snake'" class="flex justify-center p-4">
          <SnakeGame
            :mode="gameMode"
            :player-id="multiplayer.lobby.currentPlayer?.id || 'player1'"
            :player-color="multiplayer.lobby.currentPlayer?.color || '#00fff5'"
            :players="gameMode === 'multiplayer' ? multiplayerPlayers : undefined"
            @score="handleScore"
            @game-over="handleGameOver"
            @action="handleGameAction"
          />
        </div>

        <!-- Placeholder for other games -->
        <div v-else class="aspect-video flex items-center justify-center">
          <div class="text-center">
            <Icon name="mdi:gamepad-variant" class="text-8xl text-arcade-border mb-4" />
            <p class="font-pixel text-sm text-text-muted mb-4">Coming Soon!</p>
            <Button @click="gameMode = 'select'">
              <Icon name="mdi:arrow-left" class="mr-2" />
              Back
            </Button>
          </div>
        </div>

        <!-- Fullscreen Controls -->
        <div
          v-if="isFullscreen"
          class="absolute top-4 right-4 z-10 flex items-center gap-3"
        >
          <div class="font-pixel text-[10px] text-text-muted bg-arcade-surface/80 px-3 py-2 border border-arcade-border">
            Press ESC to exit
          </div>
          <button
            class="flex items-center gap-2 px-3 py-2 bg-arcade-surface/90 border-2 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-arcade-bg font-pixel text-[10px] transition-all duration-200 hover:shadow-[0_0_15px_rgba(255,46,99,0.5)]"
            @click="toggleFullscreen"
          >
            <Icon name="mdi:fullscreen-exit" class="text-lg" />
            EXIT
          </button>
        </div>

        <!-- Floating Fullscreen Button (when not fullscreen) -->
        <button
          v-if="!isFullscreen"
          class="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-3 py-2 bg-arcade-surface/90 border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-arcade-bg font-pixel text-[10px] transition-all duration-200 hover:shadow-[0_0_15px_rgba(57,255,20,0.5)] opacity-60 hover:opacity-100"
          @click="toggleFullscreen"
        >
          <Icon name="mdi:fullscreen" class="text-lg" />
          FULLSCREEN
        </button>
      </div>

      <!-- Game Info (only show in select mode) -->
      <div v-if="gameMode === 'select'" class="grid md:grid-cols-2 gap-8 mb-12">
        <!-- Controls -->
        <div class="bg-arcade-surface border-2 border-arcade-border p-6">
          <h2 class="font-pixel text-xs text-neon-yellow mb-4 flex items-center gap-2">
            <Icon name="mdi:keyboard" />
            Controls
          </h2>
          <div class="space-y-2">
            <div
              v-for="control in game.controls"
              :key="control.key"
              class="flex items-center gap-4 font-retro text-lg"
            >
              <kbd class="px-3 py-1 bg-arcade-bg border border-arcade-border text-neon-cyan min-w-[100px] text-center text-sm">
                {{ control.key }}
              </kbd>
              <span class="text-text-secondary">{{ control.action }}</span>
            </div>
          </div>
        </div>

        <!-- Game Details -->
        <div class="bg-arcade-surface border-2 border-arcade-border p-6">
          <h2 class="font-pixel text-xs text-neon-cyan mb-4 flex items-center gap-2">
            <Icon name="mdi:information" />
            About
          </h2>
          <p class="font-retro text-lg text-text-secondary mb-4">
            {{ game.description }}
          </p>

          <div class="flex flex-wrap gap-2 mb-4">
            <Badge v-for="category in game.categories" :key="category" variant="default">
              {{ category }}
            </Badge>
          </div>

          <div class="flex items-center gap-2">
            <Badge :variant="game.mode === 'multiplayer' ? 'multiplayer' : game.mode === 'both' ? 'cyan' : 'singleplayer'">
              <template v-if="game.mode === 'singleplayer'">Solo</template>
              <template v-else-if="game.mode === 'multiplayer'">Multiplayer</template>
              <template v-else>Solo / Multi</template>
            </Badge>
            <span v-if="game.maxPlayers" class="font-retro text-sm text-text-muted">
              {{ game.minPlayers || 1 }}-{{ game.maxPlayers }} Players
            </span>
          </div>
        </div>
      </div>

      <!-- Related Games -->
      <section v-if="relatedGames.length && gameMode === 'select'">
        <h2 class="font-pixel text-sm text-neon-pink flex items-center gap-2 mb-6">
          <Icon name="mdi:gamepad-variant" />
          More Games Like This
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GameCard v-for="relatedGame in relatedGames" :key="relatedGame.slug" :game="relatedGame" />
        </div>
      </section>
    </div>

    <!-- Create/Join Lobby Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showCreateLobby"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-arcade-bg/90"
          @click.self="showCreateLobby = false"
        >
          <div class="w-full max-w-md bg-arcade-surface border-4 border-neon-pink p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="font-pixel text-sm text-neon-pink">Multiplayer</h3>
              <button
                class="text-text-secondary hover:text-neon-pink transition-colors"
                @click="showCreateLobby = false"
              >
                <Icon name="mdi:close" class="text-xl" />
              </button>
            </div>

            <div class="space-y-6">
              <!-- Create Room -->
              <div>
                <h4 class="font-pixel text-xs text-text-muted mb-3">CREATE NEW ROOM</h4>
                <Button class="w-full" variant="pink" @click="createMultiplayerLobby">
                  <Icon name="mdi:plus" class="mr-2" />
                  Create Room
                </Button>
              </div>

              <div class="flex items-center gap-4">
                <div class="flex-1 h-px bg-arcade-border" />
                <span class="font-pixel text-xs text-text-muted">OR</span>
                <div class="flex-1 h-px bg-arcade-border" />
              </div>

              <!-- Join Room -->
              <div>
                <h4 class="font-pixel text-xs text-text-muted mb-3">JOIN EXISTING ROOM</h4>
                <div class="space-y-3">
                  <input
                    v-model="joinCode"
                    type="text"
                    placeholder="Enter room code..."
                    class="w-full bg-arcade-bg border-2 border-arcade-border px-4 py-3 font-pixel text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-cyan uppercase"
                    @keyup.enter="joinLobby"
                  />
                  <p v-if="joinError" class="font-retro text-sm text-neon-pink">{{ joinError }}</p>
                  <Button class="w-full" @click="joinLobby">
                    <Icon name="mdi:login" class="mr-2" />
                    Join Room
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
