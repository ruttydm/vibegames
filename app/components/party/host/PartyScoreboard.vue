<script setup lang="ts">
import type { PartyPlayer } from '~/composables/usePartyGame'

const props = defineProps<{
  players: PartyPlayer[]
  title?: string
  showRoundScore?: boolean
}>()

// Sort players by score
const sortedPlayers = computed(() => {
  return [...props.players].sort((a, b) => b.score - a.score)
})

// Get position medal
const getMedal = (index: number) => {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return ''
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto">
    <h2 class="text-2xl font-pixel text-neon-yellow text-center mb-8">
      {{ title || 'Scoreboard' }}
    </h2>

    <div class="space-y-3">
      <div
        v-for="(player, index) in sortedPlayers"
        :key="player.id"
        class="flex items-center gap-4 p-4 bg-arcade-surface/50 rounded-lg border transition-all"
        :class="index === 0 ? 'border-neon-yellow/50 shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'border-arcade-border/50'"
      >
        <!-- Position -->
        <div class="w-12 text-center">
          <span v-if="getMedal(index)" class="text-2xl">{{ getMedal(index) }}</span>
          <span v-else class="text-lg font-pixel text-white/50">#{{ index + 1 }}</span>
        </div>

        <!-- Player Info -->
        <div class="flex items-center gap-3 flex-1">
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2"
            :style="{
              backgroundColor: `${player.color}20`,
              borderColor: player.color
            }"
          >
            {{ player.avatar }}
          </div>
          <div>
            <p class="font-retro text-white">{{ player.name }}</p>
            <div v-if="player.streak > 1" class="flex items-center gap-1 text-neon-pink">
              <Icon name="mdi:fire" class="w-4 h-4" />
              <span class="text-xs font-retro">{{ player.streak }} streak!</span>
            </div>
          </div>
        </div>

        <!-- Round Score Change -->
        <div v-if="showRoundScore && player.roundScore" class="text-right">
          <span
            class="font-pixel text-sm"
            :class="player.roundScore > 0 ? 'text-neon-green' : 'text-red-400'"
          >
            {{ player.roundScore > 0 ? '+' : '' }}{{ player.roundScore }}
          </span>
        </div>

        <!-- Total Score -->
        <div class="w-20 text-right">
          <span class="text-2xl font-pixel text-neon-cyan">{{ player.score }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
