<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean
  word?: string
}>()

const emit = defineEmits<{
  stroke: [strokeData: string]
  submit: [imageData: string]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const isDrawing = ref(false)
const currentColor = ref('#00fff5') // neon-cyan default
const brushSize = ref(4)
const lastPoint = ref<{ x: number; y: number } | null>(null)

const colors = [
  '#ff2e63', // neon-pink
  '#00fff5', // neon-cyan
  '#ffd700', // neon-yellow
  '#39ff14', // neon-green
  '#bf00ff', // neon-purple
  '#ffffff', // white
  '#000000', // black
]

onMounted(() => {
  if (canvasRef.value) {
    const canvas = canvasRef.value
    ctx.value = canvas.getContext('2d')

    // Set canvas size to match display size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.value?.scale(window.devicePixelRatio, window.devicePixelRatio)

    // White background
    if (ctx.value) {
      ctx.value.fillStyle = '#ffffff'
      ctx.value.fillRect(0, 0, rect.width, rect.height)
    }
  }
})

function getPosition(e: TouchEvent | MouseEvent): { x: number; y: number } {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }

  const rect = canvas.getBoundingClientRect()

  if ('touches' in e) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    }
  } else {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }
}

function startDrawing(e: TouchEvent | MouseEvent) {
  if (props.disabled) return
  isDrawing.value = true
  lastPoint.value = getPosition(e)
}

function draw(e: TouchEvent | MouseEvent) {
  if (!isDrawing.value || !ctx.value || !lastPoint.value || props.disabled) return

  e.preventDefault()

  const currentPoint = getPosition(e)

  ctx.value.beginPath()
  ctx.value.moveTo(lastPoint.value.x, lastPoint.value.y)
  ctx.value.lineTo(currentPoint.x, currentPoint.y)
  ctx.value.strokeStyle = currentColor.value
  ctx.value.lineWidth = brushSize.value
  ctx.value.lineCap = 'round'
  ctx.value.lineJoin = 'round'
  ctx.value.stroke()

  // Emit stroke data for real-time sync
  const strokeData = JSON.stringify({
    from: lastPoint.value,
    to: currentPoint,
    color: currentColor.value,
    size: brushSize.value
  })
  emit('stroke', strokeData)

  lastPoint.value = currentPoint
}

function stopDrawing() {
  isDrawing.value = false
  lastPoint.value = null
}

function clearCanvas() {
  if (!ctx.value || !canvasRef.value) return
  const canvas = canvasRef.value
  ctx.value.fillStyle = '#ffffff'
  ctx.value.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio)
}

function submitDrawing() {
  if (!canvasRef.value) return
  const imageData = canvasRef.value.toDataURL('image/png')
  emit('submit', imageData)
}

function vibrate() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Word to draw -->
    <div v-if="word" class="text-center py-2 bg-neon-cyan/20 border-b border-neon-cyan/30">
      <p class="font-pixel text-neon-cyan text-lg">Draw: {{ word }}</p>
    </div>

    <!-- Canvas -->
    <div class="flex-1 relative bg-white touch-none">
      <canvas
        ref="canvasRef"
        class="w-full h-full"
        @touchstart.prevent="startDrawing"
        @touchmove.prevent="draw"
        @touchend="stopDrawing"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
      />
    </div>

    <!-- Controls -->
    <div class="p-3 bg-arcade-surface border-t border-arcade-border">
      <!-- Colors -->
      <div class="flex justify-center gap-2 mb-3">
        <button
          v-for="color in colors"
          :key="color"
          @click="currentColor = color; vibrate()"
          class="w-8 h-8 rounded-full border-2 transition-all"
          :class="currentColor === color ? 'scale-110 border-white' : 'border-transparent'"
          :style="{ backgroundColor: color }"
        />
      </div>

      <!-- Brush Size & Actions -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <button
            @click="brushSize = Math.max(2, brushSize - 2); vibrate()"
            class="p-2 text-white/70 hover:text-white"
          >
            <Icon name="mdi:minus" class="w-5 h-5" />
          </button>
          <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <div
              class="rounded-full"
              :style="{
                width: `${brushSize}px`,
                height: `${brushSize}px`,
                backgroundColor: currentColor
              }"
            />
          </div>
          <button
            @click="brushSize = Math.min(20, brushSize + 2); vibrate()"
            class="p-2 text-white/70 hover:text-white"
          >
            <Icon name="mdi:plus" class="w-5 h-5" />
          </button>
        </div>

        <button
          @click="clearCanvas(); vibrate()"
          class="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 font-retro text-sm rounded-lg"
        >
          Clear
        </button>

        <button
          @click="submitDrawing()"
          :disabled="disabled"
          class="px-4 py-2 bg-neon-green/20 border border-neon-green text-neon-green font-pixel text-sm rounded-lg disabled:opacity-50"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>
