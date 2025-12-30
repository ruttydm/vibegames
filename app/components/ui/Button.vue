<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-pixel text-xs uppercase tracking-wider transition-all duration-100 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-arcade-surface border-4 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-arcade-bg hover:shadow-[0_0_10px_var(--color-neon-cyan),0_0_20px_var(--color-neon-cyan)]',
        pink: 'bg-arcade-surface border-4 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-arcade-bg hover:shadow-[0_0_10px_var(--color-neon-pink),0_0_20px_var(--color-neon-pink)]',
        yellow: 'bg-arcade-surface border-4 border-neon-yellow text-neon-yellow hover:bg-neon-yellow hover:text-arcade-bg hover:shadow-[0_0_10px_var(--color-neon-yellow),0_0_20px_var(--color-neon-yellow)]',
        green: 'bg-arcade-surface border-4 border-neon-green text-neon-green hover:bg-neon-green hover:text-arcade-bg hover:shadow-[0_0_10px_var(--color-neon-green),0_0_20px_var(--color-neon-green)]',
        ghost: 'bg-transparent border-2 border-arcade-border text-text-secondary hover:border-neon-cyan hover:text-neon-cyan',
        link: 'text-neon-cyan underline-offset-4 hover:underline'
      },
      size: {
        default: 'px-6 py-3',
        sm: 'px-4 py-2 text-[10px]',
        lg: 'px-8 py-4 text-sm',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

type ButtonVariants = VariantProps<typeof buttonVariants>

interface Props extends /* @vue-ignore */ HTMLAttributes {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  as?: string
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button'
})

const classes = computed(() => cn(buttonVariants({ variant: props.variant, size: props.size }), props.class as string))
</script>

<template>
  <component :is="as" :class="classes">
    <slot />
  </component>
</template>
