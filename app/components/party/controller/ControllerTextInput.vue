<script setup lang="ts">
const props = defineProps<{
  placeholder?: string
  disabled?: boolean
  submitLabel?: string
}>()

const emit = defineEmits<{
  submit: [text: string]
}>()

const inputText = ref('')
const hasSubmitted = ref(false)

function handleSubmit() {
  if (!inputText.value.trim() || props.disabled || hasSubmitted.value) return

  emit('submit', inputText.value.trim())
  hasSubmitted.value = true

  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

// Reset when disabled changes (new round)
watch(() => props.disabled, () => {
  if (!props.disabled) {
    hasSubmitted.value = false
    inputText.value = ''
  }
})
</script>

<template>
  <div class="flex flex-col h-full p-4">
    <div class="flex-1 flex flex-col justify-center">
      <input
        v-model="inputText"
        type="text"
        :placeholder="placeholder || 'Type your answer...'"
        :disabled="disabled || hasSubmitted"
        @keyup.enter="handleSubmit"
        class="w-full px-6 py-4 bg-arcade-bg border-2 border-neon-cyan/50 rounded-xl text-white font-retro text-lg text-center focus:border-neon-cyan focus:outline-none disabled:opacity-50"
      />

      <button
        @click="handleSubmit"
        :disabled="disabled || !inputText.trim() || hasSubmitted"
        class="mt-4 w-full py-4 rounded-xl font-pixel text-lg transition-all active:scale-95 disabled:opacity-50"
        :class="hasSubmitted
          ? 'bg-neon-green text-arcade-bg'
          : 'bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan'"
      >
        {{ hasSubmitted ? 'SUBMITTED!' : (submitLabel || 'SUBMIT') }}
      </button>
    </div>

    <p v-if="hasSubmitted" class="text-center font-retro text-neon-green text-sm mt-4">
      Answer submitted! Wait for others...
    </p>
  </div>
</template>
