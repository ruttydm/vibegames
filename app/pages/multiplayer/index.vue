<script setup lang="ts">
const { getMultiplayerGames, getGameBySlug } = useGames()
const { lobbies, fetchLobbies, subscribeToLobbies } = useLobbies()
const multiplayer = useMultiplayer()

const multiplayerGames = getMultiplayerGames()

const showCreateModal = ref(false)
const selectedGame = ref('')
const joinCode = ref('')
const error = ref('')

// Fetch and subscribe to lobbies
onMounted(() => {
  fetchLobbies()
  subscribeToLobbies()
})

const createRoom = async () => {
  if (!selectedGame.value) return
  error.value = ''

  const game = getGameBySlug(selectedGame.value)
  if (!game) return

  try {
    await multiplayer.createLobby(selectedGame.value, game.title, game.maxPlayers || 4)
    showCreateModal.value = false
    // Navigate to the game page
    navigateTo(`/games/${selectedGame.value}`)
  } catch (e) {
    error.value = 'Failed to create room'
  }
}

const joinRoom = async (lobbyId: string, gameSlug: string) => {
  error.value = ''
  try {
    await multiplayer.joinLobby(lobbyId)
    navigateTo(`/games/${gameSlug}`)
  } catch (e) {
    error.value = 'Failed to join room'
  }
}

const joinByCode = async () => {
  if (!joinCode.value.trim()) {
    error.value = 'Please enter a room code'
    return
  }
  error.value = ''

  // Find the lobby to get the game slug
  const lobby = lobbies.value.find(l => l.id === joinCode.value.toUpperCase())
  if (!lobby) {
    // Try to join anyway - the server will tell us if it doesn't exist
    try {
      await multiplayer.joinLobby(joinCode.value.toUpperCase())
      // We need to get the game slug from the lobby state after joining
      if (multiplayer.lobby.gameSlug) {
        navigateTo(`/games/${multiplayer.lobby.gameSlug}`)
      }
    } catch (e) {
      error.value = 'Room not found'
    }
    return
  }

  await joinRoom(lobby.id, lobby.gameSlug)
}

// Watch for multiplayer errors
watch(() => multiplayer.lobby.error, (err) => {
  if (err) {
    error.value = err
  }
})

useSeoMeta({
  title: 'Multiplayer Games - Play With Friends | VibeGames',
  description: 'Join or create multiplayer game rooms. Play free arcade games with friends in real-time. No download required.',
  ogTitle: 'Multiplayer Games | VibeGames',
  ogDescription: 'Play arcade games with friends in real-time. Create or join game lobbies.',
  ogImage: '/og-image.svg',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="font-pixel text-xl text-neon-pink mb-2">Multiplayer</h1>
          <p class="font-retro text-lg text-text-secondary">
            Join a game or create your own room
          </p>
        </div>
        <Button variant="pink" @click="showCreateModal = true">
          <Icon name="mdi:plus" class="mr-2" />
          Create Room
        </Button>
      </div>

      <!-- Quick Join -->
      <div class="mb-8 p-4 bg-arcade-surface border-2 border-arcade-border">
        <h3 class="font-pixel text-xs text-text-muted mb-3">QUICK JOIN</h3>
        <div class="flex gap-3">
          <input
            v-model="joinCode"
            type="text"
            placeholder="Enter room code..."
            class="flex-1 bg-arcade-bg border-2 border-arcade-border px-4 py-2 font-pixel text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-cyan uppercase"
            @keyup.enter="joinByCode"
          />
          <Button @click="joinByCode">
            <Icon name="mdi:login" class="mr-2" />
            Join
          </Button>
        </div>
        <p v-if="error" class="font-retro text-sm text-neon-pink mt-2">{{ error }}</p>
      </div>

      <!-- Active Lobbies -->
      <section class="mb-12">
        <h2 class="font-pixel text-sm text-neon-green flex items-center gap-2 mb-6">
          <Icon name="mdi:access-point" class="animate-pulse" />
          Active Lobbies
          <span v-if="lobbies.length > 0" class="text-neon-green">({{ lobbies.length }})</span>
        </h2>

        <div v-if="lobbies.length" class="space-y-3">
          <div
            v-for="lobby in lobbies"
            :key="lobby.id"
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-arcade-surface border-2 border-arcade-border hover:border-neon-green transition-colors"
          >
            <div class="flex items-center gap-4">
              <span class="w-3 h-3 rounded-full bg-neon-green animate-pulse" />
              <div>
                <span class="font-pixel text-xs text-text-primary">{{ lobby.gameName }}</span>
                <span class="font-retro text-sm text-text-muted ml-3">{{ lobby.id }}</span>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <span class="font-retro text-sm text-text-secondary">
                <Icon name="mdi:account-group" class="inline mr-1" />
                {{ lobby.players }}/{{ lobby.maxPlayers }}
              </span>

              <Button
                size="sm"
                variant="green"
                :disabled="lobby.players >= lobby.maxPlayers"
                @click="joinRoom(lobby.id, lobby.gameSlug)"
              >
                {{ lobby.players >= lobby.maxPlayers ? 'Full' : 'Join' }}
              </Button>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 bg-arcade-surface border-2 border-arcade-border border-dashed">
          <Icon name="mdi:account-group-outline" class="text-6xl text-text-muted mb-4" />
          <p class="font-pixel text-sm text-text-muted mb-2">No active lobbies</p>
          <p class="font-retro text-text-muted mb-4">Be the first to create a room!</p>
          <Button variant="pink" @click="showCreateModal = true">
            <Icon name="mdi:plus" class="mr-2" />
            Create Room
          </Button>
        </div>
      </section>

      <!-- Multiplayer Games -->
      <section>
        <h2 class="font-pixel text-sm text-neon-cyan flex items-center gap-2 mb-6">
          <Icon name="mdi:gamepad-variant" />
          Multiplayer Games
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <GameCard v-for="game in multiplayerGames" :key="game.slug" :game="game" />
        </div>
      </section>
    </div>

    <!-- Create Room Modal -->
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
          v-if="showCreateModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-arcade-bg/90"
          @click.self="showCreateModal = false"
        >
          <div class="w-full max-w-md bg-arcade-surface border-4 border-neon-pink p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="font-pixel text-sm text-neon-pink">Create Room</h3>
              <button
                class="text-text-secondary hover:text-neon-pink transition-colors"
                @click="showCreateModal = false"
              >
                <Icon name="mdi:close" class="text-xl" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block font-pixel text-[10px] text-text-secondary mb-2">
                  Select Game
                </label>
                <select
                  v-model="selectedGame"
                  class="w-full bg-arcade-bg border-2 border-arcade-border px-4 py-3 font-retro text-lg text-text-primary focus:outline-none focus:border-neon-pink transition-colors"
                >
                  <option value="" disabled>Choose a game...</option>
                  <option v-for="game in multiplayerGames" :key="game.slug" :value="game.slug">
                    {{ game.title }} ({{ game.minPlayers || 1 }}-{{ game.maxPlayers }} players)
                  </option>
                </select>
              </div>

              <p v-if="error" class="font-retro text-sm text-neon-pink">{{ error }}</p>

              <Button
                variant="pink"
                class="w-full"
                :disabled="!selectedGame"
                @click="createRoom"
              >
                <Icon name="mdi:plus" class="mr-2" />
                Create & Join Room
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
