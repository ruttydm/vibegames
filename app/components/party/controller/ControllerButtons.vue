<script setup lang="ts">
const props = defineProps<{
  options: string[]
  disabled?: boolean
  selectedIndex?: number | null
}>()

const emit = defineEmits<{
  select: [index: number]
}>()

const buttonColors = ['bg-neon-pink', 'bg-neon-cyan', 'bg-neon-yellow', 'bg-neon-green']
const buttonLabels = ['A', 'B', 'C', 'D']

function handleSelect(index: number) {
  if (!props.disabled && props.selectedIndex === undefined) {
    emit('select', index)
  }
}

// Haptic feedback
function vibrate() {
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}
</script>

<template>
  <div class="grid grid-cols-2 gap-3 p-4 h-full">
    <button
      v-for="(option, index) in options"
      :key="index"
      @click="handleSelect(index); vibrate()"
      :disabled="disabled || selectedIndex !== undefined"
      class="relative rounded-xl font-pixel text-arcade-bg transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-2 min-h-[120px]"
      :class="[
        buttonColors[index],
        selectedIndex === index ? 'ring-4 ring-white ring-offset-2 ring-offset-arcade-bg scale-105' : '',
        selectedIndex !== undefined && selectedIndex !== index ? 'opacity-30' : ''
      ]"
    >
      <span class="text-4xl font-bold">{{ buttonLabels[index] }}</span>
      <span class="text-xs px-2 text-center leading-tight">{{ option }}</span>
    </button>
  </div>
</template>
