<script setup lang="ts">
import { type InputHTMLAttributes, useAttrs } from 'vue'
import { cn } from '~/lib/utils'

interface Props extends /* @vue-ignore */ InputHTMLAttributes {
  class?: string
  modelValue?: string | number
}

defineProps<Props>()
defineEmits(['update:modelValue'])

const attrs = useAttrs()
</script>

<template>
  <input
    :class="cn(
      'flex w-full bg-arcade-surface border-2 border-arcade-border px-4 py-3',
      'font-retro text-lg text-text-primary placeholder:text-text-muted',
      'focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,255,245,0.3)]',
      'transition-all duration-150',
      props.class
    )"
    :value="modelValue"
    v-bind="attrs"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
