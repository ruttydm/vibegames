<script setup lang="ts">
import { usePartyGame, type PartyPhase, type MiniGameId, type ControllerType } from '~/composables/usePartyGame'
import { usePlayer } from '~/composables/usePlayer'
import {
  getRandomTrivia,
  getRandomVotingPrompts,
  getRandomDrawingPrompts,
  getRandomReactionChallenges,
  type TriviaQuestion,
  type ReactionChallenge
} from '~/games/party/prompts'

const route = useRoute()
const router = useRouter()
const roomCode = route.params.room as string

const { playerName, initPlayer } = usePlayer()
const party = usePartyGame()

// Game data
const triviaQuestions = ref<TriviaQuestion[]>([])
const votingPrompts = ref<string[]>([])
const drawingPrompts = ref<string[]>([])
const reactionChallenges = ref<ReactionChallenge[]>([])
const currentPromptIndex = ref(0)

// Current game state
const showingAnswer = ref(false)
const correctAnswer = ref<any>(null)
const currentSubmissions = ref<Map<string, any>>(new Map())
const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)
const timerDisplay = ref(0)

// Initialize connection
onMounted(async () => {
  initPlayer()

  // Only create a new party if we don't already have one
  // (This prevents creating duplicate rooms when navigating from landing page)
  if (!party.state.room) {
    try {
      await party.createParty(playerName.value, 6)
    } catch (e) {
      console.error('Failed to create party:', e)
    }
  }
})

// Check if we're in the right room
watch(() => party.roomCode.value, (code) => {
  if (code && code !== roomCode) {
    router.replace(`/party/${code}`)
  }
})

// If we somehow end up here without being host, redirect to controller
watch(() => party.isHost.value, (isHost) => {
  if (party.state.room && !isHost) {
    router.replace(`/party/${roomCode}/play`)
  }
})

// Handle game errors
watch(() => party.state.error, (error) => {
  if (error) {
    console.error('Party error:', error)
  }
})

// Listen for player submissions
party.onMessage((type, payload) => {
  if (type === 'party_submission_update') {
    // Update UI to show who has submitted
  }
  if (type === 'party_guess_submitted') {
    handleGuess(payload.playerId, payload.guess)
  }
})

// ============================================
// Game Flow Control (Host Only)
// ============================================

function startParty() {
  // Prepare game prompts
  triviaQuestions.value = getRandomTrivia(3)
  votingPrompts.value = getRandomVotingPrompts(3)
  drawingPrompts.value = getRandomDrawingPrompts(3)
  reactionChallenges.value = getRandomReactionChallenges(3)
  currentPromptIndex.value = 0

  party.startParty()

  // After brief intro, start first game
  setTimeout(() => {
    startNextGame()
  }, 3000)
}

function startNextGame() {
  const currentGame = party.state.room?.currentGame
  if (!currentGame) return

  currentPromptIndex.value = 0
  showingAnswer.value = false

  // Show game intro
  party.setPhase('game_intro', { game: currentGame })

  // After intro, start first round
  setTimeout(() => {
    startRound()
  }, 4000)
}

function startRound() {
  const currentGame = party.state.room?.currentGame
  if (!currentGame) return

  showingAnswer.value = false
  correctAnswer.value = null
  currentSubmissions.value = new Map()

  let prompt: any
  let controllerType: ControllerType = 'buttons'
  let duration = 30

  switch (currentGame) {
    case 'trivia':
      prompt = triviaQuestions.value[currentPromptIndex.value]
      controllerType = 'buttons'
      duration = 15
      break
    case 'voting':
      prompt = { text: votingPrompts.value[currentPromptIndex.value] }
      controllerType = 'vote'
      duration = 20
      break
    case 'drawing':
      prompt = { word: drawingPrompts.value[currentPromptIndex.value] }
      controllerType = 'draw'
      duration = 60
      break
    case 'reaction':
      prompt = reactionChallenges.value[currentPromptIndex.value]
      controllerType = 'buzzer'
      duration = prompt.duration || 10
      break
  }

  party.initGame(currentGame, prompt, controllerType)
  party.setPhase('round_active')
  party.startTimer(duration)

  // Start local timer display
  timerDisplay.value = duration
  if (timerInterval.value) clearInterval(timerInterval.value)
  timerInterval.value = setInterval(() => {
    timerDisplay.value--
    if (timerDisplay.value <= 0) {
      clearInterval(timerInterval.value!)
      endRound()
    }
  }, 1000)
}

