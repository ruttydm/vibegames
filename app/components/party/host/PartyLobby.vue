<script setup lang="ts">
import type { PartyPlayer } from '~/composables/usePartyGame'

defineProps<{
  roomCode: string
  players: PartyPlayer[]
  canStart: boolean
  isHost: boolean
}>()

const emit = defineEmits<{
  start: []
  kick: [playerId: string]
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto">
    <!-- QR Code Section -->
    <div class="text-center">
      <h2 class="text-2xl font-pixel text-neon-cyan mb-6">
        Scan to Join!
      </h2>
      <PartySharedQRCodeDisplay :room-code="roomCode" />
    </div>

    <!-- Players Section -->
    <div class="w-full">
      <h3 class="text-lg font-pixel text-neon-yellow text-center mb-4">
        Players ({{ players.length }}/6)
      </h3>

      <div class="grid grid-cols-3 md:grid-cols-6 gap-4">
        <!-- Connected Players -->
        <div
          v-for="player in players"
          :key="player.id"
          class="relative"
        >
          <PartySharedPlayerAvatar
            :avatar="player.avatar"
            :color="player.color"
            :name="player.name"
            :is-host="player.isHost"
            :is-ready="player.isReady"
            :connected="player.connected"
            size="lg"
            show-status
          />

          <!-- Kick button (host only, can't kick self) -->
          <button
            v-if="isHost && !player.isHost"
            @click="emit('kick', player.id)"
            class="absolute -top-2 -left-2 p-1 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-full transition-colors"
            title="Remove player"
          >
            <Icon name="mdi:close" class="w-3 h-3 text-red-400" />
          </button>
        </div>

        <!-- Empty Slots -->
        <div
          v-for="i in (6 - players.length)"
          :key="`empty-${i}`"
          class="flex flex-col items-center gap-1"
        >
          <div class="w-20 h-20 rounded-full border-2 border-dashed border-arcade-border/50 flex items-center justify-center">
            <Icon name="mdi:account-plus" class="w-8 h-8 text-arcade-border/50" />
          </div>
          <p class="font-retro text-xs text-white/30">Waiting...</p>
        </div>
      </div>
    </div>

    <!-- Ready Status -->
    <div v-if="players.length >= 2" class="text-center">
      <div class="flex items-center justify-center gap-4 mb-4">
        <div
          v-for="player in players.filter(p => !p.isHost)"
          :key="player.id"
          class="flex items-center gap-2 px-3 py-1 rounded-full"
          :class="player.isReady ? 'bg-neon-green/20 border border-neon-green/50' : 'bg-arcade-border/20 border border-arcade-border/50'"
        >
          <span class="text-sm">{{ player.avatar }}</span>
          <span :class="player.isReady ? 'text-neon-green' : 'text-white/50'" class="font-retro text-xs">
            {{ player.isReady ? 'Ready!' : 'Waiting...' }}
          </span>
        </div>
      </div>

      <p class="font-retro text-sm text-white/70 mb-4">
        {{ canStart ? 'Everyone is ready!' : 'Waiting for players to ready up on their phones...' }}
      </p>
    </div>

    <!-- Start Button (Host only) -->
    <button
      v-if="isHost"
      @click="emit('start')"
      :disabled="!canStart"
      class="px-12 py-4 bg-neon-green/20 border-2 border-neon-green text-neon-green font-pixel text-lg rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-neon-green/30 hover:enabled:shadow-[0_0_30px_rgba(57,255,20,0.5)]"
    >
      {{ players.length < 2 ? 'WAITING FOR PLAYERS...' : canStart ? 'START PARTY!' : 'WAITING FOR READY...' }}
    </button>

    <p v-if="players.length < 2" class="font-retro text-sm text-white/50">
      Need at least 2 players to start
    </p>
  </div>
</template>
