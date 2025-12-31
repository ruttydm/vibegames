<script setup lang="ts">
import { usePartyGame } from '~/composables/usePartyGame'
import { usePlayer } from '~/composables/usePlayer'
import ControllerWaiting from '~/components/party/controller/ControllerWaiting.vue'
import ControllerButtons from '~/components/party/controller/ControllerButtons.vue'
import ControllerVoting from '~/components/party/controller/ControllerVoting.vue'
import ControllerDrawCanvas from '~/components/party/controller/ControllerDrawCanvas.vue'
import ControllerTextInput from '~/components/party/controller/ControllerTextInput.vue'
import ControllerBuzzer from '~/components/party/controller/ControllerBuzzer.vue'

const route = useRoute()
const router = useRouter()
const roomCode = route.params.room as string

const { playerName, initPlayer } = usePlayer()
const party = usePartyGame()
const { playSfx } = useAudio()

// UI State
const isLoading = ref(true)
const error = ref('')
const feedback = ref<'correct' | 'wrong' | 'waiting' | null>(null)

// Initialize
onMounted(async () => {
  initPlayer()

  try {
    await party.joinParty(roomCode, playerName.value)
    // Wait for room to be set before hiding loading
    // The joinParty sends a message but response comes async
  } catch (e) {
    error.value = 'Failed to join party'
    isLoading.value = false
  }
})

// Watch for successful join (when room is populated)
watch(() => party.state.room, (room) => {
  if (room && isLoading.value) {
    isLoading.value = false
    playSfx('party.join')
  }
}, { immediate: true })

// Handle errors
watch(() => party.state.error, (newError) => {
  if (newError) {
    error.value = newError
    isLoading.value = false
  }
})

// Watch for being kicked
watch(() => party.state.status, (status) => {
  if (status === 'disconnected' && !isLoading.value) {
    router.push('/party')
  }
})

// Prevent mobile zoom and bounce
onMounted(() => {
  document.body.style.touchAction = 'none'
  document.body.style.overscrollBehavior = 'none'

  // Prevent double-tap zoom
  let lastTap = 0
  const preventZoom = (e: TouchEvent) => {
    const now = Date.now()
    if (now - lastTap < 300) {
      e.preventDefault()
    }
    lastTap = now
  }
  document.addEventListener('touchend', preventZoom, { passive: false })

  // Keep screen awake if possible
  if ('wakeLock' in navigator) {
    (navigator as any).wakeLock.request('screen').catch(() => {})
  }

  onUnmounted(() => {
    document.body.style.touchAction = ''
    document.body.style.overscrollBehavior = ''
    document.removeEventListener('touchend', preventZoom)
  })
})

// ============================================
// Player Actions
// ============================================

function setReady(ready: boolean) {
  party.setReady(ready)
  playSfx('party.ready')
  vibrate()
}

function submitAnswer(answer: number) {
  party.submitAnswer(answer)
  playSfx('ui.select')
  vibrate()
}

function castVote(playerId: string) {
  party.castVote(playerId)
  playSfx('ui.select')
  vibrate()
}

function handleBuzz() {
  party.buzzIn()
  playSfx('party.buzz')
  vibrate()
}

function handleTapCount(count: number) {
  // For mash mode, continuously update
  party.submitAnswer(count)
  // Don't play SFX on every tap to avoid audio spam
}

function handleHoldDuration(duration: number) {
  party.submitAnswer(duration)
  playSfx('ui.select')
  vibrate()
}

function handleDrawStroke(strokeData: string) {
  party.sendDrawStroke(strokeData)
}

function handleDrawingSubmit(imageData: string) {
  party.submitDrawing(imageData)
  playSfx('ui.select')
  vibrate()
}

function handleGuessSubmit(guess: string) {
  party.submitGuess(guess)
  playSfx('ui.select')
  vibrate()
}

function vibrate(duration: number = 50) {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration)
  }
}

// Get current prompt
const currentPrompt = computed(() => {
  return party.state.room?.miniGame?.prompt
})

// Timer display
const timerDisplay = computed(() => {
  if (!party.state.room?.timerEndTime) return 0
  const remaining = Math.max(0, party.state.room.timerEndTime - Date.now())
  return Math.ceil(remaining / 1000)
})

// Refresh timer every second
const displayTimer = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

