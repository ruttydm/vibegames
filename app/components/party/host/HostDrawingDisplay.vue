<script setup lang="ts">
import type { PartyPlayer } from '~/composables/usePartyGame'

const props = defineProps<{
  players: PartyPlayer[]
}>()

// Store canvases for each player
const canvasRefs = ref<Map<string, HTMLCanvasElement>>(new Map())
const contexts = ref<Map<string, CanvasRenderingContext2D>>(new Map())

// Track which players have started drawing
const hasDrawn = ref<Set<string>>(new Set())

// Store the party composable
const party = usePartyGame()

// Initialize canvas contexts when component mounts
function initCanvas(playerId: string, canvas: HTMLCanvasElement | null) {
  if (!canvas) return

  canvasRefs.value.set(playerId, canvas)
  const ctx = canvas.getContext('2d')
  if (ctx) {
    contexts.value.set(playerId, ctx)

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
  }
}

// Handle incoming drawing strokes
function handleStroke(playerId: string, strokeData: string) {
  const ctx = contexts.value.get(playerId)
  if (!ctx) return

  hasDrawn.value.add(playerId)

  try {
    const stroke = JSON.parse(strokeData)
    const canvas = canvasRefs.value.get(playerId)
    if (!canvas) return

    // Scale stroke coordinates to canvas size
    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width / 300 // Assuming phone canvas is roughly 300px wide
    const scaleY = rect.height / 200 // Assuming phone canvas aspect ratio

    ctx.beginPath()
    ctx.moveTo(stroke.from.x * scaleX, stroke.from.y * scaleY)
    ctx.lineTo(stroke.to.x * scaleX, stroke.to.y * scaleY)
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.size * Math.min(scaleX, scaleY)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  } catch (e) {
    console.error('Failed to parse stroke data:', e)
  }
}

// Listen for drawing strokes from WebSocket
const unsubscribe = party.onMessage((type, payload) => {
  if (type === 'party_draw_stroke') {
    handleStroke(payload.playerId, payload.stroke)
  }
})

// Clear all canvases when round changes
watch(() => party.state.room?.miniGame?.round, () => {
  hasDrawn.value.clear()
  contexts.value.forEach((ctx, playerId) => {
    const canvas = canvasRefs.value.get(playerId)
    if (canvas && ctx) {
      const rect = canvas.getBoundingClientRect()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, rect.width, rect.height)
    }
  })
})

onUnmounted(() => {
  unsubscribe()
})

// Compute grid layout based on player count
const gridClass = computed(() => {
  const count = props.players.length
  if (count <= 2) return 'grid-cols-2'
  if (count <= 4) return 'grid-cols-2 md:grid-cols-4'
  return 'grid-cols-2 md:grid-cols-3'
})
</script>

<template>
  <div class="w-full max-w-4xl mx-auto">
    <p class="font-retro text-white/70 text-center mb-4">Watch the drawings appear!</p>

    <div class="grid gap-4" :class="gridClass">
      <div
        v-for="player in players"
        :key="player.id"
        class="relative"
      >
        <!-- Player label -->
        <div class="flex items-center gap-2 mb-2">
          <span class="text-lg">{{ player.avatar }}</span>
          <span class="font-retro text-sm" :style="{ color: player.color }">{{ player.name }}</span>
          <span v-if="hasDrawn.has(player.id)" class="ml-auto">
            <Icon name="mdi:pencil" class="w-4 h-4 text-neon-cyan animate-pulse" />
          </span>
        </div>

        <!-- Drawing canvas -->
        <div class="relative aspect-[4/3] bg-white rounded-lg overflow-hidden border-2" :style="{ borderColor: player.color }">
          <canvas
            :ref="(el) => initCanvas(player.id, el as HTMLCanvasElement)"
            class="w-full h-full"
          />

          <!-- Waiting overlay -->
          <div
            v-if="!hasDrawn.has(player.id)"
            class="absolute inset-0 flex items-center justify-center bg-white/80"
          >
            <p class="font-retro text-arcade-bg/50 text-sm">Waiting...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
