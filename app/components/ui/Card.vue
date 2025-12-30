<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

interface Props extends /* @vue-ignore */ HTMLAttributes {
  class?: string
  hoverable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hoverable: true
})
</script>

<template>
  <div
    :class="cn(
      'bg-arcade-surface border-2 border-arcade-border rounded-none',
      hoverable && 'transition-all duration-150 hover:border-neon-cyan hover:shadow-[0_0_15px_rgba(0,255,245,0.3)] hover:-translate-y-1',
      props.class
    )"
  >
    <slot />
  </div>
</template>
