<script setup lang="ts">
import type { PartyPlayer } from '~/composables/usePartyGame'

const props = defineProps<{
  players: PartyPlayer[]
  currentPlayerId: string
  disabled?: boolean
  selectedId?: string | null
}>()

const emit = defineEmits<{
  vote: [playerId: string]
}>()

// Filter out self from voting options
const votableePlayers = computed(() => {
  return props.players.filter(p => p.id !== props.currentPlayerId)
})

function handleVote(playerId: string) {
  if (!props.disabled && !props.selectedId) {
    emit('vote', playerId)
    vibrate()
  }
}

function vibrate() {
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}
</script>

<template>
  <div class="p-4 space-y-3">
    <p class="text-center font-retro text-white/70 text-sm mb-4">
      Tap to vote:
    </p>

    <button
      v-for="player in votableePlayers"
      :key="player.id"
      @click="handleVote(player.id)"
      :disabled="disabled || !!selectedId"
      class="w-full p-4 rounded-xl border-2 transition-all active:scale-98 flex items-center gap-4"
      :class="[
        selectedId === player.id
          ? 'border-neon-green bg-neon-green/20 shadow-[0_0_20px_rgba(57,255,20,0.3)]'
          : 'border-arcade-border bg-arcade-surface/50 hover:border-white/30',
        selectedId && selectedId !== player.id ? 'opacity-30' : ''
      ]"
      :style="selectedId === player.id ? { borderColor: player.color } : {}"
    >
      <div
        class="w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 flex-shrink-0"
        :style="{
          backgroundColor: `${player.color}20`,
          borderColor: player.color
        }"
      >
        {{ player.avatar }}
      </div>
      <span class="font-retro text-lg text-white">{{ player.name }}</span>

      <div v-if="selectedId === player.id" class="ml-auto">
        <Icon name="mdi:check-circle" class="w-8 h-8 text-neon-green" />
      </div>
    </button>

    <p v-if="selectedId" class="text-center font-retro text-neon-green text-sm mt-4">
      Vote submitted!
    </p>
  </div>
</template>