function endRound() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }

  showingAnswer.value = true
  party.setPhase('round_reveal')

  // Calculate scores based on game type
  const currentGame = party.state.room?.currentGame
  const scores: Record<string, { points: number; correct: boolean }> = {}
  const players = party.state.room?.players || []

  switch (currentGame) {
    case 'trivia': {
      const question = triviaQuestions.value[currentPromptIndex.value]
      correctAnswer.value = question.options[question.correctIndex]

      players.forEach(p => {
        // Check if player's answer matches correct index
        const isCorrect = p.hasSubmitted && p.lastSubmission === question.correctIndex
        scores[p.id] = {
          points: isCorrect ? 100 + (p.streak * 25) : 0,
          correct: isCorrect
        }
      })
      break
    }
    case 'voting': {
      // Count votes for each player
      const voteCounts: Record<string, number> = {}
      players.forEach(p => {
        if (p.hasSubmitted && p.lastSubmission) {
          voteCounts[p.lastSubmission] = (voteCounts[p.lastSubmission] || 0) + 1
        }
      })

      // Find who got most votes
      let maxVotes = 0
      let winners: string[] = []
      for (const [playerId, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
          maxVotes = count
          winners = [playerId]
        } else if (count === maxVotes) {
          winners.push(playerId)
        }
      }

      correctAnswer.value = winners

      // Score: points for receiving votes + bonus for voting with majority
      players.forEach(p => {
        const votesReceived = voteCounts[p.id] || 0
        const votedForWinner = winners.includes(p.lastSubmission)
        scores[p.id] = {
          points: (votesReceived * 20) + (votedForWinner ? 50 : 0),
          correct: votesReceived > 0
        }
      })
      break
    }
    case 'reaction': {
      const challenge = reactionChallenges.value[currentPromptIndex.value]

      if (challenge.type === 'mash_buttons') {
        // Score by tap count (stored as submission)
        players.forEach(p => {
          const taps = typeof p.lastSubmission === 'number' ? p.lastSubmission : 0
          scores[p.id] = {
            points: taps * 2,
            correct: taps > 20
          }
        })
        correctAnswer.value = 'Most taps wins!'
      } else if (challenge.type === 'stop_at_time') {
        // Score by accuracy
        const targetTime = challenge.targetValue || 0
        players.forEach(p => {
          if (p.hasSubmitted) {
            const diff = Math.abs((p.lastSubmission || 0) - targetTime)
            const points = Math.max(0, 100 - Math.floor(diff / 100))
            scores[p.id] = {
              points,
              correct: points > 50
            }
          } else {
            scores[p.id] = { points: 0, correct: false }
          }
        })
        correctAnswer.value = `Target: ${targetTime}ms`
      }
      break
    }
  }

  party.revealAnswer(correctAnswer.value, scores)

  // After reveal, show scoreboard
  setTimeout(() => {
    party.setPhase('round_scoreboard')
    party.showScoreboard()

    // Then advance to next round or game
    setTimeout(() => {
      advanceGame()
    }, 5000)
  }, 4000)
}

function advanceGame() {
  currentPromptIndex.value++

  const totalRounds = 3 // Rounds per mini-game
  const miniGame = party.state.room?.miniGame

  if (currentPromptIndex.value >= totalRounds) {
    // This mini-game is done, advance to next
    party.advanceRound()

    // Check if party is over
    const room = party.state.room
    if (room && room.currentGameIndex >= room.totalGames) {
      // Party over!
      party.endParty()
    } else {
      // Start next mini-game
      setTimeout(() => {
        startNextGame()
      }, 2000)
    }
  } else {
    // Continue with next round
    startRound()
  }
}

function handleGuess(playerId: string, guess: string) {
  // For drawing game - check if guess matches word
  if (party.state.room?.currentGame === 'drawing') {
    const currentWord = drawingPrompts.value[currentPromptIndex.value].toLowerCase()
    if (guess.toLowerCase().includes(currentWord)) {
      // Correct guess!
      const scores: Record<string, { points: number; correct: boolean }> = {
        [playerId]: { points: 150, correct: true }
      }
      party.revealAnswer(currentWord, scores)

      // End this round early
      setTimeout(() => {
        party.setPhase('round_scoreboard')
        party.showScoreboard()
        setTimeout(() => advanceGame(), 3000)
      }, 2000)
    }
  }
}

function returnToLobby() {
  party.returnToLobby()
  currentPromptIndex.value = 0
  showingAnswer.value = false
}

function kickPlayer(playerId: string) {
  party.kickPlayer(playerId)
}

// Cleanup
onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})

// Fireworks control
const showFireworks = ref(false)
const fireworksIntensity = ref<'low' | 'medium' | 'high'>('medium')

// Watch for celebration moments
watch(() => party.phase.value, (phase) => {
  if (phase === 'game_results') {
    fireworksIntensity.value = 'high'
    showFireworks.value = true
  } else if (phase === 'round_reveal') {
    // Show brief fireworks on reveal
    fireworksIntensity.value = 'low'
    showFireworks.value = true
    setTimeout(() => {
      if (party.phase.value !== 'game_results') {
        showFireworks.value = false
      }
    }, 3000)
  } else {
    showFireworks.value = false
  }
})

