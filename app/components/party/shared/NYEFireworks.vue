<script setup lang="ts">
const props = defineProps<{
  active: boolean
  intensity?: 'low' | 'medium' | 'high'
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const particles = ref<Particle[]>([])
let animationFrame: number | null = null

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
  maxLife: number
  type: 'spark' | 'confetti' | 'trail'
  rotation: number
  rotationSpeed: number
}

const colors = ['#ff2e63', '#00fff5', '#ffd700', '#39ff14', '#bf00ff', '#ff6b35', '#ffffff']

function createFirework(x: number, y: number) {
  const particleCount = props.intensity === 'high' ? 50 : props.intensity === 'medium' ? 30 : 15
  const color = colors[Math.floor(Math.random() * colors.length)]

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.3
    const speed = 3 + Math.random() * 5

    particles.value.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      size: 2 + Math.random() * 3,
      life: 60 + Math.random() * 40,
      maxLife: 60 + Math.random() * 40,
      type: 'spark',
      rotation: 0,
      rotationSpeed: 0
    })
  }
}

function createConfetti() {
  if (!canvasRef.value) return

  const count = props.intensity === 'high' ? 10 : props.intensity === 'medium' ? 5 : 2

  for (let i = 0; i < count; i++) {
    particles.value.push({
      x: Math.random() * canvasRef.value.width,
      y: -20,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 5 + Math.random() * 10,
      life: 200 + Math.random() * 100,
      maxLife: 200 + Math.random() * 100,
      type: 'confetti',
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    })
  }
}

function animate() {
  if (!ctx.value || !canvasRef.value) return

  ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)

  // Update and draw particles
  for (let i = particles.value.length - 1; i >= 0; i--) {
    const p = particles.value[i]

    // Update position
    p.x += p.vx
    p.y += p.vy
    p.life--
    p.rotation += p.rotationSpeed

    // Apply gravity to sparks
    if (p.type === 'spark') {
      p.vy += 0.1
      p.vx *= 0.98
    } else if (p.type === 'confetti') {
      p.vx += (Math.random() - 0.5) * 0.1
      p.vy += 0.02
    }

    // Remove dead particles
    if (p.life <= 0) {
      particles.value.splice(i, 1)
      continue
    }

    // Calculate opacity based on life
    const opacity = p.life / p.maxLife

    // Draw particle
    ctx.value.save()
    ctx.value.globalAlpha = opacity

    if (p.type === 'spark') {
      // Draw as glowing circle
      const gradient = ctx.value.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
      gradient.addColorStop(0, p.color)
      gradient.addColorStop(1, 'transparent')
      ctx.value.fillStyle = gradient
      ctx.value.beginPath()
      ctx.value.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.value.fill()

      // Add glow
      ctx.value.shadowColor = p.color
      ctx.value.shadowBlur = 10
      ctx.value.fillStyle = p.color
      ctx.value.beginPath()
      ctx.value.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2)
      ctx.value.fill()
    } else if (p.type === 'confetti') {
      // Draw as rotating rectangle
      ctx.value.translate(p.x, p.y)
      ctx.value.rotate(p.rotation)
      ctx.value.fillStyle = p.color
      ctx.value.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
    }

    ctx.value.restore()
  }

  animationFrame = requestAnimationFrame(animate)
}

function launchFireworks() {
  if (!canvasRef.value) return

  const x = Math.random() * canvasRef.value.width
  const y = 100 + Math.random() * (canvasRef.value.height * 0.4)
  createFirework(x, y)
}

// Watch for active state
watch(() => props.active, (active) => {
  if (active) {
    // Start animation loop
    animate()

    // Launch fireworks periodically
    const fireworkInterval = setInterval(() => {
      if (props.active) {
        launchFireworks()
        createConfetti()
      }
    }, props.intensity === 'high' ? 300 : props.intensity === 'medium' ? 600 : 1000)

    // Initial burst
    for (let i = 0; i < 3; i++) {
      setTimeout(() => launchFireworks(), i * 200)
    }

    onUnmounted(() => {
      clearInterval(fireworkInterval)
    })
  } else {
    // Stop animation
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
    particles.value = []
  }
}, { immediate: true })

// Handle resize
function handleResize() {
  if (!canvasRef.value) return
  canvasRef.value.width = window.innerWidth
  canvasRef.value.height = window.innerHeight
}

onMounted(() => {
  if (canvasRef.value) {
    ctx.value = canvasRef.value.getContext('2d')
    handleResize()
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="fixed inset-0 pointer-events-none z-50"
    :class="{ 'opacity-0': !active }"
  />
</template>
