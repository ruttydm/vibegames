<script setup lang="ts">
import { usePlayer } from '~/composables/usePlayer'
import { usePartyGame } from '~/composables/usePartyGame'

const { playerName, initPlayer, setPlayerName } = usePlayer()
const party = usePartyGame()
const router = useRouter()
const { startSong, stopSong } = useAudio()

// Initialize player name and start music
onMounted(() => {
  initPlayer()
  // Start party music
  startSong('party')
})

onUnmounted(() => {
  // Don't stop music if navigating to party room
  if (!party.state.room) {
    stopSong()
  }
})

// Form state
const mode = ref<'select' | 'create' | 'join'>('select')
const joinCode = ref('')
const customName = ref('')
const isLoading = ref(false)
const error = ref('')

// Watch for successful room creation/join
watch(() => party.roomCode.value, (newCode) => {
  if (newCode) {
    // Navigate to appropriate page based on whether we're host
    if (party.isHost.value) {
      router.push(`/party/${newCode}`)
    } else {
      router.push(`/party/${newCode}/play`)
    }
  }
})

// Watch for errors
watch(() => party.state.error, (newError) => {
  if (newError) {
    error.value = newError
    isLoading.value = false
  }
})

async function createParty() {
  error.value = ''
  isLoading.value = true
  const name = customName.value.trim() || playerName.value
  await party.createParty(name, 6)
}

async function joinParty() {
  if (!joinCode.value.trim()) {
    error.value = 'Please enter a room code'
    return
  }
  error.value = ''
  isLoading.value = true
  const name = customName.value.trim() || playerName.value
  await party.joinParty(joinCode.value.trim().toUpperCase(), name)
}

function handleNameChange(e: Event) {
  const target = e.target as HTMLInputElement
  customName.value = target.value
  if (target.value.trim()) {
    setPlayerName(target.value.trim())
  }
}

// NYE countdown - dynamic year based on current date
const getTargetNYE = () => {
  const now = new Date()
  // If we're in December, target Jan 1 of next year
  // Otherwise target Jan 1 of current year (for testing/display)
  if (now.getMonth() === 11) {
    return new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0)
  }
  // If we're within 30 mins after midnight on Jan 1, still show celebration
  if (now.getMonth() === 0 && now.getDate() === 1 && now.getHours() === 0 && now.getMinutes() < 30) {
    return new Date(now.getFullYear(), 0, 1, 0, 0, 0)
  }
  // Otherwise target next NYE
  return new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0)
}

const targetYear = computed(() => getTargetNYE().getFullYear())
const lastYear = computed(() => targetYear.value - 1)
const nyeCountdown = ref('')
const isHappyNewYear = ref(false)

const updateNYECountdown = () => {
  const now = new Date()
  const nye = getTargetNYE()
  const diff = nye.getTime() - now.getTime()

  // Show "Happy New Year" for 30 minutes after midnight
  if (diff <= 0 && diff > -30 * 60 * 1000) {
    nyeCountdown.value = `HAPPY NEW YEAR ${nye.getFullYear()}!`
    isHappyNewYear.value = true
    return
  }

  isHappyNewYear.value = false

  if (diff <= 0) {
    // Past the 30-minute window, show countdown to next year
    const nextNye = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0)
    const nextDiff = nextNye.getTime() - now.getTime()
    const days = Math.floor(nextDiff / (1000 * 60 * 60 * 24))
    nyeCountdown.value = `${days} days to ${nextNye.getFullYear()}`
    return
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  nyeCountdown.value = `${hours}h ${minutes}m ${seconds}s`
}

let countdownInterval: ReturnType<typeof setInterval>
onMounted(() => {
  updateNYECountdown()
  countdownInterval = setInterval(updateNYECountdown, 1000)
})

// Pre-compute confetti particle styles to avoid re-computing on every render
const confettiParticles = Array.from({ length: 30 }, () => ({
  left: `${Math.random() * 100}%`,
  animationDelay: `${Math.random() * 15}s`,
  animationDuration: `${8 + Math.random() * 12}s`
}))

// Easter egg: Click to shoot confetti
const { playSfx } = useAudio()

useSeoMeta({
  title: 'NYE Party Games - Play With Friends | VibeGames',
  description: 'Host or join a New Year\'s Eve party with fun mini-games. Drawing, trivia, voting games and more. Play with friends on any device.',
  ogTitle: 'NYE Party Games | VibeGames',
  ogDescription: 'Host a New Year\'s Eve party with fun mini-games. Play with friends!',
  ogImage: '/og-image.svg',
  twitterCard: 'summary_large_image'
})
const burstParticles = ref<Array<{ id: number; x: number; y: number; color: string; angle: number; velocity: number }>>([])
let burstIdCounter = 0

function handleBackgroundClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  // Only trigger on the background container, not on buttons/inputs
  if (target.closest('button, input, a, .card')) return

  const x = e.clientX
  const y = e.clientY

  // Play celebration sound
  playSfx('party.celebration')

  // Create burst of particles
  const colors = ['#ff2e63', '#00fff5', '#ffd700', '#39ff14', '#bf00ff']
  const newParticles = Array.from({ length: 15 }, () => ({
    id: burstIdCounter++,
    x,
    y,
    color: colors[Math.floor(Math.random() * colors.length)],
    angle: Math.random() * Math.PI * 2,
    velocity: 5 + Math.random() * 10
  }))

  burstParticles.value.push(...newParticles)

  // Remove particles after animation
  setTimeout(() => {
    burstParticles.value = burstParticles.value.filter(
      p => !newParticles.find(np => np.id === p.id)
    )
  }, 1500)
}

onUnmounted(() => {
  clearInterval(countdownInterval)
})
</script>

<template>
  <div class="min-h-screen bg-arcade-bg relative overflow-hidden" @click="handleBackgroundClick">
    <!-- Animated background particles -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        v-for="(particle, i) in confettiParticles"
        :key="i"
        class="confetti-particle"
        :style="particle"
      />
    </div>

    <!-- Burst particles (easter egg) -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none z-50">
      <div
        v-for="particle in burstParticles"
        :key="particle.id"
        class="burst-particle"
        :style="{
          left: `${particle.x}px`,
          top: `${particle.y}px`,
          backgroundColor: particle.color,
          '--angle': `${particle.angle}rad`,
          '--velocity': `${particle.velocity * 20}px`
        }"
      />
    </div>

    <div class="container mx-auto px-4 py-8 relative z-10">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-6xl font-pixel text-neon-yellow mb-4 animate-pulse">
          NYE PARTY
        </h1>
        <p class="text-xl md:text-2xl font-pixel text-neon-cyan">
          <ClientOnly>{{ targetYear }}</ClientOnly>
        </p>

        <!-- NYE Countdown -->
        <div class="mt-6 p-4 bg-arcade-surface/50 backdrop-blur border border-neon-yellow/30 rounded-lg inline-block">
          <p class="text-sm font-retro text-neon-pink mb-1">Time until midnight:</p>
          <p class="text-2xl font-pixel text-neon-yellow"><ClientOnly>{{ nyeCountdown }}</ClientOnly></p>
        </div>
      </div>

      <!-- Main Card -->
      <div class="max-w-md mx-auto">
        <div class="bg-arcade-surface border-2 border-neon-cyan/50 rounded-lg p-6 shadow-[0_0_30px_rgba(0,255,245,0.2)]">

          <!-- Mode Selection -->
          <div v-if="mode === 'select'" class="space-y-4">
            <h2 class="text-xl font-pixel text-neon-cyan text-center mb-6">
              Let's Party!
            </h2>

            <button
              @click="mode = 'create'"
              class="w-full py-4 px-6 bg-neon-pink/20 border-2 border-neon-pink text-neon-pink font-pixel text-sm rounded-lg hover:bg-neon-pink/30 hover:shadow-[0_0_20px_rgba(255,46,99,0.5)] transition-all"
            >
              HOST A PARTY
            </button>

            <button
              @click="mode = 'join'"
              class="w-full py-4 px-6 bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan font-pixel text-sm rounded-lg hover:bg-neon-cyan/30 hover:shadow-[0_0_20px_rgba(0,255,245,0.5)] transition-all"
            >
              JOIN A PARTY
            </button>

            <NuxtLink
              to="/"
              class="block text-center text-neon-purple/70 hover:text-neon-purple font-retro text-sm mt-6"
            >
              Back to Games
            </NuxtLink>
          </div>

          <!-- Create Party Form -->
          <div v-else-if="mode === 'create'" class="space-y-4">
            <button
              @click="mode = 'select'"
              class="text-neon-cyan/70 hover:text-neon-cyan font-retro text-sm flex items-center gap-2"
            >
              <Icon name="mdi:arrow-left" class="w-4 h-4" />
              Back
            </button>

            <h2 class="text-xl font-pixel text-neon-pink text-center">
              Host a Party
            </h2>

            <div>
              <label class="block text-sm font-retro text-white/70 mb-2">Your Name</label>
              <input
                type="text"
                :value="customName || playerName"
                @input="handleNameChange"
                maxlength="20"
                class="w-full px-4 py-3 bg-arcade-bg border-2 border-neon-pink/50 rounded-lg text-white font-retro focus:border-neon-pink focus:outline-none"
                placeholder="Enter your name..."
              />
            </div>

            <div v-if="error" class="text-red-400 font-retro text-sm text-center">
              {{ error }}
            </div>

            <button
              @click="createParty"
              :disabled="isLoading"
              class="w-full py-4 px-6 bg-neon-pink border-2 border-neon-pink text-arcade-bg font-pixel text-sm rounded-lg hover:bg-neon-pink/80 hover:shadow-[0_0_20px_rgba(255,46,99,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? 'CREATING...' : 'CREATE PARTY' }}
            </button>

            <p class="text-center text-white/50 font-retro text-xs">
              Players will join using a QR code or room code
            </p>
          </div>

          <!-- Join Party Form -->
          <div v-else-if="mode === 'join'" class="space-y-4">
            <button
              @click="mode = 'select'"
              class="text-neon-cyan/70 hover:text-neon-cyan font-retro text-sm flex items-center gap-2"
            >
              <Icon name="mdi:arrow-left" class="w-4 h-4" />
              Back
            </button>

            <h2 class="text-xl font-pixel text-neon-cyan text-center">
              Join a Party
            </h2>

            <div>
              <label class="block text-sm font-retro text-white/70 mb-2">Your Name</label>
              <input
                type="text"
                :value="customName || playerName"
                @input="handleNameChange"
                maxlength="20"
                class="w-full px-4 py-3 bg-arcade-bg border-2 border-neon-cyan/50 rounded-lg text-white font-retro focus:border-neon-cyan focus:outline-none"
                placeholder="Enter your name..."
              />
            </div>

            <div>
              <label class="block text-sm font-retro text-white/70 mb-2">Room Code</label>
              <input
                type="text"
                v-model="joinCode"
                maxlength="10"
                class="w-full px-4 py-3 bg-arcade-bg border-2 border-neon-cyan/50 rounded-lg text-white font-pixel text-center text-xl tracking-widest uppercase focus:border-neon-cyan focus:outline-none"
                placeholder="PRTY-XXXX"
              />
            </div>

            <div v-if="error" class="text-red-400 font-retro text-sm text-center">
              {{ error }}
            </div>

            <button
              @click="joinParty"
              :disabled="isLoading || !joinCode.trim()"
              class="w-full py-4 px-6 bg-neon-cyan border-2 border-neon-cyan text-arcade-bg font-pixel text-sm rounded-lg hover:bg-neon-cyan/80 hover:shadow-[0_0_20px_rgba(0,255,245,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? 'JOINING...' : 'JOIN PARTY' }}
            </button>

            <p class="text-center text-white/50 font-retro text-xs">
              Ask the host for the room code or scan the QR code
            </p>
          </div>
        </div>

        <!-- Game Info -->
        <div class="mt-8 text-center space-y-4">
          <h3 class="font-pixel text-neon-yellow text-sm">MINI-GAMES INCLUDED</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 bg-arcade-surface/50 rounded-lg border border-arcade-border">
              <div class="text-2xl mb-1">🎨</div>
              <p class="font-pixel text-[10px] text-neon-cyan">SKETCH NYE</p>
              <p class="font-retro text-[10px] text-white/50">Draw & Guess</p>
            </div>
            <div class="p-3 bg-arcade-surface/50 rounded-lg border border-arcade-border">
              <div class="text-2xl mb-1">🧠</div>
              <p class="font-pixel text-[10px] text-neon-pink"><ClientOnly fallback="REWIND">{{ lastYear }} REWIND</ClientOnly></p>
              <p class="font-retro text-[10px] text-white/50">Trivia Quiz</p>
            </div>
            <div class="p-3 bg-arcade-surface/50 rounded-lg border border-arcade-border">
              <div class="text-2xl mb-1">🗳️</div>
              <p class="font-pixel text-[10px] text-neon-green">MOST LIKELY</p>
              <p class="font-retro text-[10px] text-white/50">Vote on Friends</p>
            </div>
            <div class="p-3 bg-arcade-surface/50 rounded-lg border border-arcade-border">
              <div class="text-2xl mb-1">⚡</div>
              <p class="font-pixel text-[10px] text-neon-purple">COUNTDOWN</p>
              <p class="font-retro text-[10px] text-white/50">Quick Reactions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confetti-particle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: linear-gradient(45deg, #ff2e63, #00fff5, #ffd700, #39ff14);
  animation: confetti-fall linear infinite;
  opacity: 0.6;
}

.confetti-particle:nth-child(odd) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.confetti-particle:nth-child(3n) {
  background: #ffd700;
}

.confetti-particle:nth-child(5n) {
  background: #ff2e63;
}

.confetti-particle:nth-child(7n) {
  background: #00fff5;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-10vh) translateX(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  25% {
    transform: translateY(25vh) translateX(30px) rotate(180deg);
  }
  50% {
    transform: translateY(50vh) translateX(-20px) rotate(360deg);
  }
  75% {
    transform: translateY(75vh) translateX(25px) rotate(540deg);
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(110vh) translateX(-15px) rotate(720deg);
    opacity: 0;
  }
}

/* Burst particles for easter egg */
.burst-particle {
  position: fixed;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: burst-out 1s ease-out forwards;
  box-shadow: 0 0 10px currentColor;
}

@keyframes burst-out {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(cos(var(--angle)) * var(--velocity)),
      calc(sin(var(--angle)) * var(--velocity) + 100px)
    ) scale(0);
    opacity: 0;
  }
}
</style>
