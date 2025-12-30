<script setup lang="ts">
import type { Game } from '~/types/game'

interface Props {
  game: Game
}

defineProps<Props>()

const getModeVariant = (mode: Game['mode']) => {
  switch (mode) {
    case 'multiplayer': return 'multiplayer'
    case 'singleplayer': return 'singleplayer'
    default: return 'cyan'
  }
}

const getModeLabel = (mode: Game['mode']) => {
  switch (mode) {
    case 'multiplayer': return 'Multiplayer'
    case 'singleplayer': return 'Solo'
    default: return 'Solo / Multi'
  }
}
</script>

<template>
  <NuxtLink :to="`/games/${game.slug}`" class="block group">
    <Card class="overflow-hidden">
      <!-- Thumbnail -->
      <div class="relative aspect-video bg-arcade-bg overflow-hidden">
        <NuxtImg
          v-if="game.thumbnail"
          :src="game.thumbnail"
          :alt="game.title"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <Icon name="mdi:gamepad-variant" class="text-5xl text-arcade-border" />
        </div>

        <!-- Mode Badge -->
        <Badge :variant="getModeVariant(game.mode)" class="absolute top-2 right-2">
          {{ getModeLabel(game.mode) }}
        </Badge>

        <!-- Hover Overlay -->
        <div class="absolute inset-0 bg-neon-cyan/0 group-hover:bg-neon-cyan/10 transition-colors flex items-center justify-center">
          <span class="font-pixel text-sm text-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity">
            PLAY
          </span>
        </div>
      </div>

      <!-- Info -->
      <div class="p-4">
        <h3 class="font-pixel text-xs text-text-primary mb-2 truncate">
          {{ game.title }}
        </h3>

        <!-- Categories -->
        <div class="flex flex-wrap gap-1 mb-3">
          <Badge v-for="category in game.categories.slice(0, 2)" :key="category" variant="default">
            {{ category }}
          </Badge>
        </div>

        <!-- Play Button -->
        <Button size="sm" class="w-full">
          <Icon name="mdi:play" class="mr-1" />
          Play
        </Button>
      </div>
    </Card>
  </NuxtLink>
</template>
