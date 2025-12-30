<script setup lang="ts">
const props = defineProps<{
  mode: 'tap_once' | 'mash' | 'hold'
  disabled?: boolean
  hasSubmitted?: boolean
  targetDuration?: number
}>()

const emit = defineEmits<{
  buzz: []
  tapCount: [count: number]
  holdDuration: [duration: number]
}>()

const tapCount = ref(0)
const isHolding = ref(false)
const holdStartTime = ref(0)
const holdDuration = ref(0)

function vibrate(duration: number = 30) {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration)
  }
}

function handleTap() {
  if (props.disabled) return

  vibrate()

  if (props.mode === 'tap_once') {
    emit('buzz')
  } else if (props.mode === 'mash') {
    tapCount.value++
    emit('tapCount', tapCount.value)
  }
}

function handleHoldStart() {
  if (props.disabled || props.mode !== 'hold') return

  isHolding.value = true
  holdStartTime.value = Date.now()
  vibrate(10)
}

function handleHoldEnd() {
  if (!isHolding.value) return

  isHolding.value = false
  holdDuration.value = Date.now() - holdStartTime.value
  emit('holdDuration', holdDuration.value)
  vibrate(50)
}

// Update hold duration display while holding
let holdInterval: ReturnType<typeof setInterval> | null = null
watch(isHolding, (holding) => {
  if (holding) {
    holdInterval = setInterval(() => {
      holdDuration.value = Date.now() - holdStartTime.value
    }, 50)
  } else if (holdInterval) {
    clearInterval(holdInterval)
    holdInterval = null
  }
})

onUnmounted(() => {
  if (holdInterval) clearInterval(holdInterval)
})

// Reset on mode change
watch(() => props.mode, () => {
  tapCount.value = 0
  holdDuration.value = 0
  isHolding.value = false
})
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full p-4">
    <!-- Tap Once Mode -->
    <template v-if="mode === 'tap_once'">
      <button
        @click="handleTap"
        :disabled="disabled || hasSubmitted"
        class="w-48 h-48 rounded-full font-pixel text-2xl transition-all active:scale-90 disabled:opacity-50"
        :class="hasSubmitted
          ? 'bg-neon-green text-arcade-bg shadow-[0_0_50px_rgba(57,255,20,0.5)]'
          : 'bg-neon-pink text-arcade-bg animate-pulse shadow-[0_0_30px_rgba(255,46,99,0.5)]'"
      >
        {{ hasSubmitted ? 'BUZZED!' : 'BUZZ!' }}
      </button>
    </template>

    <!-- Mash Mode -->
    <template v-else-if="mode === 'mash'">
      <div class="text-center mb-8">
        <p class="text-6xl font-pixel text-neon-yellow">{{ tapCount }}</p>
        <p class="font-retro text-white/50 text-sm">taps</p>
      </div>

      <button
        @click="handleTap"
        :disabled="disabled"
        class="w-40 h-40 rounded-full bg-neon-purple text-arcade-bg font-pixel text-xl transition-all active:scale-90 shadow-[0_0_30px_rgba(191,0,255,0.5)] disabled:opacity-50"
      >
        TAP!
      </button>
    </template>

    <!-- Hold Mode -->
    <template v-else-if="mode === 'hold'">
      <div class="text-center mb-8">
        <p class="text-4xl font-pixel text-neon-cyan">
          {{ (holdDuration / 1000).toFixed(2) }}s
        </p>
        <p v-if="targetDuration" class="font-retro text-white/50 text-sm">
          Target: {{ (targetDuration / 1000).toFixed(1) }}s
        </p>
      </div>

      <button
        @touchstart.prevent="handleHoldStart"
        @touchend.prevent="handleHoldEnd"
        @mousedown="handleHoldStart"
        @mouseup="handleHoldEnd"
        @mouseleave="handleHoldEnd"
        :disabled="disabled || hasSubmitted"
        class="w-40 h-40 rounded-full font-pixel text-xl transition-all disabled:opacity-50"
        :class="isHolding
          ? 'bg-neon-green text-arcade-bg scale-110 shadow-[0_0_50px_rgba(57,255,20,0.5)]'
          : hasSubmitted
            ? 'bg-neon-cyan text-arcade-bg'
            : 'bg-neon-yellow text-arcade-bg shadow-[0_0_30px_rgba(255,215,0,0.5)]'"
      >
        {{ isHolding ? 'HOLDING...' : hasSubmitted ? 'DONE!' : 'HOLD' }}
      </button>
    </template>

    <!-- Instructions -->
    <p class="mt-8 font-retro text-white/50 text-sm text-center">
      <template v-if="mode === 'tap_once'">Tap the button to buzz in!</template>
      <template v-else-if="mode === 'mash'">Tap as fast as you can!</template>
      <template v-else-if="mode === 'hold'">Hold and release at the right time!</template>
    </p>
  </div>
</template>