watch(() => party.state.room?.timerEndTime, (endTime) => {
  if (timerInterval) clearInterval(timerInterval)

  if (endTime) {
    const updateTimer = () => {
      displayTimer.value = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
    }
    updateTimer()
    timerInterval = setInterval(updateTimer, 100)
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

// Watch for answer feedback
watch(() => party.state.lastFeedback, (fb) => {
  if (fb) {
    feedback.value = fb
    vibrate(fb === 'correct' ? 100 : 50)
    playSfx(fb === 'correct' ? 'party.correct' : 'party.wrong')

    // Clear feedback after delay
    setTimeout(() => {
      feedback.value = null
    }, 2000)
  }
})

// Game info for header
const gameInfo = computed(() => {
  const game = party.state.room?.currentGame
  switch (game) {
    case 'trivia': return { name: `${new Date().getFullYear() - 1} REWIND`, emoji: '🧠', color: 'neon-pink' }
    case 'voting': return { name: 'MOST LIKELY', emoji: '🗳️', color: 'neon-green' }
    case 'drawing': return { name: 'SKETCH NYE', emoji: '🎨', color: 'neon-cyan' }
    case 'reaction': return { name: 'COUNTDOWN', emoji: '⚡', color: 'neon-purple' }
    default: return { name: 'PARTY', emoji: '🎉', color: 'neon-yellow' }
  }
})
</script>

<template>
  <div class="min-h-screen bg-arcade-bg text-white flex flex-col safe-area-inset">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <Icon name="mdi:loading" class="w-12 h-12 text-neon-cyan animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center p-4">
      <Icon name="mdi:alert-circle" class="w-16 h-16 text-red-400 mb-4" />
      <p class="font-retro text-red-400 text-center mb-4">{{ error }}</p>
      <NuxtLink
        to="/party"
        class="px-6 py-3 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan font-pixel rounded-lg"
      >
        BACK TO LOBBY
      </NuxtLink>
    </div>

    <!-- Connected State -->
    <template v-else>
      <!-- Header -->
      <div class="flex-shrink-0 p-3 border-b border-arcade-border bg-arcade-surface/50">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ party.state.currentPlayer?.avatar }}</span>
            <span class="font-retro text-sm text-white/70">{{ party.state.currentPlayer?.name }}</span>
          </div>

          <div v-if="party.phase.value !== 'lobby'" class="flex items-center gap-2">
            <span class="text-lg">{{ gameInfo.emoji }}</span>
            <span class="font-pixel text-xs" :class="`text-${gameInfo.color}`">{{ gameInfo.name }}</span>
          </div>

          <div class="text-right">
            <p class="font-pixel text-neon-yellow text-lg">{{ party.state.currentPlayer?.score || 0 }}</p>
          </div>
        </div>

        <!-- Timer Bar -->
        <div v-if="displayTimer > 0 && party.phase.value === 'round_active'" class="mt-2">
          <div class="h-1 bg-arcade-border rounded-full overflow-hidden">
            <div
              class="h-full transition-all duration-100"
              :class="displayTimer <= 5 ? 'bg-red-500' : 'bg-neon-cyan'"
              :style="{ width: `${(displayTimer / (party.state.room?.timerDuration || 30)) * 100}%` }"
            />
          </div>
          <p class="text-center font-pixel text-sm mt-1" :class="displayTimer <= 5 ? 'text-red-400' : 'text-neon-cyan'">
            {{ displayTimer }}
          </p>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- LOBBY PHASE -->
        <ControllerWaiting
          v-if="party.phase.value === 'lobby'"
          :player="party.state.currentPlayer"
          :players="party.players.value"
          :is-ready="party.state.currentPlayer?.isReady || false"
          @ready="setReady"
        />

        <!-- GAME INTRO PHASE -->
        <div v-else-if="party.phase.value === 'game_intro'" class="flex-1 flex flex-col items-center justify-center p-4">
          <div class="text-6xl mb-4 animate-bounce">{{ gameInfo.emoji }}</div>
          <h2 class="text-2xl font-pixel text-center" :class="`text-${gameInfo.color}`">
            {{ gameInfo.name }}
          </h2>
          <p class="font-retro text-white/50 mt-2">Get ready!</p>
        </div>

        <!-- ROUND ACTIVE PHASE -->
        <template v-else-if="party.phase.value === 'round_active' || party.phase.value === 'round_start'">
          <!-- Trivia - Buttons -->
          <ControllerButtons
            v-if="party.state.controllerType === 'buttons' && currentPrompt"
            :options="currentPrompt.options"
            :disabled="party.state.hasSubmitted"
            :selected-index="party.state.currentPlayer?.hasSubmitted ? party.state.currentPlayer.lastSubmission : undefined"
            @select="submitAnswer"
          />

          <!-- Voting -->
          <ControllerVoting
            v-else-if="party.state.controllerType === 'vote'"
            :players="party.players.value"
            :current-player-id="party.state.currentPlayer?.id || ''"
            :disabled="party.state.hasSubmitted"
            :selected-id="party.state.hasSubmitted ? party.state.currentPlayer?.lastSubmission : undefined"
            @vote="castVote"
          />

          <!-- Drawing -->
          <ControllerDrawCanvas
            v-else-if="party.state.controllerType === 'draw'"
            :word="currentPrompt?.word"
            :disabled="party.state.hasSubmitted"
            @stroke="handleDrawStroke"
            @submit="handleDrawingSubmit"
          />

          <!-- Text Input (for guessing in draw mode when not drawer) -->
          <ControllerTextInput
            v-else-if="party.state.controllerType === 'text'"
            placeholder="Type your guess..."
            :disabled="party.state.hasSubmitted"
            submit-label="GUESS"
            @submit="handleGuessSubmit"
          />

          <!-- Buzzer / Reaction -->
          <ControllerBuzzer
            v-else-if="party.state.controllerType === 'buzzer'"
            :mode="currentPrompt?.type === 'mash_buttons' ? 'mash' : currentPrompt?.type === 'hold_duration' ? 'hold' : 'tap_once'"
            :disabled="party.state.hasSubmitted && currentPrompt?.type !== 'mash_buttons'"
            :has-submitted="party.state.hasSubmitted"
            :target-duration="currentPrompt?.targetValue"
            @buzz="handleBuzz"
            @tap-count="handleTapCount"
            @hold-duration="handleHoldDuration"
          />

          <!-- Default waiting state -->
          <div v-else class="flex-1 flex items-center justify-center">
            <p class="font-retro text-white/50">Waiting...</p>
          </div>
        </template>

        <!-- ROUND REVEAL PHASE -->
        <div v-else-if="party.phase.value === 'round_reveal'" class="flex-1 flex flex-col items-center justify-center p-4">
          <div v-if="feedback === 'correct'" class="text-center animate-bounce">
            <div class="text-6xl mb-4">🎉</div>
            <p class="text-2xl font-pixel text-neon-green">CORRECT!</p>
            <p class="font-retro text-neon-yellow mt-2">+{{ party.state.currentPlayer?.roundScore || 0 }}</p>
          </div>
          <div v-else-if="feedback === 'wrong'" class="text-center">
            <div class="text-6xl mb-4">😅</div>
            <p class="text-2xl font-pixel text-red-400">Wrong!</p>
          </div>
          <div v-else class="text-center">
            <Icon name="mdi:loading" class="w-8 h-8 text-neon-cyan animate-spin" />
            <p class="font-retro text-white/50 mt-2">Revealing answer...</p>
          </div>
        </div>

        <!-- SCOREBOARD PHASE -->
        <div v-else-if="party.phase.value === 'round_scoreboard'" class="flex-1 flex flex-col items-center justify-center p-4">
          <h3 class="font-pixel text-neon-yellow mb-4">SCORES</h3>
          <div class="w-full max-w-xs space-y-2">
            <div
              v-for="(player, index) in [...party.players.value].sort((a, b) => b.score - a.score)"
              :key="player.id"
              class="flex items-center gap-3 p-2 rounded-lg"
              :class="player.id === party.state.currentPlayer?.id ? 'bg-neon-cyan/20 border border-neon-cyan/30' : 'bg-arcade-surface/50'"
            >
              <span class="font-pixel text-white/50 w-6">#{{ index + 1 }}</span>
              <span class="text-xl">{{ player.avatar }}</span>
              <span class="font-retro text-sm flex-1">{{ player.name }}</span>
              <span class="font-pixel text-neon-cyan">{{ player.score }}</span>
            </div>
          </div>
        </div>

        <!-- GAME RESULTS PHASE -->
        <div v-else-if="party.phase.value === 'game_results'" class="flex-1 flex flex-col items-center justify-center p-4">
          <h2 class="text-3xl font-pixel text-neon-yellow mb-8 animate-pulse">GAME OVER!</h2>

          <!-- Final position -->
          <div class="text-center mb-6">
            <p class="font-retro text-white/70">You finished</p>
            <p class="text-4xl font-pixel text-neon-green">
              #{{ [...party.players.value].sort((a, b) => b.score - a.score).findIndex(p => p.id === party.state.currentPlayer?.id) + 1 }}
            </p>
          </div>

          <div class="text-center">
            <p class="font-retro text-white/50">Final Score</p>
            <p class="text-3xl font-pixel text-neon-yellow">{{ party.state.currentPlayer?.score || 0 }}</p>
          </div>

          <p class="mt-8 font-retro text-white/50 text-sm">
            Waiting for host to continue...
          </p>
        </div>
      </div>
    </template>

    <!-- Feedback Overlay -->
    <Transition name="fade">
      <div
        v-if="feedback === 'correct'"
        class="fixed inset-0 bg-neon-green/20 pointer-events-none z-50"
      />
      <div
        v-else-if="feedback === 'wrong'"
        class="fixed inset-0 bg-red-500/20 pointer-events-none z-50"
      />
    </Transition>
  </div>
</template>

<style scoped>
.safe-area-inset {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
