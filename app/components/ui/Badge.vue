<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center font-pixel text-[8px] uppercase tracking-wider px-2 py-1',
  {
    variants: {
      variant: {
        default: 'bg-arcade-surface-light border border-arcade-border text-text-secondary',
        cyan: 'bg-neon-cyan/10 border border-neon-cyan/50 text-neon-cyan',
        pink: 'bg-neon-pink/10 border border-neon-pink/50 text-neon-pink',
        yellow: 'bg-neon-yellow/10 border border-neon-yellow/50 text-neon-yellow',
        green: 'bg-neon-green/10 border border-neon-green/50 text-neon-green',
        purple: 'bg-neon-purple/10 border border-neon-purple/50 text-neon-purple',
        multiplayer: 'bg-neon-pink/20 border border-neon-pink text-neon-pink',
        singleplayer: 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

type BadgeVariants = VariantProps<typeof badgeVariants>

interface Props extends /* @vue-ignore */ HTMLAttributes {
  variant?: BadgeVariants['variant']
}

const props = defineProps<Props>()

const classes = computed(() => cn(badgeVariants({ variant: props.variant }), props.class as string))
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
