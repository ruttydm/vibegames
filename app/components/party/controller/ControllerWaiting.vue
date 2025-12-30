<script setup lang="ts">
import type { PartyPlayer } from '~/composables/usePartyGame'

defineProps<{
  player: PartyPlayer | null
  players: PartyPlayer[]
  isReady: boolean
}>()

const emit = defineEmits<{
  ready: [value: boolean]
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[80vh] p-4">
    <!-- Player Avatar -->
    <div v-if="player" class="text-center mb-8">
      <div
        class="w-24 h-24 rounded-full flex items-center justify-center text-5xl border-4 mb-4 mx-auto"
        :style="{
          backgroundColor: `${player.color}30`,
          borderColor: player.color,
          boxShadow: `0 0 30px ${player.color}50`
        }"
      >
        {{ player.avatar }}
      </div>
      <p class="text-xl font-pixel text-white">{{ player.name }}</p>
    </div>

    <!-- Ready Button -->
    <button
      @click="emit('ready', !isReady)"
      class="w-full max-w-xs py-6 rounded-lg font-pixel text-xl transition-all active:scale-95"
      :class="isReady
        ? 'bg-neon-green text-arcade-bg border-2 border-neon-green shadow-[0_0_30px_rgba(57,255,20,0.5)]'
        : 'bg-arcade-surface border-2 border-neon-green/50 text-neon-green'"
    >
      {{ isReady ? 'READY!' : 'TAP WHEN READY' }}
    </button>

    <!-- Other Players -->
    <div class="mt-12 w-full max-w-xs">
      <p class="text-sm font-retro text-white/50 text-center mb-4">
        Other players:
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <div
          v-for="p in players.filter(x => x.id !== player?.id)"
          :key="p.id"
          class="flex items-center gap-2 px-3 py-1 rounded-full"
          :class="p.isReady ? 'bg-neon-green/20' : 'bg-arcade-surface'"
        >
          <span class="text-lg">{{ p.avatar }}</span>
          <span class="font-retro text-xs" :class="p.isReady ? 'text-neon-green' : 'text-white/50'">
            {{ p.name }}
          </span>
        </div>
      </div>
    </div>

    <!-- Waiting message -->
    <p class="mt-8 font-retro text-white/50 text-center text-sm">
      Waiting for host to start the game...
    </p>
  </div>
</template>