// Get game display info
const gameInfo = computed(() => {
  const game = party.state.room?.currentGame
  switch (game) {
    case 'trivia': return { name: `${new Date().getFullYear() - 1} REWIND`, emoji: '🧠', color: 'neon-pink' }
    case 'voting': return { name: 'MOST LIKELY TO...', emoji: '🗳️', color: 'neon-green' }
    case 'drawing': return { name: 'SKETCH NYE', emoji: '🎨', color: 'neon-cyan' }
    case 'reaction': return { name: 'COUNTDOWN CLASH', emoji: '⚡', color: 'neon-purple' }
    default: return { name: 'PARTY', emoji: '🎉', color: 'neon-yellow' }
  }
})

const currentPrompt = computed(() => {
  const game = party.state.room?.currentGame
  switch (game) {
    case 'trivia': return triviaQuestions.value[currentPromptIndex.value]
    case 'voting': return votingPrompts.value[currentPromptIndex.value]
    case 'drawing': return drawingPrompts.value[currentPromptIndex.value]
    case 'reaction': return reactionChallenges.value[currentPromptIndex.value]
    default: return null
  }
})
</script>

<template>
  <div class="min-h-screen bg-arcade-bg text-white p-4 md:p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <NuxtLink to="/party" class="text-neon-cyan/70 hover:text-neon-cyan font-retro text-sm flex items-center gap-2">
        <Icon name="mdi:arrow-left" class="w-4 h-4" />
        Leave Party
      </NuxtLink>

      <div class="text-center">
        <p class="font-pixel text-neon-yellow text-xl">{{ party.roomCode }}</p>
      </div>

      <div class="text-right">
        <p class="font-retro text-white/50 text-sm">{{ party.players.value.length }} players</p>
      </div>
    </div>

    <!-- LOBBY PHASE -->
    <div v-if="party.phase.value === 'lobby'" class="animate-fade-in">
      <PartyHostPartyLobby
        :room-code="party.roomCode.value || ''"
        :players="party.players.value"
        :can-start="party.canStart.value"
        :is-host="party.isHost.value"
        @start="startParty"
        @kick="kickPlayer"
      />
    </div>

    <!-- GAME INTRO PHASE -->
    <div v-else-if="party.phase.value === 'game_intro'" class="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div class="text-8xl mb-8 animate-bounce">{{ gameInfo.emoji }}</div>
      <h1 class="text-4xl md:text-6xl font-pixel mb-4 text-center" :class="`text-${gameInfo.color}`">
        {{ gameInfo.name }}
      </h1>
      <p class="font-retro text-white/70 text-lg">Get ready!</p>

      <!-- Player avatars -->
      <div class="flex gap-4 mt-8">
        <PartySharedPlayerAvatar
          v-for="player in party.players.value"
          :key="player.id"
          :avatar="player.avatar"
          :color="player.color"
          :name="player.name"
          size="md"
        />
      </div>
    </div>

    <!-- ROUND ACTIVE PHASE -->
    <div v-else-if="party.phase.value === 'round_active' || party.phase.value === 'round_start'" class="animate-fade-in">
      <!-- Timer -->
      <div class="text-center mb-8">
        <div
          class="inline-block px-8 py-4 rounded-lg border-2"
          :class="timerDisplay <= 5 ? 'border-red-500 bg-red-500/20 animate-pulse' : 'border-neon-cyan/50 bg-arcade-surface/50'"
        >
          <span class="text-4xl font-pixel" :class="timerDisplay <= 5 ? 'text-red-400' : 'text-neon-cyan'">
            {{ timerDisplay }}
          </span>
        </div>
      </div>

      <!-- Game-specific content -->
      <div v-if="party.currentGame.value === 'trivia' && currentPrompt" class="max-w-4xl mx-auto">
        <h2 class="text-2xl md:text-3xl font-pixel text-neon-pink text-center mb-8">
          {{ (currentPrompt as TriviaQuestion).question }}
        </h2>
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="(option, index) in (currentPrompt as TriviaQuestion).options"
            :key="index"
            class="p-6 rounded-lg border-2 transition-all"
            :class="[
              showingAnswer && index === (currentPrompt as TriviaQuestion).correctIndex
                ? 'border-neon-green bg-neon-green/20'
                : 'border-arcade-border bg-arcade-surface/50',
              ['text-neon-pink', 'text-neon-cyan', 'text-neon-yellow', 'text-neon-green'][index]
            ]"
          >
            <span class="font-pixel text-xl mr-4">{{ ['A', 'B', 'C', 'D'][index] }}</span>
            <span class="font-retro text-lg text-white">{{ option }}</span>
          </div>
        </div>
      </div>

      <div v-else-if="party.currentGame.value === 'voting'" class="max-w-2xl mx-auto text-center">
        <h2 class="text-xl font-retro text-white/70 mb-4">Who is most likely to...</h2>
        <p class="text-3xl md:text-4xl font-pixel text-neon-green">
          {{ currentPrompt }}
        </p>

        <!-- Show who has voted -->
        <div class="flex justify-center gap-4 mt-12">
          <PartySharedPlayerAvatar
            v-for="player in party.players.value"
            :key="player.id"
            :avatar="player.avatar"
            :color="player.color"
            :name="player.name"
            :has-submitted="player.hasSubmitted"
            size="lg"
            show-status
          />
        </div>
      </div>

      <div v-else-if="party.currentGame.value === 'drawing'" class="max-w-4xl mx-auto">
        <div class="text-center mb-8">
          <p class="font-retro text-white/70">Drawing:</p>
          <p class="text-4xl font-pixel text-neon-cyan">{{ currentPrompt }}</p>
        </div>

        <!-- Canvas display area -->
        <div class="bg-white rounded-lg aspect-video max-w-2xl mx-auto border-4 border-neon-cyan/50">
          <p class="text-arcade-bg font-retro text-center py-20">
            Drawings appear here in real-time
          </p>
        </div>
      </div>

      <div v-else-if="party.currentGame.value === 'reaction' && currentPrompt" class="max-w-2xl mx-auto text-center">
        <h2 class="text-3xl md:text-4xl font-pixel text-neon-purple mb-4">
          {{ (currentPrompt as ReactionChallenge).title }}
        </h2>
        <p class="text-xl font-retro text-white/70">
          {{ (currentPrompt as ReactionChallenge).description }}
        </p>

        <!-- Show who has buzzed -->
        <div class="flex justify-center gap-4 mt-12">
          <PartySharedPlayerAvatar
            v-for="player in party.players.value"
            :key="player.id"
            :avatar="player.avatar"
            :color="player.color"
            :name="player.name"
            :has-submitted="player.hasSubmitted"
            size="lg"
            show-status
          />
        </div>
      </div>
    </div>

    <!-- ROUND REVEAL PHASE -->
    <div v-else-if="party.phase.value === 'round_reveal'" class="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <h2 class="text-3xl font-pixel text-neon-yellow mb-8">Answer Revealed!</h2>

      <div v-if="party.currentGame.value === 'trivia'" class="text-center">
        <p class="text-2xl font-retro text-white mb-4">The correct answer was:</p>
        <p class="text-4xl font-pixel text-neon-green">{{ correctAnswer }}</p>
      </div>

      <div v-else-if="party.currentGame.value === 'voting'" class="text-center">
        <p class="text-2xl font-retro text-white mb-4">Most votes went to:</p>
        <div class="flex gap-4 justify-center">
          <PartySharedPlayerAvatar
            v-for="winnerId in correctAnswer"
            :key="winnerId"
            :avatar="party.players.value.find(p => p.id === winnerId)?.avatar || '🎉'"
            :color="party.players.value.find(p => p.id === winnerId)?.color || '#ffd700'"
            :name="party.players.value.find(p => p.id === winnerId)?.name || 'Winner'"
            size="lg"
          />
        </div>
      </div>
    </div>

    <!-- SCOREBOARD PHASE -->
    <div v-else-if="party.phase.value === 'round_scoreboard'" class="animate-fade-in">
      <PartyHostPartyScoreboard
        :players="party.players.value"
        :title="`Round ${currentPromptIndex + 1} Results`"
        show-round-score
      />
    </div>

    <!-- GAME RESULTS PHASE -->
    <div v-else-if="party.phase.value === 'game_results'" class="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <h1 class="text-4xl md:text-6xl font-pixel text-neon-yellow mb-8 animate-pulse">
        GAME OVER!
      </h1>

      <PartyHostPartyScoreboard
        :players="party.players.value"
        title="Final Scores"
      />

      <button
        @click="returnToLobby"
        class="mt-8 px-8 py-4 bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan font-pixel text-lg rounded-lg hover:bg-neon-cyan/30 transition-all"
      >
        PLAY AGAIN
      </button>
    </div>

    <!-- Loading state -->
    <div v-else class="flex items-center justify-center min-h-[60vh]">
      <Icon name="mdi:loading" class="w-12 h-12 text-neon-cyan animate-spin" />
    </div>

    <!-- Fireworks overlay for celebrations -->
    <PartySharedNYEFireworks
      :active="showFireworks"
      :intensity="fireworksIntensity"
    />
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
</style>
